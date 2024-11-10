const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080; // Use the Railway-provided port

// Multer setup for handling file uploads with file type validation
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    const extName = fileTypes.test(file.originalname.split(".").pop().toLowerCase());

    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error("Only .jpg, .jpeg, and .png formats are allowed!"));
  },
});

// Root Endpoint for checking server status
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});

// API Endpoint for detecting face shape
app.post("/detect-face-shape", upload.single("image"), async (req, res) => {
  try {
    console.log("Received request for /detect-face-shape");

    // Step 1: Check if an image file was uploaded
    if (!req.file) {
      console.error("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("File uploaded:", req.file.originalname);

    // Step 2: Read the uploaded file into a buffer
    const imagePath = req.file.path;
    let imageBuffer;
    try {
      imageBuffer = fs.readFileSync(imagePath);
    } catch (readError) {
      console.error("Error reading uploaded image:", readError.message);
      return res.status(500).json({ error: "Failed to read the uploaded image" });
    }

    // Step 3: Create FormData with the image buffer
    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    // Step 4: Set up the request options for RapidAPI
    const options = {
      method: "POST",
      url: `https://${process.env.RAPIDAPI_HOST}/v1/detect`,
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        ...formData.getHeaders(),
      },
      data: formData,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    console.log("Sending request to RapidAPI...");

    // Step 5: Make the API request to RapidAPI
    let apiResponse;
    try {
      apiResponse = await axios(options);
    } catch (apiError) {
      console.error("Error calling RapidAPI:", apiError.message);

      // Handle errors from the API response
      if (apiError.response) {
        console.error("API response error:", apiError.response.data);
        return res.status(apiError.response.status).json(apiError.response.data);
      }
      return res.status(500).json({ error: "Failed to detect face shape" });
    }

    console.log("Response from RapidAPI received:", apiResponse.data);

    // Step 6: Clean up by deleting the uploaded file after processing
    try {
      fs.unlinkSync(imagePath);
    } catch (deleteError) {
      console.error("Error deleting the uploaded file:", deleteError.message);
    }

    // Step 7: Send the successful response back to the client
    return res.status(200).json(apiResponse.data);

  } catch (error) {
    console.error("Unexpected error during face shape detection:", error.message);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Start the server on the correct port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
