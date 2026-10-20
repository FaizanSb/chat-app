const express = require("express");
const multer = require("multer");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const router = express.Router();

const allowedTypes = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported audio format"));
  },
});


router.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an audio file." });
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "chat-app/audio",
      resource_type: "video", // Cloudinary audio ko "video" category mein rakhta hai
    });

    res.status(201).json({ audioUrl: result.secure_url });
  } catch (error) {
    console.error("Audio upload failed:", error.message);
    res.status(500).json({ message: "Audio upload failed." });
  }
});

module.exports = router;