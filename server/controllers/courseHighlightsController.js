const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const CourseHighlightSection = require("../models/CourseHighlightSection");
const CourseHighlightItem = require("../models/CourseHighlightItem");
const Category = require("../models/Category");

// Helper — resolve a category by slug or id, 404 if not found
const resolveCategory = async (slugOrId) => {
  let cat = null;
  if (mongoose.Types.ObjectId.isValid(slugOrId)) {
    cat = await Category.findById(slugOrId);
  }
  if (!cat) cat = await Category.findOne({ slug: slugOrId });
  return cat;
};

// ════════════════════════════════════════════════════════════════════════
// SECTION SETTINGS (one per category) — heading / subtitle / tech tags
// ════════════════════════════════════════════════════════════════════════

// GET /api/course-highlights/:categorySlug — public
// Returns { section, items } for that category. Auto-creates the section
// doc with defaults the first time it's requested for a given category.
const getCourseHighlights = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categorySlug);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseHighlightSection.findOne({ category: cat._id });
  if (!section) section = await CourseHighlightSection.create({ category: cat._id });

  const items = await CourseHighlightItem.find({ category: cat._id, isActive: true }).sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, items });
});

// GET /api/admin/course-highlights/:categoryId — admin, section + ALL items (active + inactive)
const getAdminCourseHighlights = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseHighlightSection.findOne({ category: cat._id });
  if (!section) section = await CourseHighlightSection.create({ category: cat._id });

  const items = await CourseHighlightItem.find({ category: cat._id })
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, items });
});

// PUT /api/admin/course-highlights/:categoryId/section — admin updates heading/subtitle/tags for that category
const updateCourseHighlightSection = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseHighlightSection.findOne({ category: cat._id });
  if (!section) section = await CourseHighlightSection.create({ category: cat._id });

  const { heading, subtitle, techTagsLabel, techTags } = req.body;
  if (heading !== undefined) section.heading = heading;
  if (subtitle !== undefined) section.subtitle = subtitle;
  if (techTagsLabel !== undefined) section.techTagsLabel = techTagsLabel;
  if (techTags !== undefined) section.techTags = Array.isArray(techTags) ? techTags.map((t) => t.trim()).filter(Boolean) : section.techTags;

  const updated = await section.save();
  res.json(updated);
});

// ════════════════════════════════════════════════════════════════════════
// HIGHLIGHT ITEMS (full CRUD collection, scoped to a category)
// ════════════════════════════════════════════════════════════════════════

// POST /api/admin/course-highlights/:categoryId/items — admin creates a new card
const createCourseHighlightItem = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  const { icon, title, description, isActive, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });

  const item = await CourseHighlightItem.create({
    category: cat._id,
    icon: icon || "🤖",
    title,
    description: description || "",
    isActive: isActive !== undefined ? isActive : true,
    order: order !== undefined ? order : 0,
    createdBy: req.user._id,
  });
  res.status(201).json(item);
});

// PUT /api/admin/course-highlights/items/:id — admin edits a card
const updateCourseHighlightItem = asyncHandler(async (req, res) => {
  const { icon, title, description, isActive, order } = req.body;
  const item = await CourseHighlightItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Highlight item not found" });

  if (icon !== undefined) item.icon = icon;
  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (isActive !== undefined) item.isActive = isActive;
  if (order !== undefined) item.order = order;

  const updated = await item.save();
  res.json(updated);
});

// DELETE /api/admin/course-highlights/items/:id — admin deletes a card
const deleteCourseHighlightItem = asyncHandler(async (req, res) => {
  const item = await CourseHighlightItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Highlight item not found" });
  res.json({ message: "Highlight item deleted" });
});

module.exports = {
  getCourseHighlights,
  getAdminCourseHighlights,
  updateCourseHighlightSection,
  createCourseHighlightItem,
  updateCourseHighlightItem,
  deleteCourseHighlightItem,
};
