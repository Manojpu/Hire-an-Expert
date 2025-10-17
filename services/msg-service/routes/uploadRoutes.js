const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedVoiceTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/webm'];
  
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes, ...allowedVoiceTypes];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: images (jpg, png), documents (pdf, doc, docx), voice (mp3, wav, ogg, m4a, webm)`), false);
  }
};

// Configure multer with size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Upload endpoint
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    console.log(`📤 Uploading file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

    // Determine resource type based on mimetype
    let resourceType = "auto";
    let folder = "chat-attachments";
    
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      folder = "chat-attachments/images";
    } else if (file.mimetype.startsWith("audio/")) {
      resourceType = "video"; // Cloudinary uses 'video' for audio files
      folder = "chat-attachments/voice";
    } else {
      resourceType = "raw"; // For documents
      folder = "chat-attachments/documents";
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: folder,
          use_filename: true,
          unique_filename: true,
          // Optimize images
          ...(resourceType === "image" && {
            transformation: [
              { quality: "auto:good" },
              { fetch_format: "auto" }
            ]
          })
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ File uploaded successfully:", result.secure_url);
            resolve(result);
          }
        }
      );

      // Pipe the file buffer to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    const result = await uploadPromise;

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (resourceType === "image") {
      thumbnailUrl = cloudinary.url(result.public_id, {
        transformation: [
          { width: 300, height: 300, crop: "fill" },
          { quality: "auto:low" }
        ]
      });
    }

    // Return upload result
    res.json({
      success: true,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      resourceType: result.resource_type,
      thumbnailUrl: thumbnailUrl,
      duration: result.duration || null, // for audio/video files
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    if (error.message.includes("File size")) {
      return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
    }
    
    res.status(500).json({ 
      error: "Upload failed", 
      details: error.message 
    });
  }
});

module.exports = router;
