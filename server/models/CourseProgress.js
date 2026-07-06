const mongoose = require("mongoose");

// একজন student একটা course-এ কোন কোন lecture complete করেছে, আর সবচেয়ে
// শেষে কোন lecture দেখছিল — সেটা track করার জন্য। এক (user, course) pair-এর
// জন্য একটাই doc থাকবে, তাই refresh দিলে বা অন্য device থেকে login করলেও
// progress একই থাকবে।
//
// lectureId গুলো CourseDetail.curriculum[].lectures[]._id কে reference করে।
// সরাসরি ref না দিয়ে raw ObjectId রাখা হয়েছে, কারণ lecture একটা subdocument,
// আলাদা collection না — populate করার দরকার নেই, শুধু membership check (Set/includes)।
const courseProgressSchema = new mongoose.Schema(
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
    // সব completed lecture-এর _id (CourseDetail.curriculum[].lectures[]._id)
    completedLectures: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    // সবচেয়ে শেষে যে lecture-টা active ছিল — refresh/device change এর পর
    // student সেখান থেকেই resume করবে
    lastWatchedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// এক student + এক course = একটাই progress doc
courseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
