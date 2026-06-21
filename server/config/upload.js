const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Where uploaded course-preview videos are stored on disk. Served back out
// statically at /uploads/videos/<filename> (see index.js static middleware).
const VIDEO_DIR = path.join(__dirname, "..", "uploads", "videos");
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB hard limit

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEO_DIR),
  filename: (req, file, cb) => {
    // Unique, collision-safe name: <timestamp>-<random>-<original ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const ALLOWED_MIME = [
  "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported video format. Use MP4, WebM, OGG, MOV, or MKV."));
};

const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter,
});

module.exports = { uploadVideo, VIDEO_DIR, MAX_VIDEO_SIZE };
