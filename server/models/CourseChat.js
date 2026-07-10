const mongoose = require("mongoose");

// Ekta attachment — image ba file (Cloudinary URL)
const attachmentSchema = new mongoose.Schema(
  {
    url:  { type: String, required: true },
    type: { type: String, enum: ["image", "file"], required: true },
    name: { type: String, default: "" },   // original filename
    size: { type: Number, default: 0 },    // bytes
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sender:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["student", "instructor", "admin"], required: true },
    text:       { type: String, default: "", trim: true },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

// Ekjon student ekta course kinle, sei course-er instructor (ba admin, jodi
// admin nijei course create kore thake) er sathe ekta e-thread thake.
// course + student mile unique — ekbar e create hoy, baki shomoy same thread e message jome.
const courseChatSchema = new mongoose.Schema(
  {
    course:  { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    messages: { type: [chatMessageSchema], default: [] },

    lastMessageAt:   { type: Date, default: Date.now },
    lastMessageText: { type: String, default: "" },
    lastMessageBy:   { type: String, enum: ["student", "instructor", "admin"], default: "student" },

    // Student vs Staff (instructor/admin) — dujon alada dik theke "dekhecho ki na" track kore
    lastSeenByStudent: { type: Date, default: Date.now },
    lastSeenByStaff:    { type: Date, default: null },
  },
  { timestamps: true }
);

courseChatSchema.index({ course: 1, student: 1 }, { unique: true });
courseChatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("CourseChat", courseChatSchema);
