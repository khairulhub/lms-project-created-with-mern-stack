const asyncHandler = require("express-async-handler");
const ConceptualSession = require("../models/ConceptualSession");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const POPULATE_COURSE = "title emoji category";
const POPULATE_AUTHOR = "name role profileImage";

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/sessions?scope=&course=
const getAdminSessions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.scope) filter.scope = req.query.scope;
  if (req.query.course) filter.course = req.query.course;
  const sessions = await ConceptualSession.find(filter)
    .populate("course", POPULATE_COURSE)
    .populate("createdBy", POPULATE_AUTHOR)
    .sort({ startTime: -1 });
  res.json(sessions);
});

// POST /api/admin/sessions — admin global, ekta nirdishto course, othoba shob course er jonno (batch) session banate pare
const createAdminSession = asyncHandler(async (req, res) => {
  const { title, description, scope, course, allCourses, platform, meetingLink, meetingId, passcode, startTime, durationMinutes } = req.body;

  if (!title?.trim()) return res.status(400).json({ message: "Title required" });
  if (!["global", "course"].includes(scope))
    return res.status(400).json({ message: "Scope must be global or course" });
  if (scope === "course" && !allCourses && !course)
    return res.status(400).json({ message: "Course required for course-scoped session" });
  if (!["zoom", "google_meet"].includes(platform))
    return res.status(400).json({ message: "Platform must be zoom or google_meet" });
  if (!meetingLink?.trim()) return res.status(400).json({ message: "Meeting link required" });
  if (!startTime) return res.status(400).json({ message: "Start time required" });

  const base = {
    title: title.trim(),
    description: description?.trim() || "",
    platform,
    meetingLink: meetingLink.trim(),
    meetingId: meetingId?.trim() || "",
    passcode: passcode?.trim() || "",
    startTime,
    durationMinutes: durationMinutes || 60,
    createdBy: req.user._id,
    createdByRole: "admin",
  };

  // "সব কোর্সের জন্য" — protitta course er jonno alada session document
  if (scope === "course" && allCourses) {
    const allCourseDocs = await Course.find({}).select("_id");
    if (allCourseDocs.length === 0) return res.status(404).json({ message: "No courses found" });
    const docs = await ConceptualSession.insertMany(
      allCourseDocs.map((c) => ({ ...base, scope: "course", course: c._id }))
    );
    const populated = await ConceptualSession.find({ _id: { $in: docs.map((d) => d._id) } })
      .populate("course", POPULATE_COURSE)
      .populate("createdBy", POPULATE_AUTHOR);
    return res.status(201).json(populated);
  }

  if (scope === "course") {
    const exists = await Course.findById(course);
    if (!exists) return res.status(404).json({ message: "Course not found" });
  }

  const session = await ConceptualSession.create({
    ...base,
    scope,
    course: scope === "course" ? course : null,
  });

  res.status(201).json(
    await (await session.populate("course", POPULATE_COURSE)).populate("createdBy", POPULATE_AUTHOR)
  );
});

// PUT /api/admin/sessions/:id
const updateAdminSession = asyncHandler(async (req, res) => {
  const session = await ConceptualSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });

  const {
    title, description, scope, course, platform,
    meetingLink, meetingId, passcode, startTime, durationMinutes, status,
  } = req.body;

  if (title !== undefined) session.title = title.trim();
  if (description !== undefined) session.description = description.trim();
  if (scope !== undefined) session.scope = scope;
  if (course !== undefined) session.course = session.scope === "course" ? course : null;
  if (session.scope === "global") session.course = null;
  if (platform !== undefined) session.platform = platform;
  if (meetingLink !== undefined) session.meetingLink = meetingLink.trim();
  if (meetingId !== undefined) session.meetingId = meetingId.trim();
  if (passcode !== undefined) session.passcode = passcode.trim();
  if (startTime !== undefined) session.startTime = startTime;
  if (durationMinutes !== undefined) session.durationMinutes = durationMinutes;
  if (status !== undefined) session.status = status;

  await session.save();
  res.json(
    await (await session.populate("course", POPULATE_COURSE)).populate("createdBy", POPULATE_AUTHOR)
  );
});

// DELETE /api/admin/sessions/:id
const deleteAdminSession = asyncHandler(async (req, res) => {
  const session = await ConceptualSession.findByIdAndDelete(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ message: "Session deleted" });
});

// ── INSTRUCTOR ────────────────────────────────────────────────────────────

// GET /api/instructor/sessions — nijer created sessions (own courses only)
const getInstructorSessions = asyncHandler(async (req, res) => {
  const sessions = await ConceptualSession.find({ createdBy: req.user._id, createdByRole: "instructor" })
    .populate("course", POPULATE_COURSE)
    .sort({ startTime: -1 });
  res.json(sessions);
});

