const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const CourseWhatYouLearnSection = require("../models/CourseWhatYouLearnSection");
const CourseWhatYouLearnItem = require("../models/CourseWhatYouLearnItem");
const Category = require("../models/Category");

const resolveCategory = async (slugOrId) => {
  let cat = null;
  if (mongoose.Types.ObjectId.isValid(slugOrId)) cat = await Category.findById(slugOrId);
  if (!cat) cat = await Category.findOne({ slug: slugOrId });
  return cat;
};

// ════════════════════════════════════════════════════════════════════════
// SECTION SETTINGS (one per category) — heading / subtitle
// ════════════════════════════════════════════════════════════════════════

// GET /api/course-what-you-learn/:categorySlug — public
const getWhatYouLearn = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categorySlug);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseWhatYouLearnSection.findOne({ category: cat._id });
  if (!section) section = await CourseWhatYouLearnSection.create({ category: cat._id });

  const items = await CourseWhatYouLearnItem.find({ category: cat._id, isActive: true }).sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, items });
});

// GET /api/admin/course-what-you-learn/:categoryId — admin, section + ALL items
const getAdminWhatYouLearn = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseWhatYouLearnSection.findOne({ category: cat._id });
  if (!section) section = await CourseWhatYouLearnSection.create({ category: cat._id });

  const items = await CourseWhatYouLearnItem.find({ category: cat._id })
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: 1 });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section, items });
});

// PUT /api/admin/course-what-you-learn/:categoryId/section — admin updates heading/subtitle
const updateWhatYouLearnSection = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseWhatYouLearnSection.findOne({ category: cat._id });
  if (!section) section = await CourseWhatYouLearnSection.create({ category: cat._id });

  const { heading, subtitle } = req.body;
  if (heading !== undefined) section.heading = heading;
  if (subtitle !== undefined) section.subtitle = subtitle;

  const updated = await section.save();
  res.json(updated);
});

// ════════════════════════════════════════════════════════════════════════
// ITEMS (full CRUD collection, scoped to a category)
// ════════════════════════════════════════════════════════════════════════

// POST /api/admin/course-what-you-learn/:categoryId/items — admin creates a new bullet
const createWhatYouLearnItem = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  const { text, isActive, order } = req.body;
  if (!text) return res.status(400).json({ message: "Text required" });

  const item = await CourseWhatYouLearnItem.create({
    category: cat._id,
    text,
    isActive: isActive !== undefined ? isActive : true,
    order: order !== undefined ? order : 0,
    createdBy: req.user._id,
  });
  res.status(201).json(item);
});

// PUT /api/admin/course-what-you-learn/items/:id — admin edits a bullet
const updateWhatYouLearnItem = asyncHandler(async (req, res) => {
  const { text, isActive, order } = req.body;
  const item = await CourseWhatYouLearnItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  if (text !== undefined) item.text = text;
  if (isActive !== undefined) item.isActive = isActive;
  if (order !== undefined) item.order = order;

  const updated = await item.save();
  res.json(updated);
});

// DELETE /api/admin/course-what-you-learn/items/:id — admin deletes a bullet
const deleteWhatYouLearnItem = asyncHandler(async (req, res) => {
  const item = await CourseWhatYouLearnItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Item deleted" });
});

module.exports = {
  getWhatYouLearn, getAdminWhatYouLearn, updateWhatYouLearnSection,
  createWhatYouLearnItem, updateWhatYouLearnItem, deleteWhatYouLearnItem,
};
