const mongoose = require("mongoose");

const instructorRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: { type: String, default: "" }, // why they want to become instructor
    adminNote: { type: String, default: "" }, // admin rejection/approval note
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstructorRequest", instructorRequestSchema);
