const asyncHandler = require("express-async-handler");
const Course   = require("../models/Course");
const Category = require("../models/Category");

// ── PUBLIC ────────────────────────────────────────────────────────────────

// GET /api/courses?category=<slug>
// Returns all active courses for a given category slug (or all if no slug)
const getPublicCourses = asyncHandler(async (req, res) => {
  const { category } = req.query;
  let filter = { isActive: true };
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
  }
  const courses = await Course.find(filter)
    .populate("category", "name slug icon")
    .sort({ order: 1, createdAt: -1 });
  res.json(courses);
});

// GET /api/courses/:id  — single course details
const getPublicCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("category", "name slug icon")
    .populate("createdBy", "name email profileImage designation bio role");
  if (!course || !course.isActive) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/courses?category=<categoryId>
const getAdminCourses = asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  const courses = await Course.find(filter)
    .populate("category", "name slug icon")
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: -1 });
  res.json(courses);
});

// POST /api/admin/courses
const createCourse = asyncHandler(async (req, res) => {
  const { category, emoji, image, badge, tags, title, description, rating, students, hours, price, originalPrice, displayStyle, isActive, order } = req.body;
  if (!category) return res.status(400).json({ message: "Category required" });
  if (!title)    return res.status(400).json({ message: "Title required" });

  const course = await Course.create({
    category,
    emoji:         emoji         || "🚀",
    image:         image         || "",
    badge:         badge         || "HOT",
    tags:          Array.isArray(tags) ? tags : [],
    title,
    description:   description   || "",
    rating:        Number(rating)        || 4.8,
    students:      students      || "0",
    hours:         hours         || "0",
    price:         Number(price)         || 0,
    originalPrice: Number(originalPrice) || 0,
    displayStyle:  displayStyle  || "list",
    isActive:      isActive !== undefined ? isActive : true,
    order:         Number(order) || 0,
    createdBy:     req.user._id,
  });
  res.status(201).json(await course.populate("category", "name slug icon"));
});

// PUT /api/admin/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const fields = ["category","emoji","image","badge","tags","title","description","students","hours","displayStyle","isActive","order"];
  fields.forEach((f) => { if (req.body[f] !== undefined) course[f] = req.body[f]; });
  if (req.body.rating        !== undefined) course.rating        = Number(req.body.rating);
  if (req.body.price         !== undefined) course.price         = Number(req.body.price);
  if (req.body.originalPrice !== undefined) course.originalPrice = Number(req.body.originalPrice);
  if (req.body.order         !== undefined) course.order         = Number(req.body.order);

  res.json(await (await course.save()).populate("category", "name slug icon"));
});

// DELETE /api/admin/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json({ message: "Course deleted" });
});

module.exports = { getPublicCourses, getPublicCourse, getAdminCourses, createCourse, updateCourse, deleteCourse };
