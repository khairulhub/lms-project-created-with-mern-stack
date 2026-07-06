const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const CourseProgress = require("../models/CourseProgress");
const Enrollment = require("../models/Enrollment");

// শুধু approved enrollment থাকলেই progress read/write করতে দেওয়া হবে —
// অন্য কোনো student-এর course-এর progress access করতে পারবে না।
const ensureApprovedEnrollment = async (userId, courseId) => {
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: "approved",
  });
  return enrollment;
};

// ─── GET /api/progress/:courseId — student-এর নিজের progress (lecture
// complete করা না থাকলে empty progress doc-এর shape-ই return করে, নতুন
// কোনো doc save করে না — প্রথম mark-complete এর সময় create হবে) ───────────
const getProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "Invalid course id" });
  }

  const enrollment = await ensureApprovedEnrollment(userId, courseId);
  if (!enrollment) {
    return res.status(403).json({ message: "তুমি এই কোর্সে enrolled নেই অথবা এখনো approve হয়নি।" });
  }

  const progress = await CourseProgress.findOne({ user: userId, course: courseId });

  res.json({
    completedLectures: progress?.completedLectures || [],
    lastWatchedLecture: progress?.lastWatchedLecture || null,
    lastWatchedAt: progress?.lastWatchedAt || null,
  });
});

// ─── PUT /api/progress/:courseId/lecture/:lectureId — lecture complete/
// incomplete toggle করো। Body: { completed: true|false }. একই সাথে
// lastWatchedLecture-ও সেই lecture-এ point করে দেয়, কারণ student সেটাই
// দেখছিল। upsert করে — প্রথমবার হলে doc auto-create হয়ে যাবে। ───────────
const setLectureCompletion = asyncHandler(async (req, res) => {
  const { courseId, lectureId } = req.params;
  const { completed } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const enrollment = await ensureApprovedEnrollment(userId, courseId);
  if (!enrollment) {
    return res.status(403).json({ message: "তুমি এই কোর্সে enrolled নেই অথবা এখনো approve হয়নি।" });
  }

  const update = completed
    ? {
        $addToSet: { completedLectures: lectureId },
        $set: { lastWatchedLecture: lectureId, lastWatchedAt: new Date() },
      }
    : {
        $pull: { completedLectures: lectureId },
      };

  const progress = await CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({
    completedLectures: progress.completedLectures,
    lastWatchedLecture: progress.lastWatchedLecture,
    lastWatchedAt: progress.lastWatchedAt,
  });
});

// ─── PUT /api/progress/:courseId/last-watched — কেবল "এখন কোন lecture
// দেখছি" আপডেট করো (complete না করেই, যেমন student lecture select করলেই
// call হবে — পরের বার refresh/login করলে এখান থেকেই শুরু হবে) ────────────
const setLastWatched = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { lectureId } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const enrollment = await ensureApprovedEnrollment(userId, courseId);
  if (!enrollment) {
    return res.status(403).json({ message: "তুমি এই কোর্সে enrolled নেই অথবা এখনো approve হয়নি।" });
  }

  const progress = await CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    { $set: { lastWatchedLecture: lectureId, lastWatchedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({
    completedLectures: progress.completedLectures,
    lastWatchedLecture: progress.lastWatchedLecture,
    lastWatchedAt: progress.lastWatchedAt,
  });
});

module.exports = { getProgress, setLectureCompletion, setLastWatched };
