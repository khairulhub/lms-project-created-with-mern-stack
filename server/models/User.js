const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // null for Google/Firebase-only users
    firebaseUid: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["user", "instructor", "admin"],
      default: "user",
    },
    profileImage: { type: String, default: "" },
    designation: { type: String, default: "" },
    bio: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
