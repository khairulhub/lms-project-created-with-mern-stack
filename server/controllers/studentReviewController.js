const asyncHandler       = require("express-async-handler");
const StudentCourseReview = require("../models/StudentCourseReview");
const InstructorReview    = require("../models/InstructorReview");
const Course              = require("../models/Course");
const User                = require("../models/User");

// ══════════════════════════════════════════════════════════════════════════
// COURSE REVIEWS
// ══════════════════════════════════════════════════════════════════════════

// PUBLIC — GET /api/student-reviews/course/:courseId  → only active
const getPublicCourseReviews = asyncHandler(async (req, res) => {
  const reviews = await StudentCourseReview.find({
    course: req.params.courseId,
    isActive: true,
  }).sort({ createdAt: -1 });
  res.json(reviews);
});

// PUBLIC — GET /api/student-reviews/active-all  → active reviews from EVERY
// course, combined. Used on the Home page testimonials section, which mixes
// these real student reviews together with the admin-curated global
// CourseReview list (see courseReviewController.js) — NOT used on the
// single-course details page (that page only wants ITS OWN course's reviews).
const getAllActiveStudentReviews = asyncHandler(async (req, res) => {
  const reviews = await StudentCourseReview.find({ isActive: true })
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(reviews);
});

// PUBLIC — POST /api/student-reviews/course/:courseId  → submit review (pending)
const submitCourseReview = asyncHandler(async (req, res) => {
  const { name, email, rating, text } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "নাম দাও" });
  if (!text?.trim()) return res.status(400).json({ message: "Review লিখো" });

  const course = await Course.findById(req.params.courseId);
  if (!course || !course.isActive)
    return res.status(404).json({ message: "Course পাওয়া যায়নি" });

  const review = await StudentCourseReview.create({
    course: req.params.courseId,
    name:   name.trim(),
    email:  email?.trim() || "",
    rating: Number(rating) || 5,
    text:   text.trim(),
    status:   "pending",
    isActive: false,
  });
  res.status(201).json({ message: "Review জমা হয়েছে। Admin approve করলে দেখা যাবে।", review });
});

// ADMIN — GET /api/admin/student-reviews/courses  → ALL active courses, with
// their real StudentCourseReview counts (0 if none yet). Shows every course
// — not just ones that already have a review — so it's clear this page is
// strictly StudentCourseReview-only (separate from CourseDetail's admin-
// curated reviews, which live elsewhere and are never mixed in here).
const getAdminCourseReviewCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isActive: true }).select("title emoji badge isActive").lean();

  const counts = await StudentCourseReview.aggregate([
    { $group: { _id: "$course", total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[c._id.toString()] = c; });

  const result = courses.map((c) => ({
    ...c,
    counts: countMap[c._id.toString()] || { total: 0, active: 0, pending: 0 },
  }));
  res.json(result);
});

// ADMIN — GET /api/admin/student-reviews/course/:courseId  → all reviews for a course
const getAdminCourseReviews = asyncHandler(async (req, res) => {
  const { status } = req.query; // optional filter: pending | active | rejected
  const filter = { course: req.params.courseId };
  if (status) filter.status = status;
  const reviews = await StudentCourseReview.find(filter).sort({ createdAt: -1 });
  // also return course info
  const course  = await Course.findById(req.params.courseId).select("title emoji badge");
  res.json({ course, reviews });
});

// ADMIN — PUT /api/admin/student-reviews/:id  → activate / reject / edit note
const updateCourseReview = asyncHandler(async (req, res) => {
  const review = await StudentCourseReview.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review পাওয়া যায়নি" });

  const { isActive, status, adminNote } = req.body;
  if (isActive  !== undefined) {
    review.isActive = isActive;
    review.status   = isActive ? "active" : (review.status === "active" ? "pending" : review.status);
  }
  if (status    !== undefined) {
    review.status   = status;
    review.isActive = status === "active";
  }
  if (adminNote !== undefined) review.adminNote = adminNote;

  await review.save();
  res.json(review);
});

