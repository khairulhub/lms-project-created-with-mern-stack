const express = require("express");
const router = express.Router();
const { protect, adminOnly, instructorOnly, verifyFirebaseToken } = require("../middleware/authMiddleware");
const { firebaseSync, getMe } = require("../controllers/authController");
const { getProfile, updateProfile, requestInstructor, getMyRequest, getInstructorStats } = require("../controllers/userController");
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
const { uploadVideo, uploadChatFile } = require("../config/upload");

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
const {
  getPublicCourses, getPublicCourse,
  getAdminCourses, createCourse, updateCourse, approveCourse, rejectCourse, deleteCourse, getCourseStats,
  getInstructorCourses, instructorCreateCourse, instructorUpdateCourse, instructorDeleteCourse, getInstructorCourseStats,
} = require("../controllers/courseController");
const {
  getPublicCourseDetail, getAdminCourseDetail, updateCourseDetailMeta,
  addWhatYouGet, updateWhatYouGet, deleteWhatYouGet,
  addRequirement, updateRequirement, deleteRequirement,
  addCDFAQ, updateCDFAQ, deleteCDFAQ,
  addCDReview, updateCDReview, deleteCDReview,
  addCDSection, updateCDSection, deleteCDSection,
  addCDLecture, updateCDLecture, deleteCDLecture,
} = require("../controllers/courseDetailController");


const {
  submitEnrollment,
  getMyEnrollments,
  checkEnrollment,
  getAllEnrollments,
  reviewEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
} = require("../controllers/enrollmentController");

const {
  getProgress,
  setLectureCompletion,
  setLastWatched,
} = require("../controllers/progressController");

const {
  getEligibility,
  getOrIssueCertificate,
  verifyCertificate,
} = require("../controllers/certificateController");

const {
  getAdminAnnouncements, createAdminAnnouncement, updateAdminAnnouncement, deleteAdminAnnouncement,
  getInstructorAnnouncements, createInstructorAnnouncement, updateInstructorAnnouncement, deleteInstructorAnnouncement,
  getFeed, getUnreadCount, markAsRead,
} = require("../controllers/announcementController");

const {
  getAdminSessions, createAdminSession, updateAdminSession, deleteAdminSession, getEndedSessionsCount,
  getInstructorSessions, createInstructorSession, updateInstructorSession, deleteInstructorSession,
  getSessionFeed,
} = require("../controllers/sessionController");

const {
  createTicket, getMyTickets, getMyTicketById, replyToTicket, closeMyTicket, getMyUnreadCount,
  getAllTickets, getAdminTicketById, adminReplyToTicket, updateTicketStatus, deleteTicket, getOpenTicketsCount,
} = require("../controllers/helpdeskController");

const {
  getMyCourseChat, sendStudentMessage, getStudentUnreadCount,
  getInstructorThreads, getInstructorThreadById, instructorReply, getInstructorUnreadCount,
  getAdminThreads, getAdminThreadById, adminReply, getAdminUnreadCount,
  uploadAttachment,
} = require("../controllers/courseChatController");








// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post("/auth/firebase-sync", verifyFirebaseToken, firebaseSync);
router.get("/auth/me", protect, getMe);

// ─── USER (own profile + instructor request) ─────────────────────────────────
router.get("/users/profile", protect, getProfile);
router.put("/users/profile", protect, updateProfile);
router.post("/users/request-instructor", protect, requestInstructor);
router.get("/users/my-request", protect, getMyRequest);
router.get("/instructor/stats", protect, instructorOnly, getInstructorStats);

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

// Admin: upload a video file (max 100MB, validated in config/upload.js) —
// multer's `uploadVideo.single("video")` runs BEFORE the controller, so by
// the time uploadCourseVideo() executes, the file is already streamed to
// Cloudinary and req.file holds the Cloudinary URL/public_id.
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

// ─── COURSES (category-wise) ──────────────────────────────────────────────────
// ── PUBLIC courses ───────────────────────────────────────────────────────
router.get("/courses",     getPublicCourses);
router.get("/courses/:id", getPublicCourse);

// ── ADMIN courses ────────────────────────────────────────────────────────
router.get("/admin/courses",              protect, adminOnly, getAdminCourses);
router.post("/admin/courses",             protect, adminOnly, createCourse);
router.put("/admin/courses/:id",          protect, adminOnly, updateCourse);
router.put("/admin/courses/:id/approve",  protect, adminOnly, approveCourse);
router.put("/admin/courses/:id/reject",   protect, adminOnly, rejectCourse);
router.delete("/admin/courses/:id",       protect, adminOnly, deleteCourse);
router.get("/admin/courses/:id/stats",    protect, adminOnly, getCourseStats);

