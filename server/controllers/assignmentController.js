const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");

// ── Admin: create/update assignment for a module ──────────────────────────
const upsertAssignment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { moduleIndex, title, description, deadline, isActive } = req.body;

  let asgn = await Assignment.findOne({ course: courseId, moduleIndex });
  if (asgn) {
    if (title !== undefined) asgn.title = title;
    if (description !== undefined) asgn.description = description;
    if (deadline !== undefined) asgn.deadline = deadline || null;
    if (isActive !== undefined) asgn.isActive = isActive;
    await asgn.save();
  } else {
    asgn = await Assignment.create({ course: courseId, moduleIndex, title, description, deadline: deadline || null, isActive });
  }
  res.json(asgn);
});

// ── Admin: toggle active/inactive ──────────────────────────────────────────
const toggleAssignmentActive = asyncHandler(async (req, res) => {
  const asgn = await Assignment.findById(req.params.id);
  if (!asgn) return res.status(404).json({ message: "Assignment not found" });
  asgn.isActive = !asgn.isActive;
  await asgn.save();
  res.json(asgn);
});

// ── Admin: delete assignment ──────────────────────────────────────────────
const deleteAssignment = asyncHandler(async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ message: "Assignment deleted" });
});

// ── Admin: get all assignments for a course (with submission counts) ──────
const getCourseAssignments = asyncHandler(async (req, res) => {
  const asgns = await Assignment.find({ course: req.params.courseId }).sort("moduleIndex").lean();

  // attach submission count per assignment — admin দেখবে কতজন submit করলো
  const counts = await AssignmentSubmission.aggregate([
    { $match: { assignment: { $in: asgns.map(a => a._id) } } },
    { $group: { _id: "$assignment", count: { $sum: 1 }, reviewed: { $sum: { $cond: [{ $ne: ["$mark", null] }, 1, 0] } } } },
  ]);
  const countMap = Object.fromEntries(counts.map(c => [String(c._id), c]));

  res.json(asgns.map(a => ({
    ...a,
    submissionCount: countMap[String(a._id)]?.count || 0,
    reviewedCount: countMap[String(a._id)]?.reviewed || 0,
  })));
});

// ── Admin: get all submissions for one assignment (for grading) ───────────
const getAllSubmissions = asyncHandler(async (req, res) => {
  const filter = { course: req.params.courseId };
  if (req.query.moduleIndex !== undefined) filter.moduleIndex = Number(req.query.moduleIndex);
  const subs = await AssignmentSubmission.find(filter)
    .populate("user", "name email profileImage")
    .populate("assignment", "title")
    .sort("-submittedAt")
    .lean();
  res.json(subs);
});

// ── Admin: review/grade a submission — mark + feedback + status ───────────
const reviewSubmission = asyncHandler(async (req, res) => {
  const sub = await AssignmentSubmission.findById(req.params.subId);
  if (!sub) return res.status(404).json({ message: "Submission not found" });
  const { status, feedback, mark } = req.body;
  if (status) sub.status = status;
  if (feedback !== undefined) sub.feedback = feedback;
  if (mark !== undefined) sub.mark = mark != null ? Math.min(50, Math.max(0, Number(mark))) : null;
  await sub.save();
  res.json(sub);
});

// ── Admin: bulk grade via excel — email primary match, studentId fallback ──
// payload: { moduleIndex, rows: [{ email, studentId, mark, status, feedback }] }
const bulkGradeSubmissions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { moduleIndex, rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ message: "কোনো row পাওয়া যায়নি" });

  const asgn = await Assignment.findOne({ course: courseId, moduleIndex });
  if (!asgn) return res.status(404).json({ message: "Assignment খুঁজে পাওয়া যায়নি" });

  const subs = await AssignmentSubmission.find({ assignment: asgn._id }).populate("user", "name email");
  const byEmail = new Map(subs.filter(s => s.user?.email).map(s => [s.user.email.toLowerCase(), s]));
  const byStudentId = new Map(subs.filter(s => s.user?._id).map(s => [`STU-${String(s.user._id).slice(-8).toUpperCase()}`, s]));

  let updated = 0, skipped = 0;
  for (const row of rows) {
    const email = String(row.email || row.Email || "").toLowerCase().trim();
    const studentId = String(row.studentId || row.StudentId || row["Student ID"] || "").trim().toUpperCase();
    const mark = row.mark ?? row.Mark;
    const status = row.status || row.Status;
    const feedback = row.feedback ?? row.Feedback ?? "";

    // ১. email দিয়ে আগে match — সবচেয়ে reliable
    let sub = email ? byEmail.get(email) : null;
    // ২. না পেলে studentId দিয়ে fallback
    if (!sub && studentId) sub = byStudentId.get(studentId);
    if (!sub) { skipped++; continue; }

    if (mark !== undefined && mark !== "" && mark !== null) {
      sub.mark = Math.min(50, Math.max(0, Number(mark)));
    }
    if (status) sub.status = String(status).toLowerCase();
    if (feedback !== undefined && feedback !== "") sub.feedback = feedback;
    await sub.save();
    updated++;
  }

  res.json({ updated, skipped, total: rows.length });
});

// ── Student: get assignments for a course (active only) ───────────────────
const getStudentAssignments = asyncHandler(async (req, res) => {
  const asgns = await Assignment.find({ course: req.params.courseId, isActive: true }).sort("moduleIndex").lean();
  const subs = await AssignmentSubmission.find({
    user: req.user._id, course: req.params.courseId,
  }).select("assignment status mark feedback submittedAt fileUrl answerText").lean();
  const subMap = Object.fromEntries(subs.map(s => [String(s.assignment), s]));
  res.json(asgns.map(a => ({ ...a, mySubmission: subMap[String(a._id)] || null })));
});

// ── Student: submit assignment — text answer + Drive/GitHub link ──────────
const submitAssignment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { moduleIndex, answerText, fileUrl } = req.body;
  const asgn = await Assignment.findOne({ course: courseId, moduleIndex, isActive: true });
  if (!asgn) return res.status(404).json({ message: "Assignment not found for this module, অথবা inactive করা আছে" });

  if (!answerText?.trim() && !fileUrl?.trim()) {
    return res.status(400).json({ message: "Text answer বা file/drive link — অন্তত একটা দাও" });
  }

  // upsert — student resubmit করলে overwrite হবে, mark/feedback reset হবে
  let sub = await AssignmentSubmission.findOne({ assignment: asgn._id, user: req.user._id });
  if (sub) {
    sub.answerText = answerText || sub.answerText;
    sub.fileUrl = fileUrl || sub.fileUrl;
    sub.status = "submitted";
    sub.submittedAt = new Date();
    // resubmit করলে আগের mark/feedback clear — admin আবার review করবে
    sub.mark = null;
    sub.feedback = "";
    await sub.save();
  } else {
    sub = await AssignmentSubmission.create({
      assignment: asgn._id, user: req.user._id,
      course: courseId, moduleIndex,
      answerText, fileUrl,
    });
  }
  res.json(sub);
});

// ── Student: get my submissions ───────────────────────────────────────────
const getMySubmissions = asyncHandler(async (req, res) => {
  const subs = await AssignmentSubmission.find({
    user: req.user._id, course: req.params.courseId,
  }).populate("assignment", "title moduleIndex").lean();
  res.json(subs);
});

// ════════════════════════════════════════════════════════════════════════════
// LEADERBOARDS
// ════════════════════════════════════════════════════════════════════════════

// ── Per-module assignment leaderboard ──────────────────────────────────────
const getModuleAssignmentLeaderboard = asyncHandler(async (req, res) => {
  const { courseId, moduleIndex } = req.params;
  const rows = await AssignmentSubmission.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), moduleIndex: Number(moduleIndex), mark: { $ne: null } } },
    { $sort: { mark: -1 } },
    { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "u" } },
    { $unwind: "$u" },
    { $project: {
      _id: 0, userId: "$user",
      name: "$u.name", email: "$u.email", profileImage: "$u.profileImage",
      mark: 1, status: 1, submittedAt: 1,
    }},
  ]);
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
});

// ── Overall assignment leaderboard for a course — সব module mark sum ──────
const getOverallAssignmentLeaderboard = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const rows = await AssignmentSubmission.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), mark: { $ne: null } } },
    { $group: {
      _id: "$user",
      totalMark: { $sum: "$mark" },
      modulesGraded: { $sum: 1 },
      avgMark: { $avg: "$mark" },
    }},
    { $sort: { totalMark: -1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
    { $unwind: "$u" },
    { $project: {
      _id: 0, userId: "$_id",
      name: "$u.name", email: "$u.email", profileImage: "$u.profileImage",
      totalMark: 1, modulesGraded: 1, avgMark: { $round: ["$avgMark", 1] },
    }},
  ]);
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
});

module.exports = {
  upsertAssignment, toggleAssignmentActive, deleteAssignment, getCourseAssignments,
  getAllSubmissions, reviewSubmission, bulkGradeSubmissions,
  getStudentAssignments, submitAssignment, getMySubmissions,
  getModuleAssignmentLeaderboard, getOverallAssignmentLeaderboard,
};
