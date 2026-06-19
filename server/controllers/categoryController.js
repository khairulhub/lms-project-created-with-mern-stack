const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");

const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

// GET /api/categories — public
const getCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json(cats);
});

// GET /api/admin/categories — all including inactive
const getAllCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find({})
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  res.json(cats);
});

// POST /api/admin/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  const slug = slugify(name);
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(400).json({ message: "Category already exists" });

  const cat = await Category.create({
    name,
    slug,
    description: description || "",
    icon: icon || "📁",
    createdBy: req.user._id,
  });
  res.status(201).json(cat);
});

// PUT /api/admin/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, isActive } = req.body;
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  if (name) { cat.name = name; cat.slug = slugify(name); }
  if (description !== undefined) cat.description = description;
  if (icon !== undefined) cat.icon = icon;
  if (isActive !== undefined) cat.isActive = isActive;

  const updated = await cat.save();
  res.json(updated);
});

// DELETE /api/admin/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ message: "Category not found" });
  res.json({ message: "Category deleted" });
});

module.exports = { getCategories, getAllCategories, createCategory, updateCategory, deleteCategory };
