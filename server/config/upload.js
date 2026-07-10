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

// ── Chat attachments (images + common document files) ───────────────────────
// resource_type: "auto" — Cloudinary nijei bujhe nay image na video na raw file.
const MAX_CHAT_FILE_SIZE = 15 * 1024 * 1024; // 15MB, chat attachment-er jonno যথেষ্ট

const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "lms/chat-attachments",
    resource_type: "auto",
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
});

const ALLOWED_CHAT_MIME = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip", "application/x-zip-compressed", "application/x-rar-compressed", "application/vnd.rar",
  "text/plain", "text/csv",
];

const ALLOWED_CHAT_EXT = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".zip", ".rar", ".txt", ".csv",
];

// Onek browser/OS (biseshoto Windows) docx/zip/rar file-er jonno generic
// "application/octet-stream" mimetype pathay — shudhu mimetype check korle
// oi shob file reject hoye jay. Tai mimetype na milleo extension mile
// allow kori — dutar jekono ekta match korleyi thik ache.
const chatFileFilter = (req, file, cb) => {
  const ext = require("path").extname(file.originalname || "").toLowerCase();
  if (ALLOWED_CHAT_MIME.includes(file.mimetype) || ALLOWED_CHAT_EXT.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error("এই ধরনের ফাইল সাপোর্টেড না। ছবি, PDF, Word, Excel, PowerPoint, ZIP/RAR অথবা টেক্সট ফাইল দিন।"));
};

const uploadChatFile = multer({
  storage: chatStorage,
  limits: { fileSize: MAX_CHAT_FILE_SIZE },
  fileFilter: chatFileFilter,
});

module.exports = { uploadVideo, MAX_VIDEO_SIZE, uploadChatFile, MAX_CHAT_FILE_SIZE };
