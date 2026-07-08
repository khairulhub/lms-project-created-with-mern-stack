const asyncHandler = require("express-async-handler");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const AnnouncementRead = require("../models/AnnouncementRead");

const POPULATE_COURSE = "title emoji category";
const POPULATE_AUTHOR = "name role profileImage";

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/announcements?scope=&course=
const getAdminAnnouncements = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.scope) filter.scope = req.query.scope;
  if (req.query.course) filter.course = req.query.course;
  const announcements = await Announcement.find(filter)
    .populate("course", POPULATE_COURSE)
    .populate("createdBy", POPULATE_AUTHOR)
    .sort({ createdAt: -1 });
  res.json(announcements);
});

// POST /api/admin/announcements — admin global, ekta nirdishto course, othoba shob course er jonno (batch) dite pare
const createAdminAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, scope, course, allCourses, audience, priority, eventDate } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title required" });
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });
  if (!["global", "course"].includes(scope))
    return res.status(400).json({ message: "Scope must be global or course" });
  if (scope === "course" && !allCourses && !course)
    return res.status(400).json({ message: "Course required for course-scoped announcement" });

  const base = {
    title: title.trim(),
    message: message.trim(),
    audience: ["students", "instructors", "both"].includes(audience) ? audience : "students",
    priority: ["normal", "important", "urgent"].includes(priority) ? priority : "normal",
    eventDate: eventDate || null,
    createdBy: req.user._id,
    createdByRole: "admin",
  };

  // "সব কোর্সের জন্য" — protitta course er jonno alada announcement document
  if (scope === "course" && allCourses) {
    const allCourseDocs = await Course.find({}).select("_id");
    if (allCourseDocs.length === 0) return res.status(404).json({ message: "No courses found" });
    const docs = await Announcement.insertMany(
      allCourseDocs.map((c) => ({ ...base, scope: "course", course: c._id }))
    );
    const populated = await Announcement.find({ _id: { $in: docs.map((d) => d._id) } })
      .populate("course", POPULATE_COURSE)
      .populate("createdBy", POPULATE_AUTHOR);
    return res.status(201).json(populated);
  }

  if (scope === "course") {
    const exists = await Course.findById(course);
    if (!exists) return res.status(404).json({ message: "Course not found" });
  }

  const announcement = await Announcement.create({
    ...base,
    scope,
    course: scope === "course" ? course : null,
  });

  res.status(201).json(
    await (await announcement.populate("course", POPULATE_COURSE)).populate("createdBy", POPULATE_AUTHOR)
  );
});

// PUT /api/admin/announcements/:id
const updateAdminAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });

  const { title, message, scope, course, audience, priority, eventDate, isActive } = req.body;
  if (title !== undefined) announcement.title = title.trim();
  if (message !== undefined) announcement.message = message.trim();
  if (scope !== undefined) announcement.scope = scope;
  if (course !== undefined) announcement.course = announcement.scope === "course" ? course : null;
  if (announcement.scope === "global") announcement.course = null;
  if (audience !== undefined) announcement.audience = audience;
  if (priority !== undefined) announcement.priority = priority;
  if (eventDate !== undefined) announcement.eventDate = eventDate || null;
  if (isActive !== undefined) announcement.isActive = isActive;

  await announcement.save();
  res.json(
    await (await announcement.populate("course", POPULATE_COURSE)).populate("createdBy", POPULATE_AUTHOR)
  );
});

// DELETE /api/admin/announcements/:id
const deleteAdminAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });
  res.json({ message: "Announcement deleted" });
});

// ── INSTRUCTOR ────────────────────────────────────────────────────────────

// GET /api/instructor/announcements — nijer created announcements (own courses only)
const getInstructorAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ createdBy: req.user._id, createdByRole: "instructor" })
    .populate("course", POPULATE_COURSE)
    .sort({ createdAt: -1 });
  res.json(announcements);
});

// POST /api/instructor/announcements — নিজের একটা course, othoba nijer shob course er jonno (scope সবসময় "course")
const createInstructorAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, course, allCourses, audience, priority, eventDate } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title required" });
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });
  if (!allCourses && !course) return res.status(400).json({ message: "Course required" });

  const base = {
    title: title.trim(),
    message: message.trim(),
    scope: "course",
    audience: ["students", "instructors", "both"].includes(audience) ? audience : "students",
    priority: ["normal", "important", "urgent"].includes(priority) ? priority : "normal",
    eventDate: eventDate || null,
    createdBy: req.user._id,
    createdByRole: "instructor",
  };

  if (allCourses) {
    const myCourses = await Course.find({ createdBy: req.user._id }).select("_id");
    if (myCourses.length === 0) return res.status(404).json({ message: "You have no courses yet" });
    const docs = await Announcement.insertMany(myCourses.map((c) => ({ ...base, course: c._id })));
    const populated = await Announcement.find({ _id: { $in: docs.map((d) => d._id) } }).populate("course", POPULATE_COURSE);
    return res.status(201).json(populated);
  }

  const owned = await Course.findOne({ _id: course, createdBy: req.user._id });
  if (!owned) return res.status(404).json({ message: "Course not found or not yours" });

  const announcement = await Announcement.create({ ...base, course });
  res.status(201).json(await announcement.populate("course", POPULATE_COURSE));
});

