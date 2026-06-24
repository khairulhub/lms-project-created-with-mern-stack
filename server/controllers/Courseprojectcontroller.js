const asyncHandler = require("express-async-handler");
const CourseProject = require("../models/CourseProject");
const CourseProjectSettings = require("../models/CourseProjectSettings");

// helper — get or create singleton settings
const getOrCreateSettings = async () => {
  let s = await CourseProjectSettings.findOne();
  if (!s) s = await CourseProjectSettings.create({});
  return s;
};

// ════════════════════════════════════════════════════════════════
// PUBLIC
// ════════════════════════════════════════════════════════════════

// GET /api/course-projects
// Returns { settings, projects } — latest 4 active projects
const getCourseProjects = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const projects = await CourseProject.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .limit(4);
  res.json({ settings, projects });
});

// ════════════════════════════════════════════════════════════════
// ADMIN — SETTINGS (singleton)
// ════════════════════════════════════════════════════════════════

// GET /api/admin/course-projects/settings
const getAdminProjectSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

// PUT /api/admin/course-projects/settings
const updateProjectSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { heading, subtitle, displayStyle } = req.body;
  if (heading !== undefined)      settings.heading      = heading;
  if (subtitle !== undefined)     settings.subtitle     = subtitle;
  if (displayStyle !== undefined) settings.displayStyle = displayStyle;
  const updated = await settings.save();
  res.json(updated);
});

// ════════════════════════════════════════════════════════════════
// ADMIN — PROJECTS CRUD
// ════════════════════════════════════════════════════════════════

// GET /api/admin/course-projects — all projects (active + inactive)
const getAdminProjects = asyncHandler(async (req, res) => {
  const projects = await CourseProject.find()
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: -1 });
  res.json(projects);
});

// POST /api/admin/course-projects
const createProject = asyncHandler(async (req, res) => {
  const { emoji, title, description, techTags, isActive, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });

  const project = await CourseProject.create({
    emoji:       emoji || "🚀",
    title,
    description: description || "",
    techTags:    Array.isArray(techTags) ? techTags.map((t) => t.trim()).filter(Boolean) : [],
    isActive:    isActive !== undefined ? isActive : true,
    order:       order !== undefined ? Number(order) : 0,
    createdBy:   req.user._id,
  });
  res.status(201).json(project);
});

// PUT /api/admin/course-projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await CourseProject.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  const { emoji, title, description, techTags, isActive, order } = req.body;
  if (emoji       !== undefined) project.emoji       = emoji;
  if (title       !== undefined) project.title       = title;
  if (description !== undefined) project.description = description;
  if (techTags    !== undefined) project.techTags    = Array.isArray(techTags) ? techTags.map((t) => t.trim()).filter(Boolean) : project.techTags;
  if (isActive    !== undefined) project.isActive    = isActive;
  if (order       !== undefined) project.order       = Number(order);

  const updated = await project.save();
  res.json(updated);
});

// DELETE /api/admin/course-projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await CourseProject.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json({ message: "Project deleted" });
});

module.exports = {
  getCourseProjects,
  getAdminProjectSettings,
  updateProjectSettings,
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
};