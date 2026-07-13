const mongoose = require("mongoose");

// Course Chat (আগে থেকে আছে) private 1:1 (student ↔ instructor/admin)।
// এটা তার থেকে আলাদা — public/course-wide Q&A, প্রতিটা lecture-এর নিচে,
// যেকোনো enrolled student একে অপরের প্রশ্নের উত্তর দিতে পারে (peer learning)।
const replySchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "instructor", "admin"], required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const lectureDiscussionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lectureTitle: { type: String, default: "" }, // snapshot, curriculum edit hole o list bhange na

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // question jini korlen
    question: { type: String, required: true, trim: true },
    replies: [replySchema],
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lectureDiscussionSchema.index({ course: 1, lectureId: 1, createdAt: -1 });

module.exports = mongoose.model("LectureDiscussion", lectureDiscussionSchema);
