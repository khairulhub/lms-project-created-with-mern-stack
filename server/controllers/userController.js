const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const InstructorRequest = require("../models/InstructorRequest");

// GET /api/users/profile — get own profile
const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile — update own profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, designation, bio, phone, profileImage } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (designation !== undefined) user.designation = designation;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (profileImage !== undefined) user.profileImage = profileImage;

  const updated = await user.save();
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    profileImage: updated.profileImage,
    designation: updated.designation,
    bio: updated.bio,
    phone: updated.phone,
  });
});

// POST /api/users/request-instructor — user requests to become instructor
const requestInstructor = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (req.user.role !== "user") {
    return res
      .status(400)
      .json({ message: "Only regular users can request instructor role" });
  }

  const existing = await InstructorRequest.findOne({
    user: req.user._id,
    status: "pending",
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "You already have a pending request" });
  }

  const request = await InstructorRequest.create({
    user: req.user._id,
    reason: reason || "",
  });

  res.status(201).json({ message: "Request submitted", request });
});

// GET /api/users/my-request — check own instructor request status
const getMyRequest = asyncHandler(async (req, res) => {
  const request = await InstructorRequest.findOne({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate("reviewedBy", "name email");
  res.json(request || null);
});

module.exports = { getProfile, updateProfile, requestInstructor, getMyRequest };
