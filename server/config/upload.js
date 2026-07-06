const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

// Cloudinary free-tier hard caps out unsigned/free-plan video uploads at
// 100MB per file — keeping our own limit at-or-below that so multer rejects
// an oversized file with our own friendly message instead of Cloudinary
// erroring out mid-upload.
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Videos are streamed straight to Cloudinary (resource_type: "video") —
// nothing touches the server's local disk, so files survive redeploys on
// ephemeral filesystems (Render/Railway/etc wipe local disk on every deploy).
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "lms/course-videos",
    resource_type: "video",
    // Cloudinary auto-generates a public_id if omitted; we add a readable
    // prefix + timestamp so files are easy to spot in the Cloudinary console.
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
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

module.exports = { uploadVideo, MAX_VIDEO_SIZE };
