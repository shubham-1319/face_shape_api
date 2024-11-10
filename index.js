const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

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
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    const options = {
      method: "POST",
      url: "https://face-shape-detection.p.rapidapi.com/v1/detect", // Ensure this matches RapidAPI docs
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

    // Send the request to RapidAPI
    const response = await axios(options);
    console.log("Full Response from RapidAPI:", JSON.stringify(response.data, null, 2)); // Inspect response structure

    // Clean up the uploaded file after processing
    fs.unlinkSync(imagePath);

    // Check if the response has a face shape result and send it
    if (response.data && response.data.face_shape) {
      return res.status(200).json(response.data.face_shape);
    } else {
      return res.status(200).json({ message: "No face shape detected" });
    }
  } catch (error) {
    console.error("Error during face shape detection:", error.message);
    if (error.response) {
      console.error("API response error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

