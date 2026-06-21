const mongoose = require("mongoose");

// One settings-doc PER CATEGORY for the "কী কী শিখবে এই কোর্সে?" section —
// heading + subtitle only. The actual bullet points live in
// CourseWhatYouLearnItem (full CRUD collection), same split as
// CourseHighlightSection / CourseHighlightItem.
const courseWhatYouLearnSectionSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, unique: true },
    heading: { type: String, default: "কী কী শিখবে এই কোর্সে?" },
    subtitle: { type: String, default: "শেষ করলে তুমি একজন দক্ষ Full Stack Developer হয়ে যাবে" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseWhatYouLearnSection", courseWhatYouLearnSectionSchema);
