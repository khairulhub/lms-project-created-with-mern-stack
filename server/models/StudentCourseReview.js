const mongoose = require("mongoose");

const studentCourseReviewSchema = new mongoose.Schema(
  {
    course:   { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    name:     { type: String, required: true, trim: true },
    email:    { type: String, default: "", trim: true, lowercase: true },
    rating:   { type: Number, default: 5, min: 1, max: 5 },
    text:     { type: String, required: true, trim: true },
    // admin controls
    status:   { type: String, enum: ["pending", "active", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: false }, // true = show on public page
    adminNote:{ type: String, default: "" },
  },
  { timestamps: true }
);

studentCourseReviewSchema.index({ course: 1, status: 1, createdAt: -1 });
studentCourseReviewSchema.index({ course: 1, isActive: 1 });

module.exports = mongoose.model("StudentCourseReview", studentCourseReviewSchema);
