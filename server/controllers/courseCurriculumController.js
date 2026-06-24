const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const CourseCurriculumSection = require("../models/CourseCurriculumSection");
const CourseCurriculumModule  = require("../models/CourseCurriculumModule");
const Category = require("../models/Category");

// Helper — resolve a category by slug or id, 404 if not found
const resolveCategory = async (slugOrId) => {
  let cat = null;
  if (mongoose.Types.ObjectId.isValid(slugOrId)) cat = await Category.findById(slugOrId);
  if (!cat) cat = await Category.findOne({ slug: slugOrId });
  return cat;
};

// ════════════════════════════════════════════════════════════════════════
// SECTION SETTINGS (one per category) — heading / subtitle
// ════════════════════════════════════════════════════════════════════════

// GET /api/course-curriculum/:categorySlug — public
// Returns { category, section, modules } for that category.
const getCurriculum = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categorySlug);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseCurriculumSection.findOne({ category: cat._id });
  if (!section) section = await CourseCurriculumSection.create({ category: cat._id });

  const modules = await CourseCurriculumModule.find({ category: cat._id, isActive: true })
    .sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, modules });
});

// GET /api/admin/course-curriculum/:categoryId — admin, section + ALL modules (incl. inactive)
const getAdminCurriculum = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseCurriculumSection.findOne({ category: cat._id });
  if (!section) section = await CourseCurriculumSection.create({ category: cat._id });

  const modules = await CourseCurriculumModule.find({ category: cat._id })
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, modules });
});

// PUT /api/admin/course-curriculum/:categoryId/section — admin updates heading/subtitle
const updateCurriculumSection = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseCurriculumSection.findOne({ category: cat._id });
  if (!section) section = await CourseCurriculumSection.create({ category: cat._id });

  const { heading, subtitle } = req.body;
  if (heading  !== undefined) section.heading  = heading;
  if (subtitle !== undefined) section.subtitle = subtitle;

  const updated = await section.save();
  res.json(updated);
});

// ════════════════════════════════════════════════════════════════════════
// MODULES — full CRUD, scoped to a category
// ════════════════════════════════════════════════════════════════════════

// POST /api/admin/course-curriculum/:categoryId/modules
const createCurriculumModule = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  const { week, title, lessons, duration, topics, isActive, order } = req.body;
  if (!week || !title) return res.status(400).json({ message: "Week and title are required" });

  const mod = await CourseCurriculumModule.create({
    category: cat._id,
    week,
    title,
    lessons:  lessons  !== undefined ? lessons  : 0,
    duration: duration || "",
    topics:   Array.isArray(topics) ? topics.map((t) => t.trim()).filter(Boolean) : [],
    isActive: isActive !== undefined ? isActive : true,
    order:    order    !== undefined ? order    : 0,
    createdBy: req.user._id,
  });
  res.status(201).json(mod);
});

// PUT /api/admin/course-curriculum/modules/:id
const updateCurriculumModule = asyncHandler(async (req, res) => {
  const mod = await CourseCurriculumModule.findById(req.params.id);
  if (!mod) return res.status(404).json({ message: "Module not found" });

  const { week, title, lessons, duration, topics, isActive, order } = req.body;
  if (week     !== undefined) mod.week     = week;
  if (title    !== undefined) mod.title    = title;
  if (lessons  !== undefined) mod.lessons  = lessons;
  if (duration !== undefined) mod.duration = duration;
  if (topics   !== undefined) mod.topics   = Array.isArray(topics) ? topics.map((t) => t.trim()).filter(Boolean) : mod.topics;
  if (isActive !== undefined) mod.isActive = isActive;
  if (order    !== undefined) mod.order    = order;

  const updated = await mod.save();
  res.json(updated);
});

// DELETE /api/admin/course-curriculum/modules/:id
const deleteCurriculumModule = asyncHandler(async (req, res) => {
  const mod = await CourseCurriculumModule.findByIdAndDelete(req.params.id);
  if (!mod) return res.status(404).json({ message: "Module not found" });
  res.json({ message: "Module deleted" });
});

module.exports = {
  getCurriculum,
  getAdminCurriculum,
  updateCurriculumSection,
  createCurriculumModule,
  updateCurriculumModule,
  deleteCurriculumModule,
};