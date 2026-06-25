const asyncHandler   = require("express-async-handler");
const CourseFAQ         = require("../models/CourseFAQ");
const CourseFAQSettings = require("../models/CourseFAQSettings");

const getOrCreateSettings = async () => {
  let s = await CourseFAQSettings.findOne();
  if (!s) s = await CourseFAQSettings.create({});
  return s;
};

// PUBLIC — GET /api/course-faq
const getCourseFAQ = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const faqs     = await CourseFAQ.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  res.json({ settings, faqs });
});

// ADMIN — settings
const getAdminFAQSettings = asyncHandler(async (req, res) => res.json(await getOrCreateSettings()));

const updateFAQSettings = asyncHandler(async (req, res) => {
  const s = await getOrCreateSettings();
  const { heading, subtitle } = req.body;
  if (heading  !== undefined) s.heading  = heading;
  if (subtitle !== undefined) s.subtitle = subtitle;
  res.json(await s.save());
});

// ADMIN — CRUD
const getAdminFAQs = asyncHandler(async (req, res) => {
  res.json(await CourseFAQ.find().sort({ order: 1, createdAt: 1 }));
});

const createFAQ = asyncHandler(async (req, res) => {
  const { question, answer, isActive, order } = req.body;
  if (!question) return res.status(400).json({ message: "Question required" });
  if (!answer)   return res.status(400).json({ message: "Answer required" });
  res.status(201).json(await CourseFAQ.create({
    question, answer,
    isActive: isActive !== undefined ? isActive : true,
    order:    Number(order) || 0,
    createdBy: req.user._id,
  }));
});

const updateFAQ = asyncHandler(async (req, res) => {
  const faq = await CourseFAQ.findById(req.params.id);
  if (!faq) return res.status(404).json({ message: "FAQ not found" });
  ["question","answer","isActive","order"].forEach((f) => {
    if (req.body[f] !== undefined) faq[f] = req.body[f];
  });
  if (req.body.order !== undefined) faq.order = Number(req.body.order);
  res.json(await faq.save());
});

const deleteFAQ = asyncHandler(async (req, res) => {
  const faq = await CourseFAQ.findByIdAndDelete(req.params.id);
  if (!faq) return res.status(404).json({ message: "FAQ not found" });
  res.json({ message: "Deleted" });
});

module.exports = { getCourseFAQ, getAdminFAQSettings, updateFAQSettings, getAdminFAQs, createFAQ, updateFAQ, deleteFAQ };