// ── INSTRUCTOR courses (own courses only) ────────────────────────────────
router.get("/instructor/courses",              protect, instructorOnly, getInstructorCourses);
router.post("/instructor/courses",             protect, instructorOnly, instructorCreateCourse);
router.put("/instructor/courses/:id",          protect, instructorOnly, instructorUpdateCourse);
router.delete("/instructor/courses/:id",       protect, instructorOnly, instructorDeleteCourse);
router.get("/instructor/courses/:id/stats",    protect, instructorOnly, getInstructorCourseStats);





// ─── COURSE DETAIL (per-course, all sections) ────────────────────────────────
// Public
router.get("/course-details/:courseId", getPublicCourseDetail);

// Admin/Instructor — course detail (ownership-checked in controller)
router.get("/admin/course-details/:courseId",  protect, instructorOnly, getAdminCourseDetail);
router.put("/admin/course-details/:courseId",  protect, instructorOnly, updateCourseDetailMeta);

// whatYouGet
router.post("/admin/course-details/:courseId/what-you-get",          protect, instructorOnly, addWhatYouGet);
router.put("/admin/course-details/:courseId/what-you-get/:itemId",   protect, instructorOnly, updateWhatYouGet);
router.delete("/admin/course-details/:courseId/what-you-get/:itemId",protect, instructorOnly, deleteWhatYouGet);

// requirements
router.post("/admin/course-details/:courseId/requirements",          protect, instructorOnly, addRequirement);
router.put("/admin/course-details/:courseId/requirements/:itemId",   protect, instructorOnly, updateRequirement);
router.delete("/admin/course-details/:courseId/requirements/:itemId",protect, instructorOnly, deleteRequirement);

// FAQs
router.post("/admin/course-details/:courseId/faqs",          protect, instructorOnly, addCDFAQ);
router.put("/admin/course-details/:courseId/faqs/:itemId",   protect, instructorOnly, updateCDFAQ);
router.delete("/admin/course-details/:courseId/faqs/:itemId",protect, instructorOnly, deleteCDFAQ);

// Reviews
router.post("/admin/course-details/:courseId/reviews",          protect, instructorOnly, addCDReview);
router.put("/admin/course-details/:courseId/reviews/:itemId",   protect, instructorOnly, updateCDReview);
router.delete("/admin/course-details/:courseId/reviews/:itemId",protect, instructorOnly, deleteCDReview);

// Curriculum sections
router.post("/admin/course-details/:courseId/curriculum",                     protect, instructorOnly, addCDSection);
router.put("/admin/course-details/:courseId/curriculum/:sectionId",           protect, instructorOnly, updateCDSection);
router.delete("/admin/course-details/:courseId/curriculum/:sectionId",        protect, instructorOnly, deleteCDSection);

// Lectures inside a section
router.post("/admin/course-details/:courseId/curriculum/:sectionId/lectures",                    protect, instructorOnly, addCDLecture);
router.put("/admin/course-details/:courseId/curriculum/:sectionId/lectures/:lectureId",          protect, instructorOnly, updateCDLecture);
router.delete("/admin/course-details/:courseId/curriculum/:sectionId/lectures/:lectureId",       protect, instructorOnly, deleteCDLecture);

const {
  validateCoupon,
  getAllCoupons, getCoupon, createCoupon, updateCoupon, toggleCoupon, deleteCoupon,
} = require("../controllers/couponController");

// ─── COUPONS ──────────────────────────────────────────────────────────────────
// Public — validate a code (frontend sidebar uses this)
router.post("/coupons/validate", validateCoupon);

// Admin — full CRUD
router.get("/admin/coupons",           protect, adminOnly, getAllCoupons);
router.get("/admin/coupons/:id",       protect, adminOnly, getCoupon);
router.post("/admin/coupons",          protect, adminOnly, createCoupon);
router.put("/admin/coupons/:id",       protect, adminOnly, updateCoupon);
router.put("/admin/coupons/:id/toggle",protect, adminOnly, toggleCoupon);
router.delete("/admin/coupons/:id",    protect, adminOnly, deleteCoupon);

