// Quiz model — প্রতিটা curriculum section এর শেষে একটা quiz থাকবে।
// sectionId = CourseDetail.curriculum[]._id (subdocument _id)
// admin quiz create/edit করবে, student attempt করবে।
const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text:      { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: true });

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options:  [optionSchema],
  order:    { type: Number, default: 0 },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  sectionId:   { type: mongoose.Schema.Types.ObjectId, required: true }, // curriculum section _id
  title:       { type: String, default: "Section Quiz" },
  questions:   [questionSchema],
  passMark:    { type: Number, default: 60 }, // % to pass
  maxAttempts: { type: Number, default: 2 },  // admin সেট করতে পারবে — 0 মানে unlimited
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

quizSchema.index({ course: 1, sectionId: 1 }, { unique: true });
module.exports = mongoose.model("Quiz", quizSchema);
