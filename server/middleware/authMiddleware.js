const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const User = require("../models/User");

// Verify our own JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Role guards
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const instructorOnly = (req, res, next) => {
  if (!["admin", "instructor"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Instructor access required" });
  }
  next();
};

// Verify Firebase ID token (used when syncing Firebase login to our DB)
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No Firebase token" });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
};

module.exports = { protect, adminOnly, instructorOnly, verifyFirebaseToken };
