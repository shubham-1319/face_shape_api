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
    console.log("Received request for /detect-face-shape");

    // Check if an image file was uploaded
    if (!req.file) {
      console.error("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("File uploaded:", req.file.originalname);

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Create a FormData instance and append the image buffer
    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    // Set up the request options for RapidAPI
    const options = {
      method: "POST",
      url: "https://face-shape-detection.p.rapidapi.com/v1/detect", // Adjust this URL as per your RapidAPI documentation
      headers: {
        "X-RapidAPI-Key": "ecc9db9954mshbcd73740f511dddp10b2a3jsnecbeebccb59e",
        "X-RapidAPI-Host": "face-shape-detection.p.rapidapi.com",
        ...formData.getHeaders(),
      },
      data: formData,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    console.log("Sending request to RapidAPI...");

    // Send the request to RapidAPI
    const response = await axios(options);
    console.log("Received response from RapidAPI:", response.data);

    // Clean up the uploaded file after processing
    fs.unlinkSync(imagePath);

    // Send the response back to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);

    // Handle errors from the API response
    if (error.response) {
      console.error("API response error:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle other errors
    return res.status(500).json({ error: "Face shape detection failed" });
  }
});

// Root route to verify server is running
app.get("/", (req, res) => {
  res.send("Face Shape Detection API is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
