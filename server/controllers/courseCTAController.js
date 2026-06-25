const asyncHandler      = require("express-async-handler");
const CourseCTASettings = require("../models/CourseCTASettings");

const getOrCreate = async () => {
  let s = await CourseCTASettings.findOne();
  if (!s) s = await CourseCTASettings.create({});
  return s;
};

// PUBLIC — GET /api/course-cta
const getCourseCTA = asyncHandler(async (req, res) => res.json(await getOrCreate()));

// ADMIN — GET /api/admin/course-cta
const getAdminCTA = asyncHandler(async (req, res) => res.json(await getOrCreate()));

// ADMIN — PUT /api/admin/course-cta
const updateCTA = asyncHandler(async (req, res) => {
  const s = await getOrCreate();
  const fields = ["heading","subtitle","primaryBtnText","secondaryBtnText","trustBadges","gradientFrom","gradientVia","gradientTo","isActive"];
  fields.forEach((f) => { if (req.body[f] !== undefined) s[f] = req.body[f]; });
  res.json(await s.save());
});

module.exports = { getCourseCTA, getAdminCTA, updateCTA };
