const mongoose = require("mongoose");

// One settings-doc PER CATEGORY for the "এই কোর্সে তুমি কী পাবে?" section —
// heading, subtitle, and the "যা যা শিখবে" tech-tag list. The individual
// highlight CARDS (AI-Powered Learning, Structured Path, etc.) live in
// CourseHighlightItem — this model only holds the section-level text that
// wraps around those cards. Auto-created with defaults the first time a
// category is requested (same "auto-create" pattern as CourseHeroSection),
// so it always returns something even before the admin has touched it.
const courseHighlightSectionSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, unique: true },
    heading: { type: String, default: "এই কোর্সে তুমি কী পাবে?" },
    subtitle: { type: String, default: "একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট" },
    techTagsLabel: { type: String, default: "যা যা শিখবে:" },
    techTags: { type: [String], default: [] }, // e.g. ["HTML","CSS","React","Node.js",...]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseHighlightSection", courseHighlightSectionSchema);
