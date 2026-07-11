const mongoose = require("mongoose");

// একজন student একটা lecture "save for later" করলে এখানে একটা row হবে।
// lectureId/sectionId রা CourseDetail.curriculum[].lectures[]._id কে reference
// করে (raw ObjectId, subdocument বলে আলাদা collection না — populate লাগে না)।
// title গুলো snapshot করে রাখা হয় যাতে পরে course/lecture edit বা delete হলেও
// bookmark list ভাঙে না (list এ পুরনো নাম-ই দেখাবে, শুধু click করলে হয়তো
// lecture আর নাই এমন হতে পারে — সেটা frontend এ handle করা হয়)।
const bookmarkSchema = new mongoose.Schema(
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
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    courseTitle: { type: String, default: "" },
    lectureTitle: { type: String, default: "" },
  },
  { timestamps: true }
);

// এক student একটা lecture একবারই bookmark করতে পারবে
bookmarkSchema.index({ user: 1, lectureId: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
