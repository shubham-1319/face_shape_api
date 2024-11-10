const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;  // Use the port from the environment

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

// API Endpoint for detecting face shape
app.post("/detect-face-shape", upload.single("image"), async (req, res) => {
  try {
    // Check if an image file is uploaded
    if (!req.file) {
      console.error("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("File uploaded:", req.file.originalname);

    // Path to the uploaded image file
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Create FormData instance and append the image buffer
    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    // Prepare the options for the RapidAPI request
    const options = {
      method: "POST",
      url: `https://face-shape-detection.p.rapidapi.com/v1/detect`, // Ensure this is the correct URL
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,  // Use your RapidAPI Key from the environment variables
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,  // The host name of the API
        ...formData.getHeaders(),
      },
      data: formData,
      timeout: 30000,  // Set a timeout for the request (30 seconds)
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    console.log("Sending request to RapidAPI...");

    // Send the request to RapidAPI
    const response = await axios(options);

    // Log the full response for debugging
    console.log("Full Response from RapidAPI:", JSON.stringify(response.data, null, 2));

    // Clean up: Delete the uploaded image after processing
    fs.unlinkSync(imagePath);

    // Return the response data to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);

    // If there's a response from the API, log and return the error
    if (error.response) {
      console.error("API response error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    // If no response received from the API
    if (error.request) {
      console.error("No response received from API:", error.request);
      return res.status(502).json({ error: "No response from the API" });
    }

    // Handle other errors
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// Start the server on the correct port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
