// Student এর assignment submission
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment:  { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  moduleIndex: { type: Number, required: true },
  answerText:  { type: String, default: "" },   // written answer
  fileUrl:     { type: String, default: "" },   // optional file/link submission
  status:      { type: String, enum: ["submitted","reviewed","accepted","rejected"], default: "submitted" },
  feedback:    { type: String, default: "" },   // instructor/admin feedback
  mark:        { type: Number, default: null, min: 0, max: 50 }, // প্রতিটা assignment fixed 50 mark এর উপর
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

submissionSchema.index({ assignment: 1, user: 1 }, { unique: true });
module.exports = mongoose.model("AssignmentSubmission", submissionSchema);
