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

// Basic GET route for debugging (to check if the server is running)
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// Multer setup for handling file uploads with file type validation
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
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

    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

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

    const response = await axios(options);

    // Clean up the uploaded file after processing
    fs.unlinkSync(imagePath);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

// Start the server on the correct port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
