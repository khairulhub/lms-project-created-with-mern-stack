const mongoose = require("mongoose");

// Projects shown in the "বাস্তব প্রজেক্ট বানাবে" section on the home page.
// NOT category-specific — shows latest 4 active projects globally.
// Admin can set displayStyle: "grid" (2-col grid) or "slider" (card carousel).
const courseProjectSchema = new mongoose.Schema(
  {
    emoji:       { type: String, default: "🚀" },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    techTags:    [{ type: String, trim: true }],   // ["React", "Node.js", "MongoDB"]
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseProjectSchema.index({ isActive: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("CourseProject", courseProjectSchema);