const mongoose = require("mongoose");

// Each card shown in the "এই কোর্সে তুমি কী পাবে?" (Course Highlights) section
// on the home page. Every item belongs to ONE category (MERN / PHP-Laravel /
// Networking / any future category) — admin has full CRUD over these from
// /admin/course-details/highlights, including which category an item belongs to.
const courseHighlightItemSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    icon: { type: String, default: "🤖" },          // emoji OR a reserved icon-key (see ICON_LIBRARY)
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },       // inactive = hidden from public page
    order: { type: Number, default: 0 },               // controls display order (ascending) within its category
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseHighlightItemSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model("CourseHighlightItem", courseHighlightItemSchema);
