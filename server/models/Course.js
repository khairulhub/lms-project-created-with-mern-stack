const mongoose = require("mongoose");

// A Course belongs to one Category.
// displayStyle is per-course (list vs grid) — toggled from admin.
const courseSchema = new mongoose.Schema(
  {
    category:      { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    emoji:         { type: String, default: "🚀" },
    image:         { type: String, default: "" },             // imgBB URL — when set, shown instead of emoji
    badge:         { type: String, default: "HOT" },          // e.g. HOT, NEW, POPULAR
    tags:          [{ type: String }],                         // e.g. ["Bestseller","Full Stack"]
    title:         { type: String, required: true, trim: true },
    description:   { type: String, default: "" },
    rating:        { type: Number, default: 4.8 },
    students:      { type: String, default: "0" },            // "32,500"
    hours:         { type: String, default: "0" },            // "60+"
    price:         { type: Number, default: 0 },              // 4500
    originalPrice: { type: Number, default: 0 },              // 12000
    displayStyle:  { type: String, enum: ["list", "grid"], default: "list" },
    isActive:      { type: Boolean, default: true },
    order:         { type: Number, default: 0 },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseSchema.index({ category: 1, isActive: 1, order: 1 });

module.exports = mongoose.model("Course", courseSchema);
