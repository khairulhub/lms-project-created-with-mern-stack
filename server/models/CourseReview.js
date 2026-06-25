const mongoose = require("mongoose");

const courseReviewSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    role:     { type: String, default: "" },
    avatarSeed: { type: String, default: "" },   // dicebear seed
    rating:   { type: Number, default: 5, min: 1, max: 5 },
    text:     { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseReviewSchema.index({ isActive: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("CourseReview", courseReviewSchema);
