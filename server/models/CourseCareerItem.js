const mongoose = require("mongoose");

// Career items shown in "কোর্স শেষে তোমার ক্যারিয়ার" section.
// Each item is a bullet point / card on the left list or right stat card.
// type: "bullet" → left side list item  (icon + text)
//       "stat"   → right side stat card (value + label + gradient colors)
const courseCareerItemSchema = new mongoose.Schema(
  {
    type:      { type: String, enum: ["bullet", "stat"], default: "bullet" },
    icon:      { type: String, default: "🚀" },          // emoji icon
    text:      { type: String, default: "" },             // bullet text (type=bullet)
    value:     { type: String, default: "" },             // stat number e.g. "৫০০+"
    label:     { type: String, default: "" },             // stat label e.g. "সফল গ্র্যাজুয়েট"
    colorFrom: { type: String, default: "#7c3aed" },      // gradient start (type=stat)
    colorTo:   { type: String, default: "#6d28d9" },      // gradient end   (type=stat)
    isActive:  { type: Boolean, default: true },
    order:     { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseCareerItemSchema.index({ isActive: 1, type: 1, order: 1 });

module.exports = mongoose.model("CourseCareerItem", courseCareerItemSchema);
