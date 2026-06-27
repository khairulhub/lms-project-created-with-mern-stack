const asyncHandler = require("express-async-handler");
const CourseDetail = require("../models/CourseDetail");
const Course       = require("../models/Course");

// ── Helper: find-or-init ───────────────────────────────────────────────────
const findOrInit = async (courseId) => {
  let doc = await CourseDetail.findOne({ course: courseId });
  if (!doc) {
    doc = await CourseDetail.create({ course: courseId });
  }
  return doc;
};

// ── PUBLIC ─────────────────────────────────────────────────────────────────

// GET /api/course-details/:courseId
const getPublicCourseDetail = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.isActive)
    return res.status(404).json({ message: "Course not found" });

  const detail = await CourseDetail.findOne({ course: req.params.courseId });
  if (!detail) return res.json(null);

  // Filter inactive sub-items
  const safe = detail.toObject();
  safe.whatYouGet   = safe.whatYouGet.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.requirements = safe.requirements.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.faqs         = safe.faqs.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.reviews      = safe.reviews.filter((i) => i.isActive).sort((a,b)=>a.order-b.order);
  safe.curriculum   = safe.curriculum
    .filter((s) => s.isActive)
    .sort((a,b)=>a.order-b.order)
    .map((s) => ({
      ...s,
      lectures: s.lectures.filter((l) => l.isActive).sort((a,b)=>a.order-b.order),
    }));

  res.json(safe);
});

// ── ADMIN ──────────────────────────────────────────────────────────────────

// GET /api/admin/course-details/:courseId
const getAdminCourseDetail = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  res.json(doc);
});

// PUT /api/admin/course-details/:courseId  (top-level fields only: intro video etc.)
const updateCourseDetailMeta = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  const { introVideoUrl, introVideoType } = req.body;
  if (introVideoUrl  !== undefined) doc.introVideoUrl  = introVideoUrl;
  if (introVideoType !== undefined) doc.introVideoType = introVideoType;
  await doc.save();
  res.json(doc);
});

// ── whatYouGet CRUD ────────────────────────────────────────────────────────

// POST /api/admin/course-details/:courseId/what-you-get
const addWhatYouGet = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  const { text, order } = req.body;
  if (!text) return res.status(400).json({ message: "Text required" });
  doc.whatYouGet.push({ text, order: order ?? doc.whatYouGet.length, isActive: true });
  await doc.save();
  res.json(doc);
});

// PUT /api/admin/course-details/:courseId/what-you-get/:itemId
const updateWhatYouGet = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  const item = doc.whatYouGet.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });
  const { text, order, isActive } = req.body;
  if (text     !== undefined) item.text     = text;
  if (order    !== undefined) item.order    = order;
  if (isActive !== undefined) item.isActive = isActive;
  await doc.save();
  res.json(doc);
});

// DELETE /api/admin/course-details/:courseId/what-you-get/:itemId
const deleteWhatYouGet = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  doc.whatYouGet = doc.whatYouGet.filter((i) => i._id.toString() !== req.params.itemId);
  await doc.save();
  res.json(doc);
});

// ── requirements CRUD ──────────────────────────────────────────────────────

const addRequirement = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  const { text, order } = req.body;
  if (!text) return res.status(400).json({ message: "Text required" });
  doc.requirements.push({ text, order: order ?? doc.requirements.length, isActive: true });
  await doc.save();
  res.json(doc);
});

const updateRequirement = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  const item = doc.requirements.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });
  const { text, order, isActive } = req.body;
  if (text     !== undefined) item.text     = text;
  if (order    !== undefined) item.order    = order;
  if (isActive !== undefined) item.isActive = isActive;
  await doc.save();
  res.json(doc);
});

const deleteRequirement = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  doc.requirements = doc.requirements.filter((i) => i._id.toString() !== req.params.itemId);
  await doc.save();
  res.json(doc);
});

// ── FAQs CRUD ──────────────────────────────────────────────────────────────

const addFAQ = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  const { question, answer, order } = req.body;
  if (!question || !answer) return res.status(400).json({ message: "Question & answer required" });
  doc.faqs.push({ question, answer, order: order ?? doc.faqs.length, isActive: true });
  await doc.save();
  res.json(doc);
});

