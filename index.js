const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080; // Use Railway's port if available

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

// Root route to check if server is running
app.get("/", (req, res) => {
  res.status(200).send("Face Shape Detection API is running!");
});

// API Endpoint for detecting face shape
app.post("/detect-face-shape", upload.single("image"), async (req, res) => {
  try {
    console.log("Received request for /detect-face-shape");

    if (!req.file) {
      console.error("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Create a FormData instance with the image
    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    // Prepare the request options for RapidAPI
    const options = {
      method: "POST",
      url: `https://${process.env.RAPIDAPI_HOST}/v1/detect`,
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    console.log("Sending request to RapidAPI...");

    // Send the request to RapidAPI
    const response = await axios(options);

    console.log("Response from RapidAPI:", response.data);

    // Clean up the uploaded file after processing
    fs.unlinkSync(imagePath);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);

    // Handle errors related to the API response
    if (error.response) {
      console.error("API response error:", error.response.data);
      return res.status(error.response.status).json({ error: error.response.data });
    }

    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
