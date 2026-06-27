const mongoose = require("mongoose");

// ── Sub-schemas ────────────────────────────────────────────────────────────

// "এই কোর্সে যা পাবে" — each bullet point
const whatYouGetItemSchema = new mongoose.Schema({
  text:    { type: String, required: true, trim: true },
  order:   { type: Number, default: 0 },
  isActive:{ type: Boolean, default: true },
}, { _id: true });

// Requirement item
const requirementItemSchema = new mongoose.Schema({
  text:    { type: String, required: true, trim: true },
  order:   { type: Number, default: 0 },
  isActive:{ type: Boolean, default: true },
}, { _id: true });

// Sub-lecture inside a curriculum section
const lectureSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  duration: { type: String, default: "" },          // "14:25"
  videoUrl: { type: String, default: "" },          // YouTube embed or raw mp4
  preview:  { type: Boolean, default: false },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: true });

// Curriculum section (accordion)
const curriculumSectionSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lectures: [lectureSchema],
}, { _id: true });

// FAQ item
const faqItemSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer:   { type: String, required: true, trim: true },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: true });

// Review item
const reviewItemSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  role:       { type: String, default: "" },
  avatarSeed: { type: String, default: "" },
  rating:     { type: Number, default: 5, min: 1, max: 5 },
  text:       { type: String, required: true },
  order:      { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
}, { _id: true });

// ── Main Schema ────────────────────────────────────────────────────────────

const courseDetailSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Course",
      required: true,
      unique: true,       // one CourseDetail doc per Course
    },

    // Intro / preview video
    introVideoUrl:  { type: String, default: "" },     // YouTube embed or mp4
    introVideoType: { type: String, enum: ["youtube", "raw"], default: "youtube" },

    // এই কোর্সে যা পাবে
    whatYouGet: [whatYouGetItemSchema],

    // প্রয়োজনীয়তা
    requirements: [requirementItemSchema],

    // কোর্স কারিকুলাম
    curriculum: [curriculumSectionSchema],

    // সচরাচর জিজ্ঞাসা
    faqs: [faqItemSchema],

    // Reviews
    reviews: [reviewItemSchema],

    // misc
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseDetail", courseDetailSchema);