const {
  getPublicCourseReviews, getAllActiveStudentReviews, submitCourseReview,
  getAdminCourseReviewCourses, getAdminCourseReviews, updateCourseReview, deleteCourseReview,
  getPublicInstructorReviews, submitInstructorReview,
  getAdminInstructorReviewList, getAdminInstructorReviews, updateInstructorReview, deleteInstructorReview,
} = require("../controllers/studentReviewController");

// ── STUDENT-SUBMITTED REVIEWS ─────────────────────────────────────────────────
// Public — Course
router.get("/student-reviews/active-all",          getAllActiveStudentReviews); // must be above :courseId route
router.get("/student-reviews/course/:courseId",   getPublicCourseReviews);
router.post("/student-reviews/course/:courseId",  protect, submitCourseReview);

// Public — Instructor
router.get("/student-reviews/instructor/:instructorId",  getPublicInstructorReviews);
router.post("/student-reviews/instructor/:instructorId", submitInstructorReview);

// Admin — Course reviews
router.get("/admin/student-reviews/courses",                    protect, adminOnly, getAdminCourseReviewCourses);
router.get("/admin/student-reviews/course/:courseId",           protect, adminOnly, getAdminCourseReviews);
router.put("/admin/student-reviews/:id",                        protect, adminOnly, updateCourseReview);
router.delete("/admin/student-reviews/:id",                     protect, adminOnly, deleteCourseReview);

// Admin — Instructor reviews
router.get("/admin/student-reviews/instructors",                    protect, adminOnly, getAdminInstructorReviewList);
router.get("/admin/student-reviews/instructor/:instructorId",       protect, adminOnly, getAdminInstructorReviews);
router.put("/admin/student-reviews/instructor-review/:id",          protect, adminOnly, updateInstructorReview);
router.delete("/admin/student-reviews/instructor-review/:id",       protect, adminOnly, deleteInstructorReview);

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
router.post("/enrollments",                    protect, submitEnrollment);
router.get("/enrollments/my",                  protect, getMyEnrollments);
router.get("/enrollments/check/:courseId",     protect, checkEnrollment);

router.get("/admin/enrollments/stats",         protect, adminOnly, getEnrollmentStats);
router.get("/admin/enrollments",               protect, adminOnly, getAllEnrollments);
router.put("/admin/enrollments/:id/review",    protect, adminOnly, reviewEnrollment);
router.delete("/admin/enrollments/:id",        protect, adminOnly, deleteEnrollment);

// ─── STUDENT COURSE PROGRESS (lecture completion + last-watched, persists
// across refresh / device — backed by CourseProgress, scoped to approved
// enrollment only) ─────────────────────────────────────────────────────────
router.get("/progress/:courseId",                          protect, getProgress);
router.put("/progress/:courseId/lecture/:lectureId",       protect, setLectureCompletion);
router.put("/progress/:courseId/last-watched",             protect, setLastWatched);

// ─── CERTIFICATES (issued once course progress hits 100% + enrollment is
// approved; PDF generated on-the-fly, nothing stored on disk) ─────────────
router.get("/certificates/:courseId/eligibility", protect, getEligibility);
router.get("/certificates/verify/:certificateId", verifyCertificate); // public — no auth, for employers/anyone to verify
router.get("/certificates/:courseId",             protect, getOrIssueCertificate);

// ─── QUIZ (section-level) ─────────────────────────────────────────────────
const {
  upsertQuiz, toggleQuizActive, deleteQuiz, getCourseQuizzes,
  getStudentQuiz, submitQuiz, getMyCourseAttempts, getStudentCourseQuizzes,
  getModuleQuizLeaderboard, getOverallQuizLeaderboard,
} = require("../controllers/quizController");

router.get("/admin/quizzes/:courseId",                          protect, adminOnly, getCourseQuizzes);
router.put("/admin/quizzes/:courseId/section/:sectionId",       protect, adminOnly, upsertQuiz);
router.patch("/admin/quizzes/:courseId/section/:sectionId/toggle", protect, adminOnly, toggleQuizActive);
router.delete("/admin/quizzes/:courseId/section/:sectionId",    protect, adminOnly, deleteQuiz);

router.get("/quizzes/:courseId/list",                           protect, getStudentCourseQuizzes);
router.get("/quizzes/:courseId/section/:sectionId",             protect, getStudentQuiz);
router.post("/quizzes/:courseId/section/:sectionId/submit",     protect, submitQuiz);
router.get("/quizzes/:courseId/my-attempts",                    protect, getMyCourseAttempts);

