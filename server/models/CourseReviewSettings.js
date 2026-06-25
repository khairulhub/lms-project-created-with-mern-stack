const mongoose = require("mongoose");

// Singleton settings for the Reviews section.
// displayStyle: "grid-slider"  → heading+stars top, 3-card auto-slider below (design 1)
//               "side-slider"  → heading+stars LEFT, 1-card auto-slider RIGHT (design 2)
const courseReviewSettingsSchema = new mongoose.Schema(
  {
    heading:       { type: String,  default: "শিক্ষার্থীরা কী বলছে?" },
    avgRating:     { type: Number,  default: 4.8 },
    totalReviews:  { type: String,  default: "১২,৪৮০" },
    displayStyle:  { type: String,  enum: ["grid-slider", "side-slider"], default: "grid-slider" },
    autoSlideMs:   { type: Number,  default: 3000 },  // auto-slide interval in ms
    // rating bar breakdown
    ratingBars: {
      type: [{ star: Number, pct: Number }],
      default: [
        { star: 5, pct: 78 },
        { star: 4, pct: 15 },
        { star: 3, pct: 5  },
        { star: 2, pct: 1  },
        { star: 1, pct: 1  },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseReviewSettings", courseReviewSettingsSchema);
