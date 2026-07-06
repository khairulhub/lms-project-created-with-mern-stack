const asyncHandler = require("express-async-handler");
const Course      = require("../models/Course");
const Category    = require("../models/Category");
const Enrollment  = require("../models/Enrollment");
const StudentCourseReview = require("../models/StudentCourseReview");

// ── PUBLIC ────────────────────────────────────────────────────────────────

const getPublicCourses = asyncHandler(async (req, res) => {
  const { category } = req.query;
  // Old courses don't have approvalStatus — treat missing as "approved".
  // Only explicitly "rejected" or "pending" courses are hidden.
  let filter = {
    isActive: true,
    $or: [
      { approvalStatus: "approved" },
      { approvalStatus: { $exists: false } },
      { approvalStatus: null },
    ],
  };
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
  }
  const courses = await Course.find(filter)
    .populate("category", "name slug icon")
    .sort({ order: 1, createdAt: -1 });
  res.json(courses);
});

const getPublicCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("category", "name slug icon")
    .populate("createdBy", "name email profileImage designation bio role");
  // Allow old courses with no approvalStatus field, or explicitly approved
  const isApproved = !course?.approvalStatus || course.approvalStatus === "approved";
  if (!course || !course.isActive || !isApproved)
    return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/courses?category=&approval=pending|approved|rejected
const getAdminCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.approval)  filter.approvalStatus = req.query.approval;
  const courses = await Course.find(filter)
    .populate("category", "name slug icon")
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });
  res.json(courses);
});

// POST /api/admin/courses  — admin creates: auto approved + active
const createCourse = asyncHandler(async (req, res) => {
  const { category, emoji, image, badge, tags, title, description,
          rating, students, hours, price, originalPrice, displayStyle, isActive, order } = req.body;
  if (!category) return res.status(400).json({ message: "Category required" });
  if (!title)    return res.status(400).json({ message: "Title required" });

  const course = await Course.create({
    category, emoji: emoji||"🚀", image: image||"", badge: badge||"HOT",
    tags: Array.isArray(tags) ? tags : [], title, description: description||"",
    rating: Number(rating)||4.8, students: students||"0", hours: hours||"0",
    price: Number(price)||0, originalPrice: Number(originalPrice)||0,
    displayStyle: displayStyle||"list",
    isActive: isActive !== undefined ? isActive : true,
    order: Number(order)||0,
    createdBy: req.user._id,
    approvalStatus: "approved", // admin creates → auto approved
  });
  res.status(201).json(await course.populate("category", "name slug icon"));
});

// PUT /api/admin/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const fields = ["category","emoji","image","badge","tags","title","description",
                  "students","hours","displayStyle","isActive","order","approvalStatus"];
  fields.forEach((f) => { if (req.body[f] !== undefined) course[f] = req.body[f]; });
  ["rating","price","originalPrice","order"].forEach((f) => {
    if (req.body[f] !== undefined) course[f] = Number(req.body[f]);
  });
  res.json(await (await course.save()).populate("category", "name slug icon"));
});

// PUT /api/admin/courses/:id/approve  — approve a pending course
const approveCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  course.approvalStatus = "approved";
  course.isActive = true;
  res.json(await course.save());
});

// PUT /api/admin/courses/:id/reject
const rejectCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  course.approvalStatus = "rejected";
  course.isActive = false;
  res.json(await course.save());
});

// DELETE /api/admin/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json({ message: "Course deleted" });
});

// GET /api/admin/courses/:id/stats  — per-course enrollment + revenue + review stats
const getCourseStats = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const [enrollments, reviews] = await Promise.all([
    Enrollment.find({ course: courseId })
      .select("status amountPaid user createdAt")
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 })
      .lean(),
    StudentCourseReview.find({ course: courseId, isActive: true })
      .select("name rating text createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const approved  = enrollments.filter((e) => e.status === "approved");
  const pending   = enrollments.filter((e) => e.status === "pending");
  const rejected  = enrollments.filter((e) => e.status === "rejected");
  const revenue   = approved.reduce((s, e) => s + (e.amountPaid || 0), 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  res.json({
    totalEnrollments: enrollments.length,
    approvedCount: approved.length,
    pendingCount:  pending.length,
    rejectedCount: rejected.length,
    totalRevenue:  revenue,
    reviewCount:   reviews.length,
    avgRating,
    recentEnrollments: approved.slice(0, 10),
    recentReviews:     reviews.slice(0, 10),
  });
});

// ── INSTRUCTOR ────────────────────────────────────────────────────────────

// GET /api/instructor/courses  — instructor-er nijer courses only
const getInstructorCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ createdBy: req.user._id })
    .populate("category", "name slug icon")
    .sort({ createdAt: -1 });
  res.json(courses);
});

// POST /api/instructor/courses  — instructor creates: pending + inactive until admin approves
const instructorCreateCourse = asyncHandler(async (req, res) => {
  const { category, emoji, image, badge, tags, title, description,
          hours, price, originalPrice } = req.body;
  if (!category) return res.status(400).json({ message: "Category required" });
  if (!title)    return res.status(400).json({ message: "Title required" });

  const course = await Course.create({
    category, emoji: emoji||"🚀", image: image||"", badge: badge||"NEW",
    tags: Array.isArray(tags) ? tags : [], title, description: description||"",
    hours: hours||"0", price: Number(price)||0, originalPrice: Number(originalPrice)||0,
    createdBy: req.user._id,
    isActive: false,           // not visible publicly until admin approves
    approvalStatus: "pending", // admin must approve
    displayStyle: "list",
  });
  res.status(201).json(await course.populate("category", "name slug icon"));
});

// PUT /api/instructor/courses/:id  — instructor edits own course, no re-approval needed
const instructorUpdateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!course) return res.status(404).json({ message: "Course not found or not yours" });

  const fields = ["emoji","image","badge","tags","title","description","hours","category","isActive"];
  fields.forEach((f) => { if (req.body[f] !== undefined) course[f] = req.body[f]; });
  ["price","originalPrice"].forEach((f) => {
    if (req.body[f] !== undefined) course[f] = Number(req.body[f]);
  });
  // approvalStatus untouched — edit করলে pending-এ যাবে না
  res.json(await course.save());
});

// DELETE /api/instructor/courses/:id — instructor can delete only own courses
const instructorDeleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!course) return res.status(404).json({ message: "Course not found or not yours" });
  res.json({ message: "Deleted" });
});

// GET /api/instructor/courses/:id/stats  — per-course stats for instructor (own course only)
const getInstructorCourseStats = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!course) return res.status(404).json({ message: "Not found or not yours" });

  const [enrollments, reviews] = await Promise.all([
    Enrollment.find({ course: course._id, status: "approved" })
      .select("amountPaid user createdAt")
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 }).lean(),
    StudentCourseReview.find({ course: course._id, isActive: true })
      .select("name rating text createdAt").sort({ createdAt: -1 }).lean(),
  ]);
  const revenue   = enrollments.reduce((s, e) => s + (e.amountPaid || 0), 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  res.json({
    studentCount: enrollments.length,
    totalRevenue: revenue,
    reviewCount:  reviews.length,
    avgRating,
    recentStudents: enrollments.slice(0, 8),
    recentReviews:  reviews.slice(0, 8),
  });
});

module.exports = {
  getPublicCourses, getPublicCourse,
  getAdminCourses, createCourse, updateCourse, approveCourse, rejectCourse, deleteCourse, getCourseStats,
  getInstructorCourses, instructorCreateCourse, instructorUpdateCourse, instructorDeleteCourse, getInstructorCourseStats,
};