// Leaderboards — quiz
router.get("/leaderboard/quiz/:courseId/section/:sectionId",    protect, getModuleQuizLeaderboard);
router.get("/leaderboard/quiz/:courseId/overall",               protect, getOverallQuizLeaderboard);

// ─── ASSIGNMENT (module-level) ────────────────────────────────────────────
const {
  upsertAssignment, toggleAssignmentActive, deleteAssignment, getCourseAssignments,
  getAllSubmissions, reviewSubmission, bulkGradeSubmissions,
  getStudentAssignments, submitAssignment, getMySubmissions,
  getModuleAssignmentLeaderboard, getOverallAssignmentLeaderboard,
} = require("../controllers/assignmentController");

router.get("/admin/assignments/:courseId",                  protect, adminOnly, getCourseAssignments);
router.put("/admin/assignments/:courseId",                  protect, adminOnly, upsertAssignment);
router.patch("/admin/assignments/:id/toggle",                protect, adminOnly, toggleAssignmentActive);
router.delete("/admin/assignments/:id",                     protect, adminOnly, deleteAssignment);
router.get("/admin/assignments/:courseId/submissions",      protect, adminOnly, getAllSubmissions);
router.put("/admin/submissions/:subId/review",              protect, adminOnly, reviewSubmission);
router.post("/admin/assignments/:courseId/bulk-grade",      protect, adminOnly, bulkGradeSubmissions);

router.get("/assignments/:courseId",                        protect, getStudentAssignments);
router.post("/assignments/:courseId/submit",                protect, submitAssignment);
router.get("/assignments/:courseId/my-submissions",         protect, getMySubmissions);

// Leaderboards — assignment
router.get("/leaderboard/assignment/:courseId/module/:moduleIndex", protect, getModuleAssignmentLeaderboard);
router.get("/leaderboard/assignment/:courseId/overall",             protect, getOverallAssignmentLeaderboard);

// ─── ANNOUNCEMENTS ─────────────────────────────────────────────────────────
// Admin — global othoba course-specific, students/instructors/both target kore
router.get("/admin/announcements",        protect, adminOnly, getAdminAnnouncements);
router.post("/admin/announcements",       protect, adminOnly, createAdminAnnouncement);
router.put("/admin/announcements/:id",    protect, adminOnly, updateAdminAnnouncement);
router.delete("/admin/announcements/:id", protect, adminOnly, deleteAdminAnnouncement);

// Instructor — শুধু নিজের course এর জন্য (scope সবসময় "course")
router.get("/instructor/announcements",        protect, instructorOnly, getInstructorAnnouncements);
router.post("/instructor/announcements",       protect, instructorOnly, createInstructorAnnouncement);
router.put("/instructor/announcements/:id",    protect, instructorOnly, updateInstructorAnnouncement);
router.delete("/instructor/announcements/:id", protect, instructorOnly, deleteInstructorAnnouncement);

// Feed — student + instructor উভয়ের জন্য relevant announcement দেখার জন্য
router.get("/announcements/feed", protect, getFeed);
router.get("/announcements/unread-count", protect, getUnreadCount);
router.post("/announcements/:id/read", protect, markAsRead);

// ─── CONCEPTUAL SESSIONS (Zoom / Google Meet) ──────────────────────────────
// Admin — global othoba course-specific session
router.get("/admin/sessions",        protect, adminOnly, getAdminSessions);
router.get("/admin/sessions/ended-count", protect, adminOnly, getEndedSessionsCount);
router.post("/admin/sessions",       protect, adminOnly, createAdminSession);
router.put("/admin/sessions/:id",    protect, adminOnly, updateAdminSession);
router.delete("/admin/sessions/:id", protect, adminOnly, deleteAdminSession);

// Instructor — শুধু নিজের course এর জন্য session
router.get("/instructor/sessions",        protect, instructorOnly, getInstructorSessions);
router.post("/instructor/sessions",       protect, instructorOnly, createInstructorSession);
router.put("/instructor/sessions/:id",    protect, instructorOnly, updateInstructorSession);
router.delete("/instructor/sessions/:id", protect, instructorOnly, deleteInstructorSession);

// Feed — student + instructor উভয়ের জন্য relevant session দেখার জন্য (join korar jonno)
router.get("/sessions/feed", protect, getSessionFeed);

// ─── HELPDESK (support tickets) ─────────────────────────────────────────────
// Student — nijer ticket khola, dekha, reply, close
router.post("/helpdesk/tickets",              protect, createTicket);
router.get("/helpdesk/tickets/my",            protect, getMyTickets);
router.get("/helpdesk/tickets/unread-count",  protect, getMyUnreadCount);
router.get("/helpdesk/tickets/:id",           protect, getMyTicketById);
router.post("/helpdesk/tickets/:id/reply",    protect, replyToTicket);
router.put("/helpdesk/tickets/:id/close",     protect, closeMyTicket);

// Admin — shob ticket dekha, reply, status change, delete
router.get("/admin/helpdesk/tickets",             protect, adminOnly, getAllTickets);
router.get("/admin/helpdesk/tickets/open-count",  protect, adminOnly, getOpenTicketsCount);
router.get("/admin/helpdesk/tickets/:id",         protect, adminOnly, getAdminTicketById);
router.post("/admin/helpdesk/tickets/:id/reply",  protect, adminOnly, adminReplyToTicket);
router.put("/admin/helpdesk/tickets/:id/status",  protect, adminOnly, updateTicketStatus);
router.delete("/admin/helpdesk/tickets/:id",      protect, adminOnly, deleteTicket);

// ─── COURSE CHAT (student ↔ instructor/admin, per course) ───────────────────
// File/image upload — shared, jekono logged-in role use korte pare
router.post("/course-chat/upload", protect, uploadChatFile.single("file"), uploadAttachment);

// Student — nijer kena course-er chat thread
router.get("/course-chat/unread-count",     protect, getStudentUnreadCount);
router.get("/course-chat/:courseId",        protect, getMyCourseChat);
router.post("/course-chat/:courseId/message", protect, sendStudentMessage);

// Instructor — nijer course-gulor shob chat thread
router.get("/instructor/course-chat/threads",       protect, instructorOnly, getInstructorThreads);
router.get("/instructor/course-chat/unread-count",  protect, instructorOnly, getInstructorUnreadCount);
router.get("/instructor/course-chat/:threadId",     protect, instructorOnly, getInstructorThreadById);
router.post("/instructor/course-chat/:threadId/message", protect, instructorOnly, instructorReply);

// Admin — shob course-er shob chat thread (oversight)
router.get("/admin/course-chat/threads",       protect, adminOnly, getAdminThreads);
router.get("/admin/course-chat/unread-count",  protect, adminOnly, getAdminUnreadCount);
router.get("/admin/course-chat/:threadId",     protect, adminOnly, getAdminThreadById);
router.post("/admin/course-chat/:threadId/message", protect, adminOnly, adminReply);

// ─── BOOKMARKS (student saves lectures for later) ───────────────────────────
const { getCourseBookmarks, toggleBookmark, getMyBookmarks, deleteBookmark } = require("../controllers/bookmarkController");

router.get("/bookmarks/my",                 protect, getMyBookmarks);
router.get("/bookmarks/course/:courseId",   protect, getCourseBookmarks);
router.post("/bookmarks/toggle",            protect, toggleBookmark);
router.delete("/bookmarks/:id",             protect, deleteBookmark);

// ─── ANALYSIS (student performance dashboard, aggregated across courses) ────
const { getMyAnalysis } = require("../controllers/analysisController");
router.get("/analysis/me", protect, getMyAnalysis);

// ─── WISHLIST (course-level save-before-buying, public listing theke) ──────
const { getMyWishlist, getMyWishlistIds, toggleWishlist } = require("../controllers/wishlistController");

router.get("/wishlist/my",      protect, getMyWishlist);
router.get("/wishlist/ids",     protect, getMyWishlistIds);
router.post("/wishlist/toggle", protect, toggleWishlist);

// ─── PAYMENTS (SSLCommerz automated gateway) ────────────────────────────────
// init/status protected (student action) — success/fail/cancel/ipn PUBLIC,
// karon SSLCommerz nijei call kore (kono JWT thake na oi request e)
const {
  initiatePayment, paymentSuccess, paymentFail, paymentCancel, paymentIPN, getTransactionStatus,
} = require("../controllers/paymentController");

router.post("/payments/sslcommerz/init",              protect, initiatePayment);
router.get("/payments/sslcommerz/status/:tranId",      protect, getTransactionStatus);
router.post("/payments/sslcommerz/success",            paymentSuccess);
router.post("/payments/sslcommerz/fail",               paymentFail);
router.post("/payments/sslcommerz/cancel",              paymentCancel);
router.post("/payments/sslcommerz/ipn",                paymentIPN);

module.exports = router;
