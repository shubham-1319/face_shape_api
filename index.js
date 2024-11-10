const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
      console.error("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("File received:", req.file);

    const imagePath = req.file.path;

    // Read the uploaded image file into a buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Create a FormData instance and append the image buffer
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

    // Clean up: Delete the uploaded image after processing
    fs.unlinkSync(imagePath);

    // Send the response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);

    // If the error comes from the API response
    if (error.response) {
      console.error("Error details:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle other errors
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
