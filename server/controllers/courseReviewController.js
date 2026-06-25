const asyncHandler = require("express-async-handler");
const CourseReview         = require("../models/CourseReview");
const CourseReviewSettings = require("../models/CourseReviewSettings");

const getOrCreateSettings = async () => {
  let s = await CourseReviewSettings.findOne();
  if (!s) s = await CourseReviewSettings.create({});
  return s;
};

// ── PUBLIC ───────────────────────────────────────────────────────────────
// GET /api/course-reviews
const getCourseReviews = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const reviews  = await CourseReview.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 });
  res.json({ settings, reviews });
});

// ── ADMIN — SETTINGS ─────────────────────────────────────────────────────
// GET /api/admin/course-reviews/settings
const getAdminReviewSettings = asyncHandler(async (req, res) => {
  res.json(await getOrCreateSettings());
});

// PUT /api/admin/course-reviews/settings
const updateReviewSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  const { heading, avgRating, totalReviews, displayStyle, autoSlideMs, ratingBars } = req.body;
  if (heading      !== undefined) s.heading      = heading;
  if (avgRating    !== undefined) s.avgRating    = Number(avgRating);
  if (totalReviews !== undefined) s.totalReviews = totalReviews;
  if (displayStyle !== undefined) s.displayStyle = displayStyle;
  if (autoSlideMs  !== undefined) s.autoSlideMs  = Number(autoSlideMs);
  if (ratingBars   !== undefined) s.ratingBars   = ratingBars;
  res.json(await s.save());
});

// ── ADMIN — REVIEWS CRUD ─────────────────────────────────────────────────
// GET /api/admin/course-reviews
const getAdminReviews = asyncHandler(async (req, res) => {
  const reviews = await CourseReview.find()
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: -1 });
  res.json(reviews);
});

// POST /api/admin/course-reviews
const createReview = asyncHandler(async (req, res) => {
  const { name, role, avatarSeed, rating, text, isActive, order } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  if (!text) return res.status(400).json({ message: "Review text required" });

  const review = await CourseReview.create({
    name,
    role:        role        || "",
    avatarSeed:  avatarSeed  || name.toLowerCase().replace(/\s+/g, ""),
    rating:      Number(rating) || 5,
    text,
    isActive:    isActive !== undefined ? isActive : true,
    order:       Number(order) || 0,
    createdBy:   req.user._id,
  });
  res.status(201).json(review);
});

// PUT /api/admin/course-reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await CourseReview.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  const fields = ["name", "role", "avatarSeed", "rating", "text", "isActive", "order"];
  fields.forEach((f) => { if (req.body[f] !== undefined) review[f] = req.body[f]; });
  if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
  if (req.body.order  !== undefined) review.order  = Number(req.body.order);

  res.json(await review.save());
});

// DELETE /api/admin/course-reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await CourseReview.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  res.json({ message: "Deleted" });
});

module.exports = {
  getCourseReviews,
  getAdminReviewSettings,
  updateReviewSettings,
  getAdminReviews,
  createReview,
  updateReview,
  deleteReview,
};
