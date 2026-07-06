// Student এর quiz attempt — answers + score track করে।
// Student একটা quiz বার বার দিতে পারবে।
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  course:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answers:   [answerSchema],
  score:     { type: Number, default: 0 },   // % score
  passed:    { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
