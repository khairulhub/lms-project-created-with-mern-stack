const mongoose = require("mongoose");

const siteConfigSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "LMS Platform" },
    logoUrl: { type: String, default: "" },       // imgBB image URL
    logoText: { type: String, default: "LMS" },   // fallback text if no image
    enrollUrl: { type: String, default: "/enroll" }, // enroll button link
    showLogoImage: { type: Boolean, default: false }, // true = image, false = text
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteConfig", siteConfigSchema);
