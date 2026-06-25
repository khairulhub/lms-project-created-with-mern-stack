const mongoose = require("mongoose");

const courseFAQSettingsSchema = new mongoose.Schema(
  {
    heading:  { type: String, default: "সচরাচর জিজ্ঞাসা" },
    subtitle: { type: String, default: "তোমার মনে যা আসছে সেই প্রশ্নের উত্তর এখানে আছে" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseFAQSettings", courseFAQSettingsSchema);
