const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const admin = require("../config/firebase");

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/firebase-sync
// Called after Firebase login/signup — syncs Firebase user to MongoDB, issues our JWT
const firebaseSync = asyncHandler(async (req, res) => {
  const { firebaseUser } = req; // set by verifyFirebaseToken middleware
  const { name, photoURL } = req.body; // optional extras from client

  let user = await User.findOne({ firebaseUid: firebaseUser.uid });

  if (!user) {
    // Also check by email (edge case: user registered with email/pass before Google)
    user = await User.findOne({ email: firebaseUser.email });
    if (user) {
      user.firebaseUid = firebaseUser.uid;
      await user.save();
    } else {
      // New user — create with "user" role
      user = await User.create({
        name: name || firebaseUser.name || firebaseUser.email.split("@")[0],
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        profileImage: photoURL || firebaseUser.picture || "",
        role: "user",
      });
    }
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account deactivated" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    token: generateToken(user._id),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { firebaseSync, getMe };
