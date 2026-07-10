const mongoose = require("mongoose");

// Ekta reply — student, admin, ba instructor je keu dite pare thread-e
const replySchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "admin", "instructor"], required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Student support ticket — ekta subject/category niye khule, thread-e reply cholte thake,
// admin status change kore (open -> in_progress -> resolved -> closed)
const helpdeskTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true }, // original/first message

    category: {
      type: String,
      enum: ["technical", "billing", "course", "account", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },

    replies: { type: [replySchema], default: [] },

    // Kon role shesh reply dilo, ar kobe — dujon side er unread badge count korar jonno
    lastReplyBy: { type: String, enum: ["user", "admin", "instructor"], default: "user" },
    lastReplyAt: { type: Date, default: Date.now },

    // Student ba admin shesh kobe thread-ta dekhlo — eta diye "notun reply ache" bujha jay
    lastSeenByUser: { type: Date, default: Date.now },
    lastSeenByAdmin: { type: Date, default: null },
  },
  { timestamps: true }
);

helpdeskTicketSchema.index({ user: 1, createdAt: -1 });
helpdeskTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("HelpdeskTicket", helpdeskTicketSchema);
