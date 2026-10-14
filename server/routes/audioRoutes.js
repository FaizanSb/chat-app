
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const audioDirectory = path.join(
  process.cwd(),
  "uploads",
  "audio"
);

fs.mkdirSync(audioDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDirectory);
  },

  filename: (req, file, cb) => {
    const extensionMap = {
      "audio/webm": ".webm",
      "audio/ogg": ".ogg",
      "audio/mp4": ".mp4",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/x-wav": ".wav",
    };

    const extension = extensionMap[file.mimetype];

    if (!extension) {
      return cb(new Error("Unsupported audio format"));
    }

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
    ];

    cb(
      allowedTypes.includes(file.mimetype)
        ? null
        : new Error("Unsupported audio format"),
      allowedTypes.includes(file.mimetype)
    );
  },
});

router.post("/", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please upload an audio file.",
    });
  }

  const audioUrl =
    `${req.protocol}://${req.get("host")}/uploads/audio/${req.file.filename}`;

  res.status(201).json({
    audioUrl,
  });
});

module.exports = router;
