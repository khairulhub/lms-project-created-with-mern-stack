const asyncHandler = require("express-async-handler");
const CourseDetail = require("../models/CourseDetail");
const Course       = require("../models/Course");

// ── Ownership check helper ─────────────────────────────────────────────────
// Admin = full access to any course detail.
// Instructor = only their own courses (createdBy === req.user._id).
const checkOwnership = async (courseId, user) => {
  if (user.role === "admin") return true;
  const course = await Course.findById(courseId).select("createdBy");
  return course && course.createdBy?.toString() === user._id.toString();
};

// ── Helper: find-or-init ───────────────────────────────────────────────────
const findOrInit = async (courseId) => {
  let doc = await CourseDetail.findOne({ course: courseId });
  if (!doc) doc = await CourseDetail.create({ course: courseId });
  return doc;
};

// ── PUBLIC ─────────────────────────────────────────────────────────────────
const getPublicCourseDetail = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.isActive)
    return res.status(404).json({ message: "Course not found" });
  const detail = await CourseDetail.findOne({ course: req.params.courseId });
  if (!detail) return res.json(null);
  const safe = detail.toObject();
  safe.whatYouGet   = safe.whatYouGet.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.requirements = safe.requirements.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.faqs         = safe.faqs.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.reviews      = safe.reviews.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.curriculum   = safe.curriculum
    .filter((s) => s.isActive).sort((a,b)=>a.order-b.order)
    .map((s) => ({ ...s, lectures: s.lectures.filter((l) => l.isActive).sort((a,b)=>a.order-b.order) }));
  res.json(safe);
});

// ── ADMIN / INSTRUCTOR (shared, ownership-checked) ─────────────────────────
const getAdminCourseDetail = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  res.json(await findOrInit(req.params.courseId));
});

const updateCourseDetailMeta = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { introVideoUrl, introVideoType } = req.body;
  if (introVideoUrl  !== undefined) doc.introVideoUrl  = introVideoUrl;
  if (introVideoType !== undefined) doc.introVideoType = introVideoType;
  res.json(await doc.save());
});

// ── whatYouGet ─────────────────────────────────────────────────────────────
const addWhatYouGet = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { text, order } = req.body;
  if (!text) return res.status(400).json({ message: "Text required" });
  doc.whatYouGet.push({ text, order: order ?? doc.whatYouGet.length, isActive: true });
  res.json(await doc.save());
});

const updateWhatYouGet = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const item = doc.whatYouGet.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });
  ["text","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteWhatYouGet = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  doc.whatYouGet = doc.whatYouGet.filter((i) => i._id.toString() !== req.params.itemId);
  res.json(await doc.save());
});

// ── requirements ───────────────────────────────────────────────────────────
const addRequirement = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { text, order } = req.body;
  if (!text) return res.status(400).json({ message: "Text required" });
  doc.requirements.push({ text, order: order ?? doc.requirements.length, isActive: true });
  res.json(await doc.save());
});

const updateRequirement = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const item = doc.requirements.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });
  ["text","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteRequirement = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  doc.requirements = doc.requirements.filter((i) => i._id.toString() !== req.params.itemId);
  res.json(await doc.save());
});

// ── FAQs ───────────────────────────────────────────────────────────────────
const addCDFAQ = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { question, answer, order } = req.body;
  if (!question || !answer) return res.status(400).json({ message: "Question & answer required" });
  doc.faqs.push({ question, answer, order: order ?? doc.faqs.length, isActive: true });
  res.json(await doc.save());
});

const updateCDFAQ = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const item = doc.faqs.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "FAQ not found" });
  ["question","answer","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteCDFAQ = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  doc.faqs = doc.faqs.filter((i) => i._id.toString() !== req.params.itemId);
  res.json(await doc.save());
});

// ── Reviews ────────────────────────────────────────────────────────────────
const addCDReview = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { name, role, avatarSeed, rating, text, order } = req.body;
  if (!name || !text) return res.status(400).json({ message: "Name & text required" });
  doc.reviews.push({ name, role: role||"", avatarSeed: avatarSeed||"", rating: rating||5, text, order: order ?? doc.reviews.length, isActive: true });
  res.json(await doc.save());
});

const updateCDReview = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const item = doc.reviews.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Review not found" });
  ["name","role","avatarSeed","rating","text","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteCDReview = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  doc.reviews = doc.reviews.filter((i) => i._id.toString() !== req.params.itemId);
  res.json(await doc.save());
});

// ── Curriculum Sections ────────────────────────────────────────────────────
const addCDSection = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const { title, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });
  doc.curriculum.push({ title, order: order ?? doc.curriculum.length, isActive: true, lectures: [] });
  res.json(await doc.save());
});

const updateCDSection = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  ["title","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) section[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteCDSection = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  doc.curriculum = doc.curriculum.filter((s) => s._id.toString() !== req.params.sectionId);
  res.json(await doc.save());
});

// ── Lectures ───────────────────────────────────────────────────────────────
const addCDLecture = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  const { title, duration, videoUrl, preview, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });
  section.lectures.push({ title, duration: duration||"", videoUrl: videoUrl||"", preview: preview||false, order: order ?? section.lectures.length, isActive: true });
  res.json(await doc.save());
});

const updateCDLecture = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  const lecture = section.lectures.id(req.params.lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });
  ["title","duration","videoUrl","preview","order","isActive"].forEach((f) => { if (req.body[f] !== undefined) lecture[f] = req.body[f]; });
  res.json(await doc.save());
});

const deleteCDLecture = asyncHandler(async (req, res) => {
  const allowed = await checkOwnership(req.params.courseId, req.user);
  if (!allowed) return res.status(403).json({ message: "Access denied" });
  const doc = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  section.lectures = section.lectures.filter((l) => l._id.toString() !== req.params.lectureId);
  res.json(await doc.save());
});

module.exports = {
  getPublicCourseDetail, getAdminCourseDetail, updateCourseDetailMeta,
  addWhatYouGet, updateWhatYouGet, deleteWhatYouGet,
  addRequirement, updateRequirement, deleteRequirement,
  addCDFAQ, updateCDFAQ, deleteCDFAQ,
  addCDReview, updateCDReview, deleteCDReview,
  addCDSection, updateCDSection, deleteCDSection,
  addCDLecture, updateCDLecture, deleteCDLecture,
};
