const mongoose = require("mongoose");

// Singleton settings for the Projects section.
// displayStyle: "grid"   → 2-column card grid  (current/default design)
//               "slider" → horizontal card carousel with prev/next
// heading / subtitle are admin-editable.
const courseProjectSettingsSchema = new mongoose.Schema(
  {
    heading:      { type: String, default: "বাস্তব প্রজেক্ট বানাবে" },
    subtitle:     { type: String, default: "শুধু থিওরি না — real-world project যা portfolio তে রাখতে পারবে" },
    displayStyle: { type: String, enum: ["grid", "slider"], default: "grid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseProjectSettings", courseProjectSettingsSchema);