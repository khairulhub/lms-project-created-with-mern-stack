const mongoose = require("mongoose");

// CTA Section singleton.
// primaryBtnText  — "এখনই ভর্তি হও — ৳৪,৫০০"  (login → /categories)
// secondaryBtnText — "Free Demo দেখো"            (login → /categories)
// trust badges editable as array of strings
const courseCTASettingsSchema = new mongoose.Schema(
  {
    heading:           { type: String, default: "আজই শুরু করো তোমার ক্যারিয়ার জার্নি 🚀" },
    subtitle:          { type: String, default: "হাজারো শিক্ষার্থী ইতিমধ্যে শুরু করে ফেলেছে। তুমি কি পিছিয়ে থাকবে? আজই ভর্তি হও এবং ৩০ দিনের মানি-ব্যাক গ্যারান্টি উপভোগ করো।" },
    primaryBtnText:    { type: String, default: "এখনই ভর্তি হও — ৳৪,৫০০" },
    secondaryBtnText:  { type: String, default: "Free Demo দেখো" },
    trustBadges:       { type: [String], default: ["✅ ৩০ দিনের মানি-ব্যাক", "✅ লাইফটাইম অ্যাক্সেস", "✅ Certificate", "✅ Community Support"] },
    gradientFrom:      { type: String, default: "#3b0764" },
    gradientVia:       { type: String, default: "#1a0533" },
    gradientTo:        { type: String, default: "#500724" },
    isActive:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseCTASettings", courseCTASettingsSchema);
