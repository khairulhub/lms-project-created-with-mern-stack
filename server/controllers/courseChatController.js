const asyncHandler = require("express-async-handler");
const CourseChat = require("../models/CourseChat");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const POPULATE_USER = "name email role profileImage";
const POPULATE_COURSE = "title thumbnail image createdBy";

const previewText = (msg) => {
  if (msg.text?.trim()) return msg.text.trim().slice(0, 120);
  if (msg.attachments?.length) return msg.attachments[0].type === "image" ? "📷 ছবি পাঠিয়েছে" : "📎 ফাইল পাঠিয়েছে";
  return "";
};

// ── STUDENT ──────────────────────────────────────────────────────────────

// GET /api/course-chat/:courseId — thread না থাকলে auto-create (enrolled থাকলে), full thread ফেরত দেয়
const getMyCourseChat = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId, status: "approved" });
  if (!enrollment) return res.status(403).json({ message: "এই কোর্সে enroll করা নেই" });

  let chat = await CourseChat.findOne({ course: courseId, student: req.user._id })
    .populate("course", POPULATE_COURSE)
    .populate("messages.sender", POPULATE_USER);

  if (!chat) {
    chat = await CourseChat.create({ course: courseId, student: req.user._id });
    chat = await chat.populate("course", POPULATE_COURSE);
  }

  chat.lastSeenByStudent = new Date();
  await chat.save();

  res.json(chat);
});

// POST /api/course-chat/:courseId/message — { text, attachments }
const sendStudentMessage = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { text = "", attachments = [] } = req.body;
  if (!text.trim() && attachments.length === 0)
    return res.status(400).json({ message: "কিছু একটা লিখো অথবা ফাইল দাও" });

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: courseId, status: "approved" });
  if (!enrollment) return res.status(403).json({ message: "এই কোর্সে enroll করা নেই" });

  let chat = await CourseChat.findOne({ course: courseId, student: req.user._id });
  if (!chat) chat = await CourseChat.create({ course: courseId, student: req.user._id });

  const message = { sender: req.user._id, senderRole: "student", text: text.trim(), attachments };
  chat.messages.push(message);
  chat.lastMessageAt = new Date();
  chat.lastMessageText = previewText(message);
  chat.lastMessageBy = "student";
  chat.lastSeenByStudent = new Date();
  await chat.save();

  const populated = await chat.populate([
    { path: "course", select: POPULATE_COURSE },
    { path: "messages.sender", select: POPULATE_USER },
  ]);
  res.json(populated);
});

// GET /api/course-chat/unread-count — student এর সব course chat মিলিয়ে unread thread সংখ্যা
const getStudentUnreadCount = asyncHandler(async (req, res) => {
  const count = await CourseChat.countDocuments({
    student: req.user._id,
    lastMessageBy: { $ne: "student" },
    $expr: { $gt: ["$lastMessageAt", "$lastSeenByStudent"] },
  });
  res.json({ count });
});

// ── SHARED helper: staff (instructor/admin) reply logic ─────────────────────
const staffReply = async (req, res, { restrictToOwnCourses }) => {
  const chat = await CourseChat.findById(req.params.threadId).populate("course", POPULATE_COURSE);
  if (!chat) return res.status(404).json({ message: "Chat thread পাওয়া যায়নি" });

  if (restrictToOwnCourses && String(chat.course.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "এই কোর্সের চ্যাট access করার অনুমতি নাই" });
  }

  const { text = "", attachments = [] } = req.body;
  if (!text.trim() && attachments.length === 0)
    return res.status(400).json({ message: "কিছু একটা লিখো অথবা ফাইল দাও" });

  const senderRole = req.user.role === "admin" ? "admin" : "instructor";
  const message = { sender: req.user._id, senderRole, text: text.trim(), attachments };
  chat.messages.push(message);
  chat.lastMessageAt = new Date();
  chat.lastMessageText = previewText(message);
  chat.lastMessageBy = senderRole;
  chat.lastSeenByStaff = new Date();
  await chat.save();

  const populated = await chat.populate("messages.sender", POPULATE_USER);
  res.json(populated);
};

// ── INSTRUCTOR ───────────────────────────────────────────────────────────

