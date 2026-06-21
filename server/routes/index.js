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
const { sendOTP, verifyOTP } = require("../controllers/otpController");
const {
  getMenus, getAllMenus, createMenu, updateMenu, reorderMenus, deleteMenu,
  getSiteConfig, updateSiteConfig,
} = require("../controllers/navController");
const { getCourseHero, updateCourseHero } = require("../controllers/courseHeroController");
const {
  getPaymentSettings, updatePaymentSettings,
  getPaymentMethods, getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
} = require("../controllers/coursePaymentController");
const {
  getCourseHighlights, getAdminCourseHighlights, updateCourseHighlightSection,
  createCourseHighlightItem, updateCourseHighlightItem, deleteCourseHighlightItem,
} = require("../controllers/courseHighlightsController");

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

// ─── OTP ─────────────────────────────────────────────────────────────────────
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);

// ─── NAV MENU (public) ───────────────────────────────────────────────────────
router.get("/nav/menus", getMenus);
router.get("/nav/config", getSiteConfig);

// ─── NAV MENU (admin) ────────────────────────────────────────────────────────
router.get("/admin/nav/menus", protect, adminOnly, getAllMenus);
router.post("/admin/nav/menus", protect, adminOnly, createMenu);
router.put("/admin/nav/menus/reorder", protect, adminOnly, reorderMenus);
router.put("/admin/nav/menus/:id", protect, adminOnly, updateMenu);
router.delete("/admin/nav/menus/:id", protect, adminOnly, deleteMenu);
router.put("/admin/nav/config", protect, adminOnly, updateSiteConfig);

// ─── COURSE DETAILS → HERO SECTION (singleton, admin-editable) ───────────────
router.get("/course-hero", getCourseHero);                                    // public
router.put("/admin/course-hero", protect, adminOnly, updateCourseHero);       // admin

// ─── COURSE DETAILS → PAYMENT SECTION ─────────────────────────────────────────
// Settings = singleton (active/inactive switch, price, disclaimer text, etc.)
router.get("/course-payment/settings", getPaymentSettings);                                  // public
router.put("/admin/course-payment/settings", protect, adminOnly, updatePaymentSettings);     // admin

// Payment methods = full CRUD collection (bKash/Nagad/Rocket/Visa/Bank/custom),
// each with its own ordered steps[] that admin can freely add to / edit / remove.
router.get("/course-payment/methods", getPaymentMethods);                                            // public (active only)
router.get("/admin/course-payment/methods", protect, adminOnly, getAllPaymentMethods);               // admin (all)
router.post("/admin/course-payment/methods", protect, adminOnly, createPaymentMethod);
router.put("/admin/course-payment/methods/:id", protect, adminOnly, updatePaymentMethod);
router.delete("/admin/course-payment/methods/:id", protect, adminOnly, deletePaymentMethod);

// ─── COURSE DETAILS → HIGHLIGHTS SECTION (per-category, admin-editable) ──────
// Public: fetch by category slug (or id) — returns { category, section, items }
router.get("/course-highlights/:categorySlug", getCourseHighlights);

// Admin: fetch everything (incl. inactive items) for a category
router.get("/admin/course-highlights/:categoryId", protect, adminOnly, getAdminCourseHighlights);
// Admin: update that category's section heading/subtitle/tech-tags
router.put("/admin/course-highlights/:categoryId/section", protect, adminOnly, updateCourseHighlightSection);
// Admin: full CRUD on individual highlight cards within a category
router.post("/admin/course-highlights/:categoryId/items", protect, adminOnly, createCourseHighlightItem);
router.put("/admin/course-highlights/items/:id", protect, adminOnly, updateCourseHighlightItem);
router.delete("/admin/course-highlights/items/:id", protect, adminOnly, deleteCourseHighlightItem);

module.exports = router;
