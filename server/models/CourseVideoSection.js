const mongoose = require("mongoose");

// One video-section settings-doc PER CATEGORY for the "কোর্সের একটু আভাস নাও"
// section. Admin picks EITHER a YouTube/external URL OR uploads a video file
// (max 200MB, enforced in config/upload.js) — videoType decides which one the
// public page actually renders.
//
// Auto-created with defaults the first time a category is requested (same
// "auto-create" pattern as CourseHeroSection / CourseHighlightSection).
const courseVideoSectionSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, unique: true },
    heading: { type: String, default: "কোর্সের একটু আভাস নাও" },
    subtitle: { type: String, default: "ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই" },

    // "youtube" = embed videoUrl in an <iframe>; "upload" = play uploadedVideoPath via <video>
    videoType: { type: String, enum: ["youtube", "upload"], default: "youtube" },

    videoUrl: { type: String, default: "https://www.youtube.com/embed/zAbT_zvSaM4" }, // used when videoType === "youtube"

    // Used when videoType === "upload" — populated by the upload endpoint
    uploadedVideoPath: { type: String, default: "" },   // e.g. "/uploads/videos/169...-clip.mp4"
    uploadedVideoName: { type: String, default: "" },   // original filename, for admin UI display
    uploadedVideoSize: { type: Number, default: 0 },     // bytes, for admin UI display
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseVideoSection", courseVideoSectionSchema);
