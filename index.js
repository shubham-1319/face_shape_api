const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;  // Use the port from the environment or fallback to 5000

// Multer setup for handling file uploads with file type validation
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Check the file type
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    const extName = fileTypes.test(
      file.originalname.split(".").pop().toLowerCase()
    );

    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error("Only .jpg, .jpeg, and .png formats are allowed!"));
  },
});

// API Endpoint for detecting face shape
app.post("/detect-face-shape", upload.single("image"), async (req, res) => {
  try {
    // Check if an image file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Prepare formData to send to the RapidAPI service
    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    // Set the options for the request to RapidAPI
    const options = {
      method: "POST",
      url: `https://${process.env.RAPIDAPI_HOST}/v1/detect`,
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        ...formData.getHeaders(),  // Ensure correct headers for formData
      },
      data: formData,
    };

    // Send the request to RapidAPI
    const response = await axios(options);

    // Clean up: Delete the uploaded image after processing
    fs.unlinkSync(imagePath);

    // Send back the face shape data from RapidAPI
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);
    
    // If the error comes from the API response, return the details
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle general errors
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

// Start the server on the correct port
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);  // Ensure it listens on the correct address
});
