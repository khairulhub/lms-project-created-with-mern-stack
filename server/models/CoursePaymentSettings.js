const mongoose = require("mongoose");

// Singleton doc — same pattern as CourseHeroSection/SiteConfig.
// Only one document ever exists; admin edits this single doc to control the
// "plan" side of the Course Payment section (price / bootcamp-fee card,
// active-vs-inactive switch, disclaimer text, button labels, etc).
const coursePaymentSettingsSchema = new mongoose.Schema(
  {
    // Controls which card layout the public page shows:
    // true  -> "Active" pricing card (price + old price + discount + buttons)
    // false -> "Inactive" bootcamp-fee card (fee + disclaimer + buttons)
    isActive: { type: Boolean, default: false },

    // ── Active-card fields ──────────────────────────────────────────────
    price: { type: String, default: "৪,৫০০" },
    oldPrice: { type: String, default: "১২,০০০" },
    discountText: { type: String, default: "৬৩% ছাড়" },

    // ── Inactive-card fields ────────────────────────────────────────────
    bootcampFeeLabel: { type: String, default: "বুটক্যাম্প ফি" },
    bootcampFee: { type: String, default: "৫,৫০০ টাকা" },
    disclaimerBadgeText: { type: String, default: "Disclaimer" },
    disclaimerLine1: { type: String, default: "৫৫০০ টাকায় ভর্তির এটাই শেষ সুযোগ," },
    disclaimerLine2: { type: String, default: "পরের ব্যাচ থেকে ভর্তি ফি বেড়ে যাবে।" },

    // ── Shared fields (both cards) ──────────────────────────────────────
    paymentButtonsLabel: { type: String, default: "পেমেন্ট করো:" },
    enrollButtonText: { type: String, default: "ভর্তি হও →" },
    enrollButtonLink: { type: String, default: "/enroll" },
    modalCloseButtonText: { type: String, default: "বুঝেছি" },
    modalStepsHeading: { type: String, default: "কীভাবে পেমেন্ট করবে:" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoursePaymentSettings", coursePaymentSettingsSchema);
