const mongoose = require("mongoose");

// Each accordion module shown in the "কোর্সের সিলেবাস" section —
// e.g. "Week 1-2 — HTML & CSS Foundation (18 লেসন · 6h 30m)".
// Every module belongs to ONE category. Admin has full CRUD over these
// from /admin/course-details/curriculum.
const courseCurriculumModuleSchema = new mongoose.Schema(
  {
    category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    week:        { type: String, required: true, trim: true },          // e.g. "Week 1-2"
    title:       { type: String, required: true, trim: true },          // e.g. "HTML & CSS Foundation"
    lessons:     { type: Number, default: 0 },                          // lesson count
    duration:    { type: String, default: "" },                         // e.g. "6h 30m"
    topics:      { type: [String], default: [] },                       // list of topic strings
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseCurriculumModuleSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model("CourseCurriculumModule", courseCurriculumModuleSchema);