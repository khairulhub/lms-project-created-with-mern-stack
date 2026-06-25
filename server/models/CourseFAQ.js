const mongoose = require("mongoose");

const courseFAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer:   { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseFAQSchema.index({ isActive: 1, order: 1 });
module.exports = mongoose.model("CourseFAQ", courseFAQSchema);
