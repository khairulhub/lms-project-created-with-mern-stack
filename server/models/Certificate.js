const mongoose = require("mongoose");
const crypto = require("crypto");

// একজন student একটা course সম্পূর্ণ শেষ করলে certificate issue হয়। প্রতিটা
// certificate-এর একটা unique, human-shareable code থাকে (certificateId) —
// সেই code দিয়ে যেকেউ (employer, ইত্যাদি) public verify page-এ গিয়ে
// authenticity যাচাই করতে পারবে, কোনো login ছাড়াই।
//
// একজন student একটা course-এ একবারই certificate পাবে — দ্বিতীয়বার request
// করলে নতুন doc না বানিয়ে আগেরটাই re-issue (re-download) করা হবে, যাতে
// certificate-এর ID আর তারিখ স্থিতিশীল থাকে (re-generate করলেও বদলায় না)।
const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
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
    // Issue-এর সময়কার নাম/কোর্সের শিরোনাম snapshot করে রাখা হয় — পরে student
    // নাম পরিবর্তন করলে বা admin course title এডিট করলেও পুরোনো certificate-এর
    // লেখা অপরিবর্তিত থাকবে (একটা certificate চিরকাল যা ছিল তাই থাকা উচিত)।
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

// CERT-XXXXXXXX-XXXXXXXX ফরম্যাটে readable কিন্তু guess করা কঠিন এমন একটা
// কোড বানায় — public verify URL-এ ব্যবহারের জন্য।
certificateSchema.statics.generateCertificateId = function () {
  const part = () => crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CERT-${part()}-${part()}`;
};

module.exports = mongoose.model("Certificate", certificateSchema);
