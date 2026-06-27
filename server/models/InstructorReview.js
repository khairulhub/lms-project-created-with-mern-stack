const mongoose = require("mongoose");

const instructorReviewSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:       { type: String, required: true, trim: true },
    email:      { type: String, default: "", trim: true, lowercase: true },
    rating:     { type: Number, default: 5, min: 1, max: 5 },
    text:       { type: String, required: true, trim: true },
    // admin controls
    status:     { type: String, enum: ["pending", "active", "rejected"], default: "pending" },
    isActive:   { type: Boolean, default: false },
    adminNote:  { type: String, default: "" },
  },
  { timestamps: true }
);

instructorReviewSchema.index({ instructor: 1, status: 1, createdAt: -1 });
instructorReviewSchema.index({ instructor: 1, isActive: 1 });

module.exports = mongoose.model("InstructorReview", instructorReviewSchema);
