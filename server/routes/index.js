const express = require("express");
const router = express.Router();
const { protect, adminOnly, instructorOnly, verifyFirebaseToken } = require("../middleware/authMiddleware");
const { firebaseSync, getMe } = require("../controllers/authController");
const { getProfile, updateProfile, requestInstructor, getMyRequest } = require("../controllers/userController");
const {
  getAllUsers, updateUserRole, toggleUserStatus,
  getInstructorRequests, reviewInstructorRequest,
  createInstructor, deleteUser,
} = require("../controllers/adminController");
const { getCategories, getAllCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { getPublishedBlogs, getBlogBySlug, getAllBlogs, createBlog, updateBlog, deleteBlog } = require("../controllers/blogController");

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post("/auth/firebase-sync", verifyFirebaseToken, firebaseSync);
router.get("/auth/me", protect, getMe);

// ─── USER (own profile + instructor request) ─────────────────────────────────
router.get("/users/profile", protect, getProfile);
router.put("/users/profile", protect, updateProfile);
router.post("/users/request-instructor", protect, requestInstructor);
router.get("/users/my-request", protect, getMyRequest);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
router.get("/admin/users", protect, adminOnly, getAllUsers);
router.put("/admin/users/:id/role", protect, adminOnly, updateUserRole);
router.put("/admin/users/:id/toggle", protect, adminOnly, toggleUserStatus);
router.delete("/admin/users/:id", protect, adminOnly, deleteUser);
router.post("/admin/create-instructor", protect, adminOnly, createInstructor);
router.get("/admin/instructor-requests", protect, adminOnly, getInstructorRequests);
router.put("/admin/instructor-requests/:id", protect, adminOnly, reviewInstructorRequest);

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
router.get("/categories", getCategories);                                    // public
router.get("/admin/categories", protect, adminOnly, getAllCategories);        // admin
router.post("/admin/categories", protect, adminOnly, createCategory);
router.put("/admin/categories/:id", protect, adminOnly, updateCategory);
router.delete("/admin/categories/:id", protect, adminOnly, deleteCategory);

// ─── BLOGS ───────────────────────────────────────────────────────────────────
router.get("/blogs", getPublishedBlogs);                                      // public
router.get("/blogs/:slug", getBlogBySlug);                                    // public
router.get("/admin/blogs", protect, instructorOnly, getAllBlogs);             // admin + instructor
router.post("/admin/blogs", protect, instructorOnly, createBlog);
router.put("/admin/blogs/:id", protect, instructorOnly, updateBlog);
router.delete("/admin/blogs/:id", protect, instructorOnly, deleteBlog);

module.exports = router;
