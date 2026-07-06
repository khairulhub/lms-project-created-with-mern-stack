const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const InstructorRequest = require("../models/InstructorRequest");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const StudentCourseReview = require("../models/StudentCourseReview");

// GET /api/users/profile — get own profile
const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile — update own profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, designation, bio, phone, profileImage } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (designation !== undefined) user.designation = designation;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (profileImage !== undefined) user.profileImage = profileImage;

  const updated = await user.save();
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    profileImage: updated.profileImage,
    designation: updated.designation,
    bio: updated.bio,
    phone: updated.phone,
  });
});

// POST /api/users/request-instructor — user requests to become instructor
const requestInstructor = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (req.user.role !== "user") {
    return res
      .status(400)
      .json({ message: "Only regular users can request instructor role" });
  }

  const existing = await InstructorRequest.findOne({
    user: req.user._id,
    status: "pending",
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "You already have a pending request" });
  }

  const request = await InstructorRequest.create({
    user: req.user._id,
    reason: reason || "",
  });

  res.status(201).json({ message: "Request submitted", request });
});

// GET /api/users/my-request — check own instructor request status
const getMyRequest = asyncHandler(async (req, res) => {
  const request = await InstructorRequest.findOne({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate("reviewedBy", "name email");
  res.json(request || null);
});

// GET /api/instructor/stats — instructor-er nijer course/student/revenue/review stats
// instructorOnly middleware allow kore (admin + instructor role)
const getInstructorStats = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  // instructor-er sathe related saব courses (createdBy = req.user._id)
  const courses = await Course.find({ createdBy: instructorId, isActive: true })
    .select("_id title emoji badge price rating")
    .lean();

  const courseIds = courses.map((c) => c._id);

  const [enrollments, reviews] = await Promise.all([
    Enrollment.find({ course: { $in: courseIds }, status: "approved" })
      .select("user course amountPaid createdAt")
      .populate("user", "name email profileImage")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean(),
    StudentCourseReview.find({ course: { $in: courseIds }, isActive: true })
      .select("name rating text course createdAt")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const uniqueStudents = [...new Set(enrollments.map((e) => e.user?._id?.toString()))].length;
  const totalRevenue   = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const avgRating      = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  res.json({
    courseCount:    courses.length,
    studentCount:   uniqueStudents,
    totalRevenue,
    reviewCount:    reviews.length,
    avgRating,
    courses,
    recentEnrollments: enrollments.slice(0, 5),
    recentReviews:     reviews.slice(0, 5),
  });
});

module.exports = { getProfile, updateProfile, requestInstructor, getMyRequest, getInstructorStats };