// PUT /api/instructor/announcements/:id — nijer own only
const updateInstructorAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!announcement) return res.status(404).json({ message: "Announcement not found or not yours" });

  const { title, message, audience, priority, eventDate, isActive } = req.body;
  if (title !== undefined) announcement.title = title.trim();
  if (message !== undefined) announcement.message = message.trim();
  if (audience !== undefined) announcement.audience = audience;
  if (priority !== undefined) announcement.priority = priority;
  if (eventDate !== undefined) announcement.eventDate = eventDate || null;
  if (isActive !== undefined) announcement.isActive = isActive;
  // course/scope change kora jabe na — course-owner change howa uchit na

  await announcement.save();
  res.json(await announcement.populate("course", POPULATE_COURSE));
});

// DELETE /api/instructor/announcements/:id
const deleteInstructorAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!announcement) return res.status(404).json({ message: "Announcement not found or not yours" });
  res.json({ message: "Announcement deleted" });
});

// ── FEED (student / instructor — je je announcement dekha uchit) ──────────

// Ekjon user er jonno relevant announcement filter (student ba instructor)
const buildFeedFilter = async (user) => {
  if (user.role === "instructor") {
    const myCourses = await Course.find({ createdBy: user._id }).select("_id");
    const myCourseIds = myCourses.map((c) => c._id);
    return {
      isActive: true,
      $or: [
        { scope: "global", audience: { $in: ["instructors", "both"] } },
        { scope: "course", course: { $in: myCourseIds }, audience: { $in: ["instructors", "both"] } },
      ],
    };
  }

  // default: student ("user" role)
  const approvedEnrollments = await Enrollment.find({ user: user._id, status: "approved" }).select("course");
  const enrolledCourseIds = approvedEnrollments.map((e) => e.course);
  return {
    isActive: true,
    $or: [
      { scope: "global", audience: { $in: ["students", "both"] } },
      { scope: "course", course: { $in: enrolledCourseIds }, audience: { $in: ["students", "both"] } },
    ],
  };
};

// GET /api/announcements/feed — logged-in user er jonno relevant shob announcement, prottekta te isRead flag soho
const getFeed = asyncHandler(async (req, res) => {
  const filter = await buildFeedFilter(req.user);
  const feed = await Announcement.find(filter)
    .populate("course", POPULATE_COURSE)
    .populate("createdBy", POPULATE_AUTHOR)
    .sort({ createdAt: -1 });

  const reads = await AnnouncementRead.find({
    user: req.user._id,
    announcement: { $in: feed.map((a) => a._id) },
  }).select("announcement");
  const readIds = new Set(reads.map((r) => String(r.announcement)));

  const withReadFlag = feed.map((a) => ({ ...a.toObject(), isRead: readIds.has(String(a._id)) }));
  res.json(withReadFlag);
});

// GET /api/announcements/unread-count — sidebar notification badge er jonno
const getUnreadCount = asyncHandler(async (req, res) => {
  const filter = await buildFeedFilter(req.user);
  const feedIds = await Announcement.find(filter).select("_id");
  const ids = feedIds.map((a) => a._id);
  if (ids.length === 0) return res.json({ count: 0 });

  const readCount = await AnnouncementRead.countDocuments({
    user: req.user._id,
    announcement: { $in: ids },
  });
  res.json({ count: ids.length - readCount });
});

// POST /api/announcements/:id/read — user announcement টা open/view korle read mark hobe
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });

  const existing = await AnnouncementRead.findOne({ user: req.user._id, announcement: id });
  if (existing) return res.json({ message: "Already read", alreadyRead: true });

  await AnnouncementRead.create({ user: req.user._id, announcement: id });
  res.json({ message: "Marked as read", alreadyRead: false });
});

module.exports = {
  getAdminAnnouncements, createAdminAnnouncement, updateAdminAnnouncement, deleteAdminAnnouncement,
  getInstructorAnnouncements, createInstructorAnnouncement, updateInstructorAnnouncement, deleteInstructorAnnouncement,
  getFeed, getUnreadCount, markAsRead,
};
