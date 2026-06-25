const mongoose = require("mongoose");

// Singleton settings for the Career section.
// displayStyle: "split"  → left bullets + right stat grid (current/default)
//               "cards"  → 3 horizontal feature cards
const courseCareerSettingsSchema = new mongoose.Schema(
  {
    heading:      { type: String, default: "কোর্স শেষে তোমার ক্যারিয়ার 🚀" },
    subtitle:     { type: String, default: "আমাদের ৫০০+ গ্র্যাজুয়েট দেশে এবং বিদেশে সফলভাবে কাজ করছে। চাকরি, ফ্রিল্যান্সিং বা নিজের স্টার্টআপ — যেকোনো পথে প্রস্তুত করব।" },
    displayStyle: { type: String, enum: ["split", "cards"], default: "split" },
    bulletLimit:  { type: Number, default: 3, min: 1, max: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseCareerSettings", courseCareerSettingsSchema);
