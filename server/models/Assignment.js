// Module-level assignment — সব section+quiz শেষ হলে student submit করবে।
// moduleIndex = curriculum section index (0-based)
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  moduleIndex: { type: Number, required: true }, // which module (section index in curriculum)
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  deadline:    { type: Date, default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

assignmentSchema.index({ course: 1, moduleIndex: 1 }, { unique: true });
module.exports = mongoose.model("Assignment", assignmentSchema);
