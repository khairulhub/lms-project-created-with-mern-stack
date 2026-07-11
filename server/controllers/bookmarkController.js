const asyncHandler = require("express-async-handler");
const Bookmark = require("../models/Bookmark");

// ── Student: এই course-এ কোন কোন lecture bookmark করা আছে (Set হিসেবে) ────
// GET /api/bookmarks/course/:courseId
const getCourseBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id, course: req.params.courseId })
    .select("lectureId")
    .lean();
  res.json(bookmarks.map((b) => String(b.lectureId)));
});

// ── Student: bookmark toggle করা (না থাকলে add, থাকলে remove) ─────────────
// POST /api/bookmarks/toggle  { courseId, sectionId, lectureId, courseTitle, lectureTitle }
const toggleBookmark = asyncHandler(async (req, res) => {
  const { courseId, sectionId, lectureId, courseTitle, lectureTitle } = req.body;
  if (!courseId || !sectionId || !lectureId) {
    res.status(400);
    throw new Error("courseId, sectionId, lectureId লাগবে");
  }

  const existing = await Bookmark.findOne({ user: req.user._id, lectureId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ bookmarked: false });
  }

  await Bookmark.create({
    user: req.user._id,
    course: courseId,
    sectionId,
    lectureId,
    courseTitle: courseTitle || "",
    lectureTitle: lectureTitle || "",
  });
  res.json({ bookmarked: true });
});

// ── Student: নিজের সব bookmark (course অনুযায়ী group করে frontend দেখাবে) ──
// GET /api/bookmarks/my
const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate("course", "title thumbnail image emoji")
    .sort({ createdAt: -1 })
    .lean();
  res.json(bookmarks);
});

// ── Student: নির্দিষ্ট bookmark delete করা (list page থেকে remove বাটন) ────
// DELETE /api/bookmarks/:id
const deleteBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user._id });
  if (!bookmark) {
    res.status(404);
    throw new Error("Bookmark পাওয়া যায়নি");
  }
  await bookmark.deleteOne();
  res.json({ message: "Bookmark removed" });
});

module.exports = {
  getCourseBookmarks,
  toggleBookmark,
  getMyBookmarks,
  deleteBookmark,
};
