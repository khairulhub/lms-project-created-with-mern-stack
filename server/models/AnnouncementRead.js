const mongoose = require("mongoose");

// Kon user kon announcement dekhe fellese, tar track rakhe (notification badge/unread count er jonno)
const announcementReadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    announcement: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementReadSchema.index({ user: 1, announcement: 1 }, { unique: true });

module.exports = mongoose.model("AnnouncementRead", announcementReadSchema);