// ADMIN — DELETE /api/admin/student-reviews/:id
const deleteCourseReview = asyncHandler(async (req, res) => {
  const review = await StudentCourseReview.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: "Review পাওয়া যায়নি" });
  res.json({ message: "Deleted" });
});

// ══════════════════════════════════════════════════════════════════════════
// INSTRUCTOR REVIEWS
// ══════════════════════════════════════════════════════════════════════════

// PUBLIC — GET /api/student-reviews/instructor/:instructorId  → only active
const getPublicInstructorReviews = asyncHandler(async (req, res) => {
  const reviews = await InstructorReview.find({
    instructor: req.params.instructorId,
    isActive: true,
  }).sort({ createdAt: -1 });
  res.json(reviews);
});

// PUBLIC — POST /api/student-reviews/instructor/:instructorId
const submitInstructorReview = asyncHandler(async (req, res) => {
  const { name, email, rating, text } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "নাম দাও" });
  if (!text?.trim()) return res.status(400).json({ message: "Review লিখো" });

  const instructor = await User.findById(req.params.instructorId);
  if (!instructor || !["instructor","admin"].includes(instructor.role))
    return res.status(404).json({ message: "Instructor পাওয়া যায়নি" });

  const review = await InstructorReview.create({
    instructor: req.params.instructorId,
    name:   name.trim(),
    email:  email?.trim() || "",
    rating: Number(rating) || 5,
    text:   text.trim(),
    status:   "pending",
    isActive: false,
  });
  res.status(201).json({ message: "Review জমা হয়েছে। Admin approve করলে দেখা যাবে।", review });
});

// ADMIN — GET /api/admin/student-reviews/instructors → all instructors that have reviews
const getAdminInstructorReviewList = asyncHandler(async (req, res) => {
  const instructorIds = await InstructorReview.distinct("instructor");
  const instructors   = await User.find({ _id: { $in: instructorIds } }).select("name email profileImage designation role").lean();

  const counts = await InstructorReview.aggregate([
    { $group: { _id: "$instructor", total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[c._id.toString()] = c; });

  const result = instructors.map((i) => ({
    ...i,
    counts: countMap[i._id.toString()] || { total: 0, active: 0, pending: 0 },
  }));
  res.json(result);
});

// ADMIN — GET /api/admin/student-reviews/instructor/:instructorId → all reviews
const getAdminInstructorReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { instructor: req.params.instructorId };
  if (status) filter.status = status;
  const reviews    = await InstructorReview.find(filter).sort({ createdAt: -1 });
  const instructor = await User.findById(req.params.instructorId).select("name email profileImage designation bio");
  res.json({ instructor, reviews });
});

// ADMIN — PUT /api/admin/student-reviews/instructor-review/:id
const updateInstructorReview = asyncHandler(async (req, res) => {
  const review = await InstructorReview.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review পাওয়া যায়নি" });

  const { isActive, status, adminNote } = req.body;
  if (isActive  !== undefined) {
    review.isActive = isActive;
    review.status   = isActive ? "active" : (review.status === "active" ? "pending" : review.status);
  }
  if (status    !== undefined) {
    review.status   = status;
    review.isActive = status === "active";
  }
  if (adminNote !== undefined) review.adminNote = adminNote;

  await review.save();
  res.json(review);
});

// ADMIN — DELETE /api/admin/student-reviews/instructor-review/:id
const deleteInstructorReview = asyncHandler(async (req, res) => {
  const review = await InstructorReview.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: "Review পাওয়া যায়নি" });
  res.json({ message: "Deleted" });
});

module.exports = {
  // course
  getPublicCourseReviews,
  getAllActiveStudentReviews,
  submitCourseReview,
  getAdminCourseReviewCourses,
  getAdminCourseReviews,
  updateCourseReview,
  deleteCourseReview,
  // instructor
  getPublicInstructorReviews,
  submitInstructorReview,
  getAdminInstructorReviewList,
  getAdminInstructorReviews,
  updateInstructorReview,
  deleteInstructorReview,
};