const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["flat", "percent"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTill: {
      type: Date,
      default: null,
    },
    // null = applicable to ALL courses
    // array of course IDs = specific courses only
    applicableTo: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
      default: [],
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Uppercase code before saving
couponSchema.pre("save", function (next) {
  this.code = this.code.toUpperCase().trim();
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
