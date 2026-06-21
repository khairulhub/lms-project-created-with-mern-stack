const mongoose = require("mongoose");

const navMenuSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "Courses"
    path: { type: String, required: true, trim: true },  // e.g. "/courses"
    order: { type: Number, default: 0 },                 // display order
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },        // seed items = true, can't delete
    openInNewTab: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NavMenu", navMenuSchema);
