const asyncHandler = require("express-async-handler");
const CourseCareerItem     = require("../models/CourseCareerItem");
const CourseCareerSettings = require("../models/CourseCareerSettings");

const getOrCreateSettings = async () => {
  let s = await CourseCareerSettings.findOne();
  if (!s) s = await CourseCareerSettings.create({});
  return s;
};

// ════════════════════════════════════════════════════════════════
// PUBLIC
// ════════════════════════════════════════════════════════════════

// GET /api/course-career
// Returns { settings, bullets (latest 3 active), stats (all active) }
const getCourseCareer = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const bullets  = await CourseCareerItem.find({ isActive: true, type: "bullet" })
    .sort({ order: 1, createdAt: -1 })
    .limit(settings.bulletLimit || 3);
  const stats    = await CourseCareerItem.find({ isActive: true, type: "stat" })
    .sort({ order: 1, createdAt: 1 });
  res.json({ settings, bullets, stats });
});

// ════════════════════════════════════════════════════════════════
// ADMIN — SETTINGS
// ════════════════════════════════════════════════════════════════

// GET /api/admin/course-career/settings
const getAdminCareerSettings = asyncHandler(async (req, res) => {
  res.json(await getOrCreateSettings());
});

// PUT /api/admin/course-career/settings
const updateCareerSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  const { heading, subtitle, displayStyle, bulletLimit } = req.body;
  if (heading      !== undefined) s.heading      = heading;
  if (subtitle     !== undefined) s.subtitle     = subtitle;
  if (displayStyle !== undefined) s.displayStyle = displayStyle;
  if (bulletLimit  !== undefined) s.bulletLimit  = Number(bulletLimit);
  res.json(await s.save());
});

// ════════════════════════════════════════════════════════════════
// ADMIN — ITEMS CRUD
// ════════════════════════════════════════════════════════════════

// GET /api/admin/course-career — all items
const getAdminCareerItems = asyncHandler(async (req, res) => {
  const items = await CourseCareerItem.find()
    .populate("createdBy", "name")
    .sort({ type: 1, order: 1, createdAt: -1 });
  res.json(items);
});

// POST /api/admin/course-career
const createCareerItem = asyncHandler(async (req, res) => {
  const { type, icon, text, value, label, colorFrom, colorTo, isActive, order } = req.body;
  if (!type) return res.status(400).json({ message: "type required (bullet | stat)" });
  if (type === "bullet" && !text) return res.status(400).json({ message: "text required for bullet" });
  if (type === "stat"   && !value) return res.status(400).json({ message: "value required for stat" });

  const item = await CourseCareerItem.create({
    type,
    icon:      icon      || "🚀",
    text:      text      || "",
    value:     value     || "",
    label:     label     || "",
    colorFrom: colorFrom || "#7c3aed",
    colorTo:   colorTo   || "#6d28d9",
    isActive:  isActive !== undefined ? isActive : true,
    order:     Number(order) || 0,
    createdBy: req.user._id,
  });
  res.status(201).json(item);
});

// PUT /api/admin/course-career/:id
const updateCareerItem = asyncHandler(async (req, res) => {
  const item = await CourseCareerItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const fields = ["type","icon","text","value","label","colorFrom","colorTo","isActive","order"];
  fields.forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  if (req.body.order !== undefined) item.order = Number(req.body.order);

  res.json(await item.save());
});

// DELETE /api/admin/course-career/:id
const deleteCareerItem = asyncHandler(async (req, res) => {
  const item = await CourseCareerItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Deleted" });
});

module.exports = {
  getCourseCareer,
  getAdminCareerSettings,
  updateCareerSettings,
  getAdminCareerItems,
  createCareerItem,
  updateCareerItem,
  deleteCareerItem,
};
