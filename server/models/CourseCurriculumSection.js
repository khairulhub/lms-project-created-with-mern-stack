const mongoose = require("mongoose");

// One settings-doc PER CATEGORY for the "কোর্সের সিলেবাস" section —
// heading + subtitle only. The individual modules (weeks/topics) live in
// CourseCurriculumModule. Auto-created with defaults on first access,
// same pattern as CourseHighlightSection / CourseWhatYouLearnSection.
const courseCurriculumSectionSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, unique: true },
    heading:  { type: String, default: "কোর্সের সিলেবাস" },
    subtitle: { type: String, default: "সম্পূর্ণ কোর্স কারিকুলাম একনজরে দেখো" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseCurriculumSection", courseCurriculumSectionSchema);