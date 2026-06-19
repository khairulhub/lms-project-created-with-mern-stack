const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const InstructorRequest = require("../models/InstructorRequest");
const admin = require("../config/firebase");

// GET /api/admin/users — all users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

// PUT /api/admin/users/:id/role — change user role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "instructor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// PUT /api/admin/users/:id/toggle — activate/deactivate user
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? "activated" : "deactivated"}`, isActive: user.isActive });
});

// GET /api/admin/instructor-requests — all pending requests
const getInstructorRequests = asyncHandler(async (req, res) => {
  const requests = await InstructorRequest.find({})
    .populate("user", "name email profileImage designation")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });
  res.json(requests);
});

// PUT /api/admin/instructor-requests/:id — approve or reject
const reviewInstructorRequest = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body; // action: "approve" | "reject"
  const request = await InstructorRequest.findById(req.params.id).populate("user");

  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "pending") {
    return res.status(400).json({ message: "Request already reviewed" });
  }

  if (action === "approve") {
    request.status = "approved";
    await User.findByIdAndUpdate(request.user._id, { role: "instructor" });
  } else if (action === "reject") {
    request.status = "rejected";
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  request.adminNote = adminNote || "";
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  res.json({ message: `Request ${request.status}`, request });
});

// POST /api/admin/create-instructor — admin creates instructor directly with email+pass
const createInstructor = asyncHandler(async (req, res) => {
  const { name, email, password, designation } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password required" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  // Create user in Firebase Auth too so they can log in via Firebase
  let firebaseUid = null;
  try {
    const fbUser = await admin.auth().createUser({ email, password, displayName: name });
    firebaseUid = fbUser.uid;
  } catch (err) {
    // Firebase create failed — still create in DB (they can use email/pass flow)
    console.warn("Firebase user creation failed:", err.message);
  }

  const user = await User.create({
    name,
    email,
    firebaseUid,
    designation: designation || "",
    role: "instructor",
    isActive: true,
  });

  res.status(201).json({
    message: "Instructor created successfully",
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
});

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getInstructorRequests,
  reviewInstructorRequest,
  createInstructor,
  deleteUser,
};
