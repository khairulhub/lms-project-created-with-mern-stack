// ═══════════════════════════════════════════════════════════════════════════
// routes/index.js এ এই section টা add করো — বাকি সব route এর পরে,
// module.exports এর ঠিক আগে।
// ═══════════════════════════════════════════════════════════════════════════

const {
  submitEnrollment,
  getMyEnrollments,
  checkEnrollment,
  getAllEnrollments,
  reviewEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
} = require("../controllers/enrollmentController");

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

// Student routes (login করা যেকোনো user)
router.post("/enrollments",                    protect, submitEnrollment);
router.get("/enrollments/my",                  protect, getMyEnrollments);
router.get("/enrollments/check/:courseId",     protect, checkEnrollment);

// Admin routes
router.get("/admin/enrollments/stats",         protect, adminOnly, getEnrollmentStats);
router.get("/admin/enrollments",               protect, adminOnly, getAllEnrollments);
router.put("/admin/enrollments/:id/review",    protect, adminOnly, reviewEnrollment);
router.delete("/admin/enrollments/:id",        protect, adminOnly, deleteEnrollment);
