const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");

// ─── STUDENT: Enroll করার request submit ─────────────────────────────────────
// POST /api/enrollments
// Body: { courseId, paymentMethod, transactionId, screenshotUrl, couponCode, amountPaid }
const submitEnrollment = async (req, res) => {
  try {
    const { courseId, paymentMethod, transactionId, screenshotUrl, couponCode, amountPaid } = req.body;
    const userId = req.user._id;

    // Course exist করে কিনা check
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course পাওয়া যায়নি।" });
    }

    // Already pending বা approved enrollment আছে কিনা check
    const existing = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      if (existing.status === "approved") {
        return res.status(400).json({ message: "তুমি এই কোর্সে ইতোমধ্যে enrolled আছো।" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "তোমার enrollment request ইতোমধ্যে pending আছে। Admin review করবে শীঘ্রই।" });
      }
    }

    // Coupon validate (optional)
    let discountAmount = 0;
    let validCoupon = null;
    if (couponCode) {
      validCoupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (validCoupon) {
        if (validCoupon.discountType === "flat") {
          discountAmount = validCoupon.discountValue;
        } else if (validCoupon.discountType === "percent") {
          discountAmount = validCoupon.discountValue; // percentage value, stored as-is
        }
      }
    }

    const parsedAmount = Number(amountPaid);
    if (!paymentMethod)     return res.status(400).json({ message: "Payment method দাও।" });
    if (!transactionId)     return res.status(400).json({ message: "Transaction ID দাও।" });
    if (isNaN(parsedAmount) || parsedAmount < 0) return res.status(400).json({ message: "Invalid amount." });

    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      paymentMethod,
      transactionId,
      screenshotUrl: screenshotUrl || "",
      couponCode: couponCode || "",
      discountAmount,
      amountPaid: parsedAmount,
      status: "pending",
    });

    res.status(201).json({
      message: "Enrollment request সফলভাবে submit হয়েছে! Admin approve করলে তোমার dashboard-এ দেখাবে।",
      enrollment,
    });
  } catch (error) {
    console.error("submitEnrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── STUDENT: নিজের সব enrollment দেখো ──────────────────────────────────────
// GET /api/enrollments/my
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title thumbnail category")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("getMyEnrollments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── STUDENT: নির্দিষ্ট course-এ enrolled কিনা check ─────────────────────────
// GET /api/enrollments/check/:courseId
const checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    }).sort({ createdAt: -1 });

    if (!enrollment) {
      return res.json({ status: "not_enrolled" });
    }

    res.json({ status: enrollment.status, enrollmentId: enrollment._id });
  } catch (error) {
    console.error("checkEnrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: সব enrollment দেখো (filter by status) ────────────────────────────
// GET /api/admin/enrollments?status=pending
const getAllEnrollments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate("user", "name email profileImage phone")
      .populate("course", "title thumbnail")
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("getAllEnrollments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: Enrollment approve বা reject করো ─────────────────────────────────
// PUT /api/admin/enrollments/:id/review
// Body: { action: "approve" | "reject", adminNote: "" }
const reviewEnrollment = async (req, res) => {
  try {
    const { action, adminNote } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment পাওয়া যায়নি।" });
    }

    enrollment.status = action === "approve" ? "approved" : "rejected";
    enrollment.adminNote = adminNote || "";
    enrollment.reviewedAt = new Date();
    enrollment.reviewedBy = req.user._id;
    await enrollment.save();

    const populated = await enrollment.populate([
      { path: "user", select: "name email" },
      { path: "course", select: "title" },
    ]);

    res.json({
      message: action === "approve"
        ? "Enrollment approve করা হয়েছে। Student এখন কোর্স access পাবে।"
        : "Enrollment reject করা হয়েছে।",
      enrollment: populated,
    });
  } catch (error) {
    console.error("reviewEnrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: Enrollment delete করো ────────────────────────────────────────────
// DELETE /api/admin/enrollments/:id
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment পাওয়া যায়নি।" });
    }
    res.json({ message: "Enrollment delete করা হয়েছে।" });
  } catch (error) {
    console.error("deleteEnrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: Stats ────────────────────────────────────────────────────────────
// GET /api/admin/enrollments/stats
const getEnrollmentStats = async (req, res) => {
  try {
    const [pending, approved, rejected, revenueAgg, uniqueStudents] = await Promise.all([
      Enrollment.countDocuments({ status: "pending" }),
      Enrollment.countDocuments({ status: "approved" }),
      Enrollment.countDocuments({ status: "rejected" }),
      Enrollment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
      Enrollment.distinct("user", { status: "approved" }),
    ]);
    res.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
      totalRevenue: revenueAgg[0]?.total || 0,
      uniqueStudents: uniqueStudents.length,
    });
  } catch (error) {
    console.error("getEnrollmentStats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitEnrollment,
  getMyEnrollments,
  checkEnrollment,
  getAllEnrollments,
  reviewEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
};
