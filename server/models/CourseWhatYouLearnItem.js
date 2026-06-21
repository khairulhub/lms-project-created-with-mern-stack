const mongoose = require("mongoose");

// Each checklist bullet ("HTML5 ও CSS3 দিয়ে সুন্দর ওয়েবসাইট বানানো", etc.) shown
// in the "কী কী শিখবে এই কোর্সে?" section — scoped to ONE category. Admin has
// full CRUD over these per category from /admin/course-details/what-you-learn.
const courseWhatYouLearnItemSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    text: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseWhatYouLearnItemSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model("CourseWhatYouLearnItem", courseWhatYouLearnItemSchema);
