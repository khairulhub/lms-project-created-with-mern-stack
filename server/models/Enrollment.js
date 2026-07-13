const mongoose = require("mongoose");

// একটা enrollment মানে একজন student একটা course-এ ভর্তির জন্য apply করেছে।
// Admin approve করলে status "approved" হবে, তখন student dashboard-এ দেখাবে।
const enrollmentSchema = new mongoose.Schema(
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
    // যে payment method দিয়ে pay করেছে (bKash, Nagad, Rocket, Bank, etc.)
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    // Transaction ID — student নিজে submit করবে
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    // Screenshot URL — imgBB তে upload করে URL save হবে
    screenshotUrl: {
      type: String,
      default: "",
    },
    // Coupon যদি use করে থাকে
    couponCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    // Coupon discount amount (যদি থাকে)
    discountAmount: {
      type: Number,
      default: 0,
    },
    // Final amount যা student pay করেছে (coupon discounted price)
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    // pending → admin review করেনি
    // approved → admin approve করেছে, student access পাবে
    // rejected → admin reject করেছে
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
    },
    // Admin approved enrollment পরে revoke করলে (refund/policy violation ইত্যাদি)
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    revokeReason: { type: String, default: "" },
    // টাকা ফেরত দেওয়া হয়েছে কিনা — actual gateway refund admin manually করে
    // (bank/bKash/SSLCommerz panel থেকে), এখানে শুধু record রাখা হয়
    refundStatus: {
      type: String,
      enum: ["none", "refunded"],
      default: "none",
    },
    // Admin reject করলে কারণ জানাতে পারবে
    adminNote: {
      type: String,
      default: "",
    },
    // কখন admin approve/reject করেছে
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// একজন user একটা course-এ একবারই pending/approved থাকতে পারবে
// (rejected হলে আবার apply করতে পারবে, তাই শুধু pending+approved unique)
enrollmentSchema.index({ user: 1, course: 1 }, { unique: false });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
