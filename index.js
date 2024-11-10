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

// Serve a basic HTML form to upload an image
app.post("/", (req, res) => {
  const htmlForm = `
    <html>
      <body>
        <h2>Upload Image for Face Shape Detection</h2>
        <form action="/detect-face-shape" method="POST" enctype="multipart/form-data">
          <label for="image">Select Image:</label>
          <input type="file" name="image" id="image" accept="image/*" required>
          <br>
          <button type="submit">Upload</button>
        </form>
      </body>
    </html>
  `;
  res.send(htmlForm);
});

// API Endpoint for detecting face shape
app.post("/detect-face-shape", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    const formData = new FormData();
    formData.append("image", imageBuffer, req.file.originalname);

    const options = {
      method: "POST",
      url: `https://detect-face-shape.p.rapidapi.com/api/predict `, // Replace with your actual endpoint
      headers: {
        "X-RapidAPI-Key": process.env.ecc9db9954mshbcd73740f511dddp10b2a3jsnecbeebccb59e,
        "X-RapidAPI-Host": process.env.face-shape-detection.p.rapidapi.com,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    const response = await axios(options);

    // Clean up the uploaded file after processing
    fs.unlinkSync(imagePath);

    // Return a success message and face shape details
    res.send(`
      <html>
        <body>
          <h2>Face Shape Detection Result</h2>
          <pre>${JSON.stringify(response.data, null, 2)}</pre>
          <br>
          <a href="/">Upload another image</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error during face shape detection:", error.message);
    return res.status(500).send("Face shape detection failed");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