// POST /api/instructor/sessions — নিজের একটা course, othoba nijer shob course er jonno (scope সবসময় "course")
const createInstructorSession = asyncHandler(async (req, res) => {
  const { title, description, course, allCourses, platform, meetingLink, meetingId, passcode, startTime, durationMinutes } = req.body;

  if (!title?.trim()) return res.status(400).json({ message: "Title required" });
  if (!allCourses && !course) return res.status(400).json({ message: "Course required" });
  if (!["zoom", "google_meet"].includes(platform))
    return res.status(400).json({ message: "Platform must be zoom or google_meet" });
  if (!meetingLink?.trim()) return res.status(400).json({ message: "Meeting link required" });
  if (!startTime) return res.status(400).json({ message: "Start time required" });

  const base = {
    title: title.trim(),
    description: description?.trim() || "",
    scope: "course",
    platform,
    meetingLink: meetingLink.trim(),
    meetingId: meetingId?.trim() || "",
    passcode: passcode?.trim() || "",
    startTime,
    durationMinutes: durationMinutes || 60,
    createdBy: req.user._id,
    createdByRole: "instructor",
  };

  if (allCourses) {
    const myCourses = await Course.find({ createdBy: req.user._id }).select("_id");
    if (myCourses.length === 0) return res.status(404).json({ message: "You have no courses yet" });
    const docs = await ConceptualSession.insertMany(myCourses.map((c) => ({ ...base, course: c._id })));
    const populated = await ConceptualSession.find({ _id: { $in: docs.map((d) => d._id) } }).populate("course", POPULATE_COURSE);
    return res.status(201).json(populated);
  }

  const owned = await Course.findOne({ _id: course, createdBy: req.user._id });
  if (!owned) return res.status(404).json({ message: "Course not found or not yours" });

  const session = await ConceptualSession.create({ ...base, course });
  res.status(201).json(await session.populate("course", POPULATE_COURSE));
});

// PUT /api/instructor/sessions/:id — nijer own only
const updateInstructorSession = asyncHandler(async (req, res) => {
  const session = await ConceptualSession.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!session) return res.status(404).json({ message: "Session not found or not yours" });

  const { title, description, platform, meetingLink, meetingId, passcode, startTime, durationMinutes, status } = req.body;
  if (title !== undefined) session.title = title.trim();
  if (description !== undefined) session.description = description.trim();
  if (platform !== undefined) session.platform = platform;
  if (meetingLink !== undefined) session.meetingLink = meetingLink.trim();
  if (meetingId !== undefined) session.meetingId = meetingId.trim();
  if (passcode !== undefined) session.passcode = passcode.trim();
  if (startTime !== undefined) session.startTime = startTime;
  if (durationMinutes !== undefined) session.durationMinutes = durationMinutes;
  if (status !== undefined) session.status = status;
  // course/scope change kora jabe na

  await session.save();
  res.json(await session.populate("course", POPULATE_COURSE));
});

// DELETE /api/instructor/sessions/:id
const deleteInstructorSession = asyncHandler(async (req, res) => {
  const session = await ConceptualSession.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!session) return res.status(404).json({ message: "Session not found or not yours" });
  res.json({ message: "Session deleted" });
});

// ── FEED (student / instructor — je je session dekha uchit, join korar jonno) ─

const buildSessionFeedFilter = async (user) => {
  if (user.role === "instructor") {
    const myCourses = await Course.find({ createdBy: user._id }).select("_id");
    const myCourseIds = myCourses.map((c) => c._id);
    return {
      status: { $ne: "cancelled" },
      $or: [
        { scope: "global" },
        { scope: "course", course: { $in: myCourseIds } },
      ],
    };
  }

  // default: student ("user" role)
  const approvedEnrollments = await Enrollment.find({ user: user._id, status: "approved" }).select("course");
  const enrolledCourseIds = approvedEnrollments.map((e) => e.course);
  return {
    status: { $ne: "cancelled" },
    $or: [
      { scope: "global" },
      { scope: "course", course: { $in: enrolledCourseIds } },
    ],
  };
};

// GET /api/sessions/feed
const getSessionFeed = asyncHandler(async (req, res) => {
  const filter = await buildSessionFeedFilter(req.user);
  const sessions = await ConceptualSession.find(filter)
    .populate("course", POPULATE_COURSE)
    .populate("createdBy", POPULATE_AUTHOR)
    .sort({ startTime: 1 });
  res.json(sessions);
});

// GET /api/admin/sessions/ended-count — admin sidebar notification badge er jonno
const getEndedSessionsCount = asyncHandler(async (req, res) => {
  const now = new Date();
  const sessions = await ConceptualSession.find({ status: "scheduled" }).select("startTime durationMinutes");
  const count = sessions.filter((s) => {
    const end = new Date(new Date(s.startTime).getTime() + s.durationMinutes * 60000);
    return now > end;
  }).length;
  res.json({ count });
});

module.exports = {
  getAdminSessions, createAdminSession, updateAdminSession, deleteAdminSession, getEndedSessionsCount,
  getInstructorSessions, createInstructorSession, updateInstructorSession, deleteInstructorSession,
  getSessionFeed,
};