// GET /api/instructor/course-chat/threads — instructor এর নিজের কোর্সের সব chat thread
const getInstructorThreads = asyncHandler(async (req, res) => {
  const myCourses = await Course.find({ createdBy: req.user._id }).select("_id");
  const courseIds = myCourses.map((c) => c._id);

  const threads = await CourseChat.find({ course: { $in: courseIds } })
    .select("-messages")
    .populate("course", POPULATE_COURSE)
    .populate("student", POPULATE_USER)
    .sort({ lastMessageAt: -1 });

  res.json(threads);
});

// GET /api/instructor/course-chat/:threadId
const getInstructorThreadById = asyncHandler(async (req, res) => {
  const chat = await CourseChat.findById(req.params.threadId)
    .populate("course", POPULATE_COURSE)
    .populate("student", POPULATE_USER)
    .populate("messages.sender", POPULATE_USER);
  if (!chat) return res.status(404).json({ message: "Chat thread পাওয়া যায়নি" });
  if (String(chat.course.createdBy) !== String(req.user._id))
    return res.status(403).json({ message: "এই কোর্সের চ্যাট access করার অনুমতি নাই" });

  chat.lastSeenByStaff = new Date();
  await chat.save();
  res.json(chat);
});

// POST /api/instructor/course-chat/:threadId/message
const instructorReply = asyncHandler((req, res) => staffReply(req, res, { restrictToOwnCourses: true }));

// GET /api/instructor/course-chat/unread-count
const getInstructorUnreadCount = asyncHandler(async (req, res) => {
  const myCourses = await Course.find({ createdBy: req.user._id }).select("_id");
  const courseIds = myCourses.map((c) => c._id);

  const count = await CourseChat.countDocuments({
    course: { $in: courseIds },
    lastMessageBy: "student",
    $expr: { $gt: ["$lastMessageAt", { $ifNull: ["$lastSeenByStaff", new Date(0)] }] },
  });
  res.json({ count });
});

// ── ADMIN (oversight — সব course chat দেখতে/reply করতে পারে) ────────────────

// GET /api/admin/course-chat/threads
const getAdminThreads = asyncHandler(async (req, res) => {
  const threads = await CourseChat.find({})
    .select("-messages")
    .populate("course", POPULATE_COURSE)
    .populate("student", POPULATE_USER)
    .sort({ lastMessageAt: -1 });
  res.json(threads);
});

// GET /api/admin/course-chat/:threadId
const getAdminThreadById = asyncHandler(async (req, res) => {
  const chat = await CourseChat.findById(req.params.threadId)
    .populate("course", POPULATE_COURSE)
    .populate("student", POPULATE_USER)
    .populate("messages.sender", POPULATE_USER);
  if (!chat) return res.status(404).json({ message: "Chat thread পাওয়া যায়নি" });

  chat.lastSeenByStaff = new Date();
  await chat.save();
  res.json(chat);
});

// POST /api/admin/course-chat/:threadId/message
const adminReply = asyncHandler((req, res) => staffReply(req, res, { restrictToOwnCourses: false }));

// GET /api/admin/course-chat/unread-count
const getAdminUnreadCount = asyncHandler(async (req, res) => {
  const count = await CourseChat.countDocuments({
    lastMessageBy: "student",
    $expr: { $gt: ["$lastMessageAt", { $ifNull: ["$lastSeenByStaff", new Date(0)] }] },
  });
  res.json({ count });
});

// ── FILE UPLOAD (shared — student/instructor/admin সবাই ব্যবহার করে) ────────

// POST /api/course-chat/upload — multer middleware route-এ আগে বসানো থাকবে
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "কোনো ফাইল পাওয়া যায়নি" });
  const isImage = req.file.mimetype.startsWith("image/");
  res.json({
    url: req.file.path, // multer-storage-cloudinary already returns the full Cloudinary URL
    type: isImage ? "image" : "file",
    name: req.file.originalname,
    size: req.file.size,
  });
});

module.exports = {
  getMyCourseChat, sendStudentMessage, getStudentUnreadCount,
  getInstructorThreads, getInstructorThreadById, instructorReply, getInstructorUnreadCount,
  getAdminThreads, getAdminThreadById, adminReply, getAdminUnreadCount,
  uploadAttachment,
};
