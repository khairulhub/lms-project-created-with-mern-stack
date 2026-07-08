const mongoose = require("mongoose");

// Live conceptual/doubt-clearing session — Zoom ba Google Meet link soho.
// scope: "global" -> kono course er shathe bound na, shob student er jonno (admin-only)
// scope: "course" -> nirdishto course er student der jonno (admin ba instructor banate pare)
const conceptualSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    scope: {
      type: String,
      enum: ["global", "course"],
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null, // scope === "course" hole required (controller e validate hoy)
    },

    platform: {
      type: String,
      enum: ["zoom", "google_meet"],
      required: true,
    },
    meetingLink: { type: String, required: true, trim: true },
    meetingId: { type: String, default: "", trim: true },
    passcode: { type: String, default: "", trim: true },

    startTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 10 },

    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "instructor"],
      required: true,
    },
  },
  { timestamps: true }
);

conceptualSessionSchema.index({ scope: 1, course: 1, startTime: 1 });

module.exports = mongoose.model("ConceptualSession", conceptualSessionSchema);
