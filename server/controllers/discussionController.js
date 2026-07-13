const asyncHandler = require("express-async-handler");
const LectureDiscussion = require("../models/LectureDiscussion");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const POPULATE_USER = "name email role profileImage";

// student হলে approved enrollment লাগবে, instructor হলে course এর owner
// হতে হবে (createdBy), admin সবসময় allowed — এই তিনটার একটাও না মিললে false
const canAccessCourseDiscussion = async (user, courseId) => {
  if (user.role === "admin") return true;
  if (user.role === "instructor") {
    const course = await Course.findById(courseId).select("createdBy");
    return !!course && String(course.createdBy) === String(user._id);
  }
  const enrollment = await Enrollment.findOne({ user: user._id, course: courseId, status: "approved" });
  return !!enrollment;
};

// GET /api/discussions/lecture/:lectureId?courseId=...  — একটা lecture-এর সব প্রশ্ন
const getLectureDiscussions = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ message: "courseId লাগবে।" });

  const allowed = await canAccessCourseDiscussion(req.user, courseId);
  if (!allowed) return res.status(403).json({ message: "এই কোর্সে তোমার access নাই।" });

  const discussions = await LectureDiscussion.find({ course: courseId, lectureId: req.params.lectureId })
    .populate("user", POPULATE_USER)
    .populate("replies.sender", POPULATE_USER)
    .sort({ createdAt: -1 });
  res.json(discussions);
});

// GET /api/discussions/course/:courseId — instructor/admin এর জন্য পুরো course-এর সব প্রশ্ন
const getCourseDiscussions = asyncHandler(async (req, res) => {
  const allowed = await canAccessCourseDiscussion(req.user, req.params.courseId);
  if (!allowed) return res.status(403).json({ message: "এই কোর্সে তোমার access নাই।" });

  const discussions = await LectureDiscussion.find({ course: req.params.courseId })
    .populate("user", POPULATE_USER)
    .populate("replies.sender", POPULATE_USER)
    .sort({ createdAt: -1 });
  res.json(discussions);
});

// POST /api/discussions  { courseId, sectionId, lectureId, lectureTitle, question }
const createDiscussion = asyncHandler(async (req, res) => {
  const { courseId, sectionId, lectureId, lectureTitle, question } = req.body;
  if (!courseId || !sectionId || !lectureId || !question?.trim()) {
    return res.status(400).json({ message: "courseId, sectionId, lectureId, question — সব দাও।" });
  }
  const allowed = await canAccessCourseDiscussion(req.user, courseId);
  if (!allowed) return res.status(403).json({ message: "এই কোর্সে তোমার access নাই।" });

  const discussion = await LectureDiscussion.create({
    course: courseId,
    sectionId,
    lectureId,
    lectureTitle: lectureTitle || "",
    user: req.user._id,
    question: question.trim(),
  });
  res.status(201).json(await discussion.populate("user", POPULATE_USER));
});

// POST /api/discussions/:id/reply  { message }
const replyToDiscussion = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Reply message দাও।" });

  const discussion = await LectureDiscussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ message: "প্রশ্ন পাওয়া যায়নি।" });

  const allowed = await canAccessCourseDiscussion(req.user, discussion.course);
  if (!allowed) return res.status(403).json({ message: "এই কোর্সে তোমার access নাই।" });

  discussion.replies.push({ sender: req.user._id, senderRole: req.user.role, message: message.trim() });
  await discussion.save();
  res.json(await discussion.populate([
    { path: "user", select: POPULATE_USER },
    { path: "replies.sender", select: POPULATE_USER },
  ]));
});

// PUT /api/discussions/:id/resolve — asker/instructor/admin nijer question resolve mark korte pare
const toggleResolved = asyncHandler(async (req, res) => {
  const discussion = await LectureDiscussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ message: "প্রশ্ন পাওয়া যায়নি।" });

  const isAsker = String(discussion.user) === String(req.user._id);
  const isPrivileged = req.user.role === "admin" || req.user.role === "instructor";
  if (!isAsker && !isPrivileged) return res.status(403).json({ message: "শুধু প্রশ্নকর্তা বা instructor/admin resolve করতে পারবে।" });

  discussion.resolved = !discussion.resolved;
  await discussion.save();
  res.json({ resolved: discussion.resolved });
});

// DELETE /api/discussions/:id — asker নিজে অথবা admin delete করতে পারবে
const deleteDiscussion = asyncHandler(async (req, res) => {
  const discussion = await LectureDiscussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ message: "প্রশ্ন পাওয়া যায়নি।" });

  const isAsker = String(discussion.user) === String(req.user._id);
  if (!isAsker && req.user.role !== "admin") {
    return res.status(403).json({ message: "শুধু প্রশ্নকর্তা বা admin delete করতে পারবে।" });
  }
  await discussion.deleteOne();
  res.json({ message: "প্রশ্ন মুছে ফেলা হয়েছে।" });
});

module.exports = {
  getLectureDiscussions, getCourseDiscussions, createDiscussion,
  replyToDiscussion, toggleResolved, deleteDiscussion,
};
