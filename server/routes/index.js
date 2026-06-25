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
const {
  getCourseVideo, getAdminCourseVideo, updateCourseVideo,
  uploadCourseVideo, deleteCourseVideoUpload,
} = require("../controllers/courseVideoController");
const {
  getWhatYouLearn, getAdminWhatYouLearn, updateWhatYouLearnSection,
  createWhatYouLearnItem, updateWhatYouLearnItem, deleteWhatYouLearnItem,
} = require("../controllers/courseWhatYouLearnController");
const { uploadVideo } = require("../config/upload");

const {
  getCurriculum, getAdminCurriculum, updateCurriculumSection,
  createCurriculumModule, updateCurriculumModule, deleteCurriculumModule,
} = require("../controllers/courseCurriculumController");

const {
  getCourseProjects,
  getAdminProjectSettings, updateProjectSettings,
  getAdminProjects, createProject, updateProject, deleteProject,
} = require("../controllers/courseProjectController");

const {
  getCourseCareer,
  getAdminCareerSettings, updateCareerSettings,
  getAdminCareerItems, createCareerItem, updateCareerItem, deleteCareerItem,
} = require("../controllers/courseCareerController");

const {
  getCourseReviews,
  getAdminReviewSettings, updateReviewSettings,
  getAdminReviews, createReview, updateReview, deleteReview,
} = require("../controllers/courseReviewController");

const { getCourseFAQ, getAdminFAQSettings, updateFAQSettings, getAdminFAQs, createFAQ, updateFAQ, deleteFAQ } = require("../controllers/courseFAQController");
const { getCourseCTA, getAdminCTA, updateCTA } = require("../controllers/courseCTAController");








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

// ─── COURSE DETAILS → VIDEO SECTION (per-category, admin-editable) ───────────
// Public: fetch by category slug (or id)
router.get("/course-video/:categorySlug", getCourseVideo);

// Admin: fetch / update text fields (heading, subtitle, YouTube URL, videoType)
router.get("/admin/course-video/:categoryId", protect, adminOnly, getAdminCourseVideo);
router.put("/admin/course-video/:categoryId", protect, adminOnly, updateCourseVideo);

// Admin: upload a video file (max 200MB, validated in config/upload.js) —
// multer's `uploadVideo.single("video")` runs BEFORE the controller, so by
// the time uploadCourseVideo() executes, req.file is already saved to disk.
router.post("/admin/course-video/:categoryId/upload", protect, adminOnly, uploadVideo.single("video"), uploadCourseVideo);
router.delete("/admin/course-video/:categoryId/upload", protect, adminOnly, deleteCourseVideoUpload);

// ─── COURSE DETAILS → WHAT YOU'LL LEARN SECTION (per-category) ───────────────
router.get("/course-what-you-learn/:categorySlug", getWhatYouLearn);                                          // public

router.get("/admin/course-what-you-learn/:categoryId", protect, adminOnly, getAdminWhatYouLearn);
router.put("/admin/course-what-you-learn/:categoryId/section", protect, adminOnly, updateWhatYouLearnSection);
router.post("/admin/course-what-you-learn/:categoryId/items", protect, adminOnly, createWhatYouLearnItem);
router.put("/admin/course-what-you-learn/items/:id", protect, adminOnly, updateWhatYouLearnItem);
router.delete("/admin/course-what-you-learn/items/:id", protect, adminOnly, deleteWhatYouLearnItem);



// ─── COURSE DETAILS → CURRICULUM SECTION (per-category, admin-editable) ──────
router.get("/course-curriculum/:categorySlug", getCurriculum);                                              // public
 
router.get("/admin/course-curriculum/:categoryId", protect, adminOnly, getAdminCurriculum);
router.put("/admin/course-curriculum/:categoryId/section", protect, adminOnly, updateCurriculumSection);
router.post("/admin/course-curriculum/:categoryId/modules", protect, adminOnly, createCurriculumModule);
router.put("/admin/course-curriculum/modules/:id", protect, adminOnly, updateCurriculumModule);
router.delete("/admin/course-curriculum/modules/:id", protect, adminOnly, deleteCurriculumModule);

// ─── COURSE DETAILS → PROJECTS SECTION (global, not per-category) ─────────────
router.get("/course-projects", getCourseProjects);                                          // public

router.get("/admin/course-projects/settings", protect, adminOnly, getAdminProjectSettings);
router.put("/admin/course-projects/settings", protect, adminOnly, updateProjectSettings);
router.get("/admin/course-projects", protect, adminOnly, getAdminProjects);
router.post("/admin/course-projects", protect, adminOnly, createProject);
router.put("/admin/course-projects/:id", protect, adminOnly, updateProject);
router.delete("/admin/course-projects/:id", protect, adminOnly, deleteProject);

// ─── COURSE DETAILS → CAREER SECTION ─────────────────────────────────────────
router.get("/course-career", getCourseCareer);                                              // public

router.get("/admin/course-career/settings", protect, adminOnly, getAdminCareerSettings);
router.put("/admin/course-career/settings", protect, adminOnly, updateCareerSettings);
router.get("/admin/course-career", protect, adminOnly, getAdminCareerItems);
router.post("/admin/course-career", protect, adminOnly, createCareerItem);
router.put("/admin/course-career/:id", protect, adminOnly, updateCareerItem);
router.delete("/admin/course-career/:id", protect, adminOnly, deleteCareerItem);

// ─── COURSE DETAILS → REVIEWS SECTION ────────────────────────────────────────
router.get("/course-reviews", getCourseReviews);                                            // public

router.get("/admin/course-reviews/settings", protect, adminOnly, getAdminReviewSettings);
router.put("/admin/course-reviews/settings", protect, adminOnly, updateReviewSettings);
router.get("/admin/course-reviews", protect, adminOnly, getAdminReviews);
router.post("/admin/course-reviews", protect, adminOnly, createReview);
router.put("/admin/course-reviews/:id", protect, adminOnly, updateReview);
router.delete("/admin/course-reviews/:id", protect, adminOnly, deleteReview);

// ─── COURSE DETAILS → FAQ SECTION ────────────────────────────────────────────
router.get("/course-faq", getCourseFAQ);
router.get("/admin/course-faq/settings", protect, adminOnly, getAdminFAQSettings);
router.put("/admin/course-faq/settings", protect, adminOnly, updateFAQSettings);
router.get("/admin/course-faq", protect, adminOnly, getAdminFAQs);
router.post("/admin/course-faq", protect, adminOnly, createFAQ);
router.put("/admin/course-faq/:id", protect, adminOnly, updateFAQ);
router.delete("/admin/course-faq/:id", protect, adminOnly, deleteFAQ);

// ─── COURSE DETAILS → CTA SECTION ────────────────────────────────────────────
router.get("/course-cta", getCourseCTA);
router.get("/admin/course-cta", protect, adminOnly, getAdminCTA);
router.put("/admin/course-cta", protect, adminOnly, updateCTA);





module.exports = router;