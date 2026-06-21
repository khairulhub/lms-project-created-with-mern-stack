const mongoose = require("mongoose");

// Singleton doc — same pattern as SiteConfig.
// Only one document ever exists; admin edits this single doc (no add/delete of new docs).
const statItemSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, trim: true }, // e.g. "৩০০০+"
    label: { type: String, required: true, trim: true }, // e.g. "শিক্ষার্থী"
  },
  { _id: false }
);

const courseHeroSectionSchema = new mongoose.Schema(
  {
    badgeText: { type: String, default: "পূর্ণ বাংলায় শিখো এবং তোমার ক্যারিয়ার গড়ো Full Stack Web Engineer হিসেবে" },
    // Single rich-text field for the whole heading. Admin selects any part of
    // the text in the editor and clicks "Apply Gradient" to wrap it in
    // <span class="gradient-text">...</span> — so gradient can be applied to
    // any word(s), not just a fixed first/last split.
    headingHtml: {
      type: String,
      default: '<span class="gradient-text">AI-Driven</span> Web Development Course',
    },
    description: {
      type: String,
      default: "HTML, CSS, JavaScript, React, Node.js, MongoDB সহ সম্পূর্ণ Full Stack Web Development শেখো। প্রজেক্ট বানাও, পোর্টফোলিও তৈরি করো এবং ক্যারিয়ার শুরু করো।",
    },
    stats: { type: [statItemSchema], default: [
      { value: "৩০০০+", label: "শিক্ষার্থী" },
      { value: "৪.৮★", label: "রেটিং" },
      { value: "৬০+", label: "ঘণ্টার কন্টেন্ট" },
      { value: "৫০০+", label: "জব প্লেসমেন্ট" },
    ]},
    primaryButtonText: { type: String, default: "এখনই ভর্তি হও" },
    primaryButtonLink: { type: String, default: "/enroll" },
    secondaryButtonText: { type: String, default: "Demo দেখো" },
    secondaryButtonLink: { type: String, default: "" }, // e.g. YouTube demo URL — opens in new tab
    guaranteeText: { type: String, default: "✅ ৩০ দিনের মানি-ব্যাক গ্যারান্টি \u00a0·\u00a0 ✅ লাইফটাইম অ্যাক্সেস" },

    showInstructorCard: { type: Boolean, default: true },
    instructorImage: { type: String, default: "" }, // imgBB URL; empty = emoji/gradient fallback
    instructorName: { type: String, default: "Jhankar Mahbub" },
    instructorTitle: { type: String, default: "Lead Instructor" },
    instructorSubtitle: { type: String, default: "Ex-Google Engineer" },
    bestsellerBadgeText: { type: String, default: "🔥 BESTSELLER" },
    jobSupportBadgeText: { type: String, default: "✅ Job Support" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseHeroSection", courseHeroSectionSchema);
