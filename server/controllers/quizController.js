const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

// ── Admin: create/update quiz for a section ───────────────────────────────
const upsertQuiz = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const { title, questions, passMark, maxAttempts, isActive } = req.body;

  let quiz = await Quiz.findOne({ course: courseId, sectionId });
  if (quiz) {
    if (title !== undefined) quiz.title = title;
    if (questions !== undefined) quiz.questions = questions;
    if (passMark !== undefined) quiz.passMark = passMark;
    if (maxAttempts !== undefined) quiz.maxAttempts = maxAttempts;
    if (isActive !== undefined) quiz.isActive = isActive;
    await quiz.save();
  } else {
    quiz = await Quiz.create({ course: courseId, sectionId, title, questions, passMark, maxAttempts, isActive });
  }
  res.json(quiz);
});

// ── Admin: toggle active/inactive (quick switch, no full payload needed) ──
const toggleQuizActive = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const quiz = await Quiz.findOne({ course: courseId, sectionId });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  quiz.isActive = !quiz.isActive;
  await quiz.save();
  res.json(quiz);
});

// ── Admin: delete quiz ────────────────────────────────────────────────────
const deleteQuiz = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  await Quiz.deleteOne({ course: courseId, sectionId });
  res.json({ message: "Quiz deleted" });
});

// ── Admin: get all quizzes for a course ──────────────────────────────────
const getCourseQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.courseId });
  res.json(quizzes);
});

// ── Student: get quiz for a section (no correct answers revealed) ─────────
const getStudentQuiz = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const quiz = await Quiz.findOne({ course: courseId, sectionId, isActive: true }).lean();
  if (!quiz) return res.status(404).json({ message: "No quiz for this section" });

  const safe = {
    ...quiz,
    questions: quiz.questions.map(q => ({
      ...q,
      options: q.options.map(o => ({ _id: o._id, text: o.text })),
    })),
  };

  const allAttempts = await QuizAttempt.find({ user: req.user._id, quiz: quiz._id })
    .sort({ submittedAt: -1 }).lean();

  const attemptCount = allAttempts.length;
  const attemptsLeft = quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - attemptCount) : null; // null = unlimited
  const canAttempt = quiz.maxAttempts === 0 || attemptCount < quiz.maxAttempts;

  res.json({
    quiz: safe,
    lastAttempt: allAttempts[0] || null,
    attemptCount,
    attemptsLeft,
    canAttempt,
  });
});

// ── Student: submit quiz attempt ──────────────────────────────────────────
const submitQuiz = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const { answers } = req.body; // [{ questionId, selectedOptionId }]

  const quiz = await Quiz.findOne({ course: courseId, sectionId, isActive: true });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  // ── Max attempts check — admin per-quiz সেট করতে পারে, 0 = unlimited ─────
  const existingCount = await QuizAttempt.countDocuments({ user: req.user._id, quiz: quiz._id });
  if (quiz.maxAttempts > 0 && existingCount >= quiz.maxAttempts) {
    return res.status(403).json({
      message: `তুমি সর্বোচ্চ ${quiz.maxAttempts} বার quiz দিয়েছো। আর attempt বাকি নেই।`,
      maxAttemptsReached: true,
    });
  }

  let correct = 0;
  (answers || []).forEach(ans => {
    const q = quiz.questions.find(q => String(q._id) === String(ans.questionId));
    if (!q) return;
    const opt = q.options.find(o => String(o._id) === String(ans.selectedOptionId));
    if (opt?.isCorrect) correct++;
  });
  const total = quiz.questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= quiz.passMark;

  const attempt = await QuizAttempt.create({
    user: req.user._id,
    quiz: quiz._id,
    course: courseId,
    sectionId,
    answers,
    score,
    passed,
  });

  const newCount = existingCount + 1;
  const attemptsLeft = quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - newCount) : null;

  res.json({
    score,
    passed,
    correct,
    total,
    passMark: quiz.passMark,
    attemptId: attempt._id,
    attemptsLeft,
    questions: quiz.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options.map(o => ({ _id: o._id, text: o.text, isCorrect: o.isCorrect })),
      yourAnswer: (answers || []).find(a => String(a.questionId) === String(q._id))?.selectedOptionId || null,
    })),
  });
});

// ── Student: get all quiz attempts for a course (best score per section) ──
const getMyCourseAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.aggregate([
    { $match: { user: req.user._id, course: new mongoose.Types.ObjectId(req.params.courseId) } },
    { $sort: { score: -1 } },
    { $group: {
      _id: "$sectionId",
      sectionId: { $first: "$sectionId" },
      score: { $first: "$score" },       // best score
      passed: { $first: "$passed" },
      submittedAt: { $first: "$submittedAt" },
      attemptCount: { $sum: 1 },
    }},
  ]);
  res.json(attempts);
});

// ════════════════════════════════════════════════════════════════════════════
// LEADERBOARDS
// ════════════════════════════════════════════════════════════════════════════

// ── Per-module quiz leaderboard — single section/module এর জন্য ───────────
// সব student এর সেই module quiz এর best score, descending sorted
const getModuleQuizLeaderboard = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const rows = await QuizAttempt.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), sectionId: new mongoose.Types.ObjectId(sectionId) } },
    { $sort: { score: -1 } },
    { $group: {
      _id: "$user",
      bestScore: { $first: "$score" },
      passed: { $first: "$passed" },
      attempts: { $sum: 1 },
      lastAttemptAt: { $max: "$submittedAt" },
    }},
    { $sort: { bestScore: -1, lastAttemptAt: 1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: {
      _id: 0, userId: "$_id",
      name: "$user.name", email: "$user.email", profileImage: "$user.profileImage",
      bestScore: 1, passed: 1, attempts: 1, lastAttemptAt: 1,
    }},
  ]);
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
});

// ── Overall quiz leaderboard for a course — সব module quiz merge করে total ─
const getOverallQuizLeaderboard = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  // প্রতিটা student-sectionId pair এর best score নিয়ে, তারপর student-wise sum
  const rows = await QuizAttempt.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $sort: { score: -1 } },
    { $group: {
      _id: { user: "$user", sectionId: "$sectionId" },
      bestScore: { $first: "$score" },
    }},
    { $group: {
      _id: "$_id.user",
      totalScore: { $sum: "$bestScore" },
      modulesAttempted: { $sum: 1 },
      avgScore: { $avg: "$bestScore" },
    }},
    { $sort: { totalScore: -1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: {
      _id: 0, userId: "$_id",
      name: "$user.name", email: "$user.email", profileImage: "$user.profileImage",
      totalScore: 1, modulesAttempted: 1, avgScore: { $round: ["$avgScore", 1] },
    }},
  ]);
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
});

// ── Student: get all active quizzes for a course (existence check for sidebar) ─
const getStudentCourseQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.courseId, isActive: true })
    .select("sectionId title passMark maxAttempts").lean();
  res.json(quizzes);
});

module.exports = {
  upsertQuiz, toggleQuizActive, deleteQuiz, getCourseQuizzes,
  getStudentQuiz, submitQuiz, getMyCourseAttempts, getStudentCourseQuizzes,
  getModuleQuizLeaderboard, getOverallQuizLeaderboard,
};
