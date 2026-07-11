const asyncHandler = require("express-async-handler");
const Wishlist = require("../models/Wishlist");

// GET /api/wishlist/my — student এর সব wishlisted course (populated)
const getMyWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate({
      path: "course",
      select: "title description image emoji price originalPrice rating students hours badge tags isActive approvalStatus",
      populate: { path: "category", select: "name slug" },
    })
    .sort({ createdAt: -1 })
    .lean();
  res.json(items.filter((i) => i.course)); // deleted course হলে বাদ
});

// GET /api/wishlist/ids — শুধু course id গুলোর array (course card এ heart-fill state বসাতে দ্রুত)
const getMyWishlistIds = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id }).select("course").lean();
  res.json(items.map((i) => String(i.course)));
});

// POST /api/wishlist/toggle { courseId }
const toggleWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    res.status(400);
    throw new Error("courseId লাগবে");
  }
  const existing = await Wishlist.findOne({ user: req.user._id, course: courseId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ wishlisted: false });
  }
  await Wishlist.create({ user: req.user._id, course: courseId });
  res.json({ wishlisted: true });
});

module.exports = { getMyWishlist, getMyWishlistIds, toggleWishlist };
