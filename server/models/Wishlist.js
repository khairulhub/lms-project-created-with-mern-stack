const mongoose = require("mongoose");

// Wishlist = student কোনো course কেনার আগে "পরে decide করব" বলে save করে রাখলো।
// Bookmark (lecture-level, enrolled course-এর ভেতরে) থেকে সম্পূর্ণ আলাদা জিনিস —
// এটা public course listing থেকে, enroll করার আগেই ব্যবহার হয়।
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