const updateFAQ = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  const item = doc.faqs.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "FAQ not found" });
  const { question, answer, order, isActive } = req.body;
  if (question !== undefined) item.question = question;
  if (answer   !== undefined) item.answer   = answer;
  if (order    !== undefined) item.order    = order;
  if (isActive !== undefined) item.isActive = isActive;
  await doc.save();
  res.json(doc);
});

const deleteFAQ = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  doc.faqs  = doc.faqs.filter((i) => i._id.toString() !== req.params.itemId);
  await doc.save();
  res.json(doc);
});

// ── Reviews CRUD ───────────────────────────────────────────────────────────

const addReview = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  const { name, role, avatarSeed, rating, text, order } = req.body;
  if (!name || !text) return res.status(400).json({ message: "Name & text required" });
  doc.reviews.push({ name, role: role||"", avatarSeed: avatarSeed||"", rating: rating||5, text, order: order ?? doc.reviews.length, isActive: true });
  await doc.save();
  res.json(doc);
});

const updateReview = asyncHandler(async (req, res) => {
  const doc  = await findOrInit(req.params.courseId);
  const item = doc.reviews.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Review not found" });
  ["name","role","avatarSeed","rating","text","order","isActive"].forEach((f) => {
    if (req.body[f] !== undefined) item[f] = req.body[f];
  });
  await doc.save();
  res.json(doc);
});

const deleteReview = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  doc.reviews = doc.reviews.filter((i) => i._id.toString() !== req.params.itemId);
  await doc.save();
  res.json(doc);
});

// ── Curriculum Sections CRUD ───────────────────────────────────────────────

const addCurriculumSection = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  const { title, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });
  doc.curriculum.push({ title, order: order ?? doc.curriculum.length, isActive: true, lectures: [] });
  await doc.save();
  res.json(doc);
});

const updateCurriculumSection = asyncHandler(async (req, res) => {
  const doc     = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  const { title, order, isActive } = req.body;
  if (title    !== undefined) section.title    = title;
  if (order    !== undefined) section.order    = order;
  if (isActive !== undefined) section.isActive = isActive;
  await doc.save();
  res.json(doc);
});

const deleteCurriculumSection = asyncHandler(async (req, res) => {
  const doc = await findOrInit(req.params.courseId);
  doc.curriculum = doc.curriculum.filter((s) => s._id.toString() !== req.params.sectionId);
  await doc.save();
  res.json(doc);
});

// ── Lectures CRUD ──────────────────────────────────────────────────────────

const addLecture = asyncHandler(async (req, res) => {
  const doc     = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  const { title, duration, videoUrl, preview, order } = req.body;
  if (!title) return res.status(400).json({ message: "Title required" });
  section.lectures.push({
    title, duration: duration||"", videoUrl: videoUrl||"",
    preview: preview||false, order: order ?? section.lectures.length, isActive: true,
  });
  await doc.save();
  res.json(doc);
});

const updateLecture = asyncHandler(async (req, res) => {
  const doc     = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  const lecture = section.lectures.id(req.params.lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });
  ["title","duration","videoUrl","preview","order","isActive"].forEach((f) => {
    if (req.body[f] !== undefined) lecture[f] = req.body[f];
  });
  await doc.save();
  res.json(doc);
});

const deleteLecture = asyncHandler(async (req, res) => {
  const doc     = await findOrInit(req.params.courseId);
  const section = doc.curriculum.id(req.params.sectionId);
  if (!section) return res.status(404).json({ message: "Section not found" });
  section.lectures = section.lectures.filter((l) => l._id.toString() !== req.params.lectureId);
  await doc.save();
  res.json(doc);
});

module.exports = {
  getPublicCourseDetail,
  getAdminCourseDetail,
  updateCourseDetailMeta,
  // whatYouGet
  addWhatYouGet, updateWhatYouGet, deleteWhatYouGet,
  // requirements
  addRequirement, updateRequirement, deleteRequirement,
  // faqs
  addFAQ, updateFAQ, deleteFAQ,
  // reviews
  addReview, updateReview, deleteReview,
  // curriculum sections
  addCurriculumSection, updateCurriculumSection, deleteCurriculumSection,
  // lectures
  addLecture, updateLecture, deleteLecture,
};
