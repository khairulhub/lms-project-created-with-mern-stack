const mongoose = require("mongoose");

// Announcement — admin ba instructor kortey pare.
// scope: "global"  -> shob student/instructor er jonno (course specific na)
// scope: "course"  -> nirdishto akta course er shathe bound (course field required)
// audience: kader dekhabe -> students | instructors | both
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    scope: {
      type: String,
      enum: ["global", "course"],
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null, // scope === "course" hole required (validated in controller)
    },

    audience: {
      type: String,
      enum: ["students", "instructors", "both"],
      default: "students",
    },

    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },

    // Optional — kono specific date/time reference thakle (e.g. "module publish হবে ১০ জুলাই রাত ৮টায়")
    eventDate: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "instructor"],
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

announcementSchema.index({ scope: 1, course: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
