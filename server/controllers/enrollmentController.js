const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const { sendEnrollmentApprovedEmail, sendEnrollmentRejectedEmail, sendEnrollmentRevokedEmail, sendInvoiceEmail } = require("../config/mailer");
const { generateInvoicePdfBuffer } = require("../utils/invoicePdf");

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
    if (status && ["pending", "approved", "rejected", "revoked"].includes(status)) {
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

    const wasAlreadyApproved = enrollment.status === "approved"; // guard against double-count on re-save
    enrollment.status = action === "approve" ? "approved" : "rejected";
    enrollment.adminNote = adminNote || "";
    enrollment.reviewedAt = new Date();
    enrollment.reviewedBy = req.user._id;
    await enrollment.save();

    // Coupon usedCount এতদিন কোথাও increment হতো না (maxUses limit কোনোদিনই
    // কাজ করছিল না) — approve হলেই এখন এক ধাপ বাড়বে, analytics-ও এর উপর নির্ভর করে
    if (action === "approve" && !wasAlreadyApproved && enrollment.couponCode) {
      Coupon.updateOne({ code: enrollment.couponCode }, { $inc: { usedCount: 1 } })
        .catch((e) => console.error("Coupon usedCount update failed:", e.message));
    }

    const populated = await enrollment.populate([
      { path: "user", select: "name email" },
      { path: "course", select: "title" },
    ]);

    // Email notification — fail hole o main response block hobe na
    if (populated.user?.email) {
      const emailPromise = action === "approve"
        ? sendEnrollmentApprovedEmail(populated.user.email, {
            studentName: populated.user.name,
            courseTitle: populated.course?.title || "কোর্স",
          })
        : sendEnrollmentRejectedEmail(populated.user.email, {
            studentName: populated.user.name,
            courseTitle: populated.course?.title || "কোর্স",
            reason: adminNote || "",
          });
      emailPromise.catch((e) => console.error("Enrollment review email failed:", e.message));

      // Manual (bKash/Nagad screenshot) approve howar somoyo invoice pathai —
      // SSLCommerz auto-approve flow-er moto same behavior, consistency-r jonno
      if (action === "approve") {
        generateInvoicePdfBuffer({
          invoiceId: enrollment.transactionId || enrollment._id.toString(),
          studentName: populated.user.name,
          studentEmail: populated.user.email,
          courseTitle: populated.course?.title || "Course",
          amount: enrollment.amountPaid,
          discountAmount: enrollment.discountAmount || 0,
          paymentMethod: enrollment.paymentMethod,
          transactionId: enrollment.transactionId,
          date: enrollment.reviewedAt,
        })
          .then((pdfBuffer) => sendInvoiceEmail(populated.user.email, {
            studentName: populated.user.name,
            courseTitle: populated.course?.title || "Course",
            invoiceId: enrollment.transactionId || enrollment._id.toString(),
          }, pdfBuffer))
          .catch((e) => console.error("Invoice email failed:", e.message));
      }
    }

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
    const [pending, approved, rejected, revoked, revenueAgg, uniqueStudents] = await Promise.all([
      Enrollment.countDocuments({ status: "pending" }),
      Enrollment.countDocuments({ status: "approved" }),
      Enrollment.countDocuments({ status: "rejected" }),
      Enrollment.countDocuments({ status: "revoked" }),
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
      revoked,
      total: pending + approved + rejected + revoked,
      totalRevenue: revenueAgg[0]?.total || 0,
      uniqueStudents: uniqueStudents.length,
    });
  } catch (error) {
    console.error("getEnrollmentStats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: approved enrollment revoke করা — refund/policy violation ইত্যাদি
// কারণে student এর access বন্ধ করে দেওয়া। PUT /api/admin/enrollments/:id/revoke
const revokeEnrollment = async (req, res) => {
  try {
    const { reason, markRefunded } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment পাওয়া যায়নি।" });
    if (enrollment.status !== "approved") {
      return res.status(400).json({ message: "শুধু approved enrollment revoke করা যাবে।" });
    }

    enrollment.status = "revoked";
    enrollment.revokedAt = new Date();
    enrollment.revokedBy = req.user._id;
    enrollment.revokeReason = reason || "";
    if (markRefunded) enrollment.refundStatus = "refunded";
    await enrollment.save();

    const populated = await enrollment.populate([
      { path: "user", select: "name email" },
      { path: "course", select: "title" },
    ]);

    if (populated.user?.email) {
      sendEnrollmentRevokedEmail(populated.user.email, {
        studentName: populated.user.name,
        courseTitle: populated.course?.title || "কোর্স",
        reason: reason || "",
        refunded: !!markRefunded,
      }).catch((e) => console.error("Revoke email failed:", e.message));
    }

    res.json({ message: "Enrollment revoke করা হয়েছে।", enrollment: populated });
  } catch (error) {
    console.error("revokeEnrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: refund processing-এর জন্য payment details — কোন নম্বরে/কোন
// method এ টাকা এসেছে সব এক জায়গায়, যাতে admin manually bKash/Nagad/bank
// থেকে টাকা ফেরত পাঠাতে পারে। GET /api/admin/enrollments/:id/payment-details
const getEnrollmentPaymentDetails = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate("user", "name email phone");
    if (!enrollment) return res.status(404).json({ message: "Enrollment পাওয়া যায়নি।" });

    // SSLCommerz দিয়ে হলে PaymentTransaction-এ আসল gateway data (masked
    // account number সহ) থাকে — manual bKash/Nagad হলে enrollment-এই সব আছে
    if (enrollment.paymentMethod === "SSLCommerz") {
      const PaymentTransaction = require("../models/PaymentTransaction");
      const txn = await PaymentTransaction.findOne({ enrollment: enrollment._id });
      return res.json({
        method: "SSLCommerz",
        walletOrCardType: txn?.cardType || "জানা যায়নি",
        accountNumber: txn?.cardNo || "জানা যায়নি (masked number gateway পাঠায়নি)",
        transactionId: txn?.tranId || enrollment.transactionId,
        bankTransactionId: txn?.bankTranId || "",
        amount: txn?.amount ?? enrollment.amountPaid,
        studentContact: { name: enrollment.user?.name, email: enrollment.user?.email, phone: enrollment.user?.phone },
        screenshotUrl: null,
        note: "SSLCommerz gateway-এর মাধ্যমে পেমেন্ট হয়েছে। উপরের account number-এ manually refund পাঠাও (bKash/Nagad হলে ওই নম্বরে, card হলে bank-কে জানাতে হতে পারে)।",
      });
    }

    // Manual flow (bKash/Nagad/Rocket) — student নিজে transaction ID টাইপ করেছিল, screenshot দিয়েছিল
    return res.json({
      method: enrollment.paymentMethod || "Manual",
      walletOrCardType: enrollment.paymentMethod || "Manual",
      accountNumber: "student এর নিজস্ব " + (enrollment.paymentMethod || "") + " নম্বর — screenshot/student profile থেকে দেখো",
      transactionId: enrollment.transactionId,
      bankTransactionId: "",
      amount: enrollment.amountPaid,
      studentContact: { name: enrollment.user?.name, email: enrollment.user?.email, phone: enrollment.user?.phone },
      screenshotUrl: enrollment.screenshotUrl || null,
      note: "Manual পেমেন্ট — student এর দেওয়া transaction ID আর screenshot verify করে সেই নম্বরেই bKash/Nagad/Rocket দিয়ে manually refund পাঠাও। student এর phone number থাকলে সরাসরি যোগাযোগও করতে পারো।",
    });
  } catch (error) {
    console.error("getEnrollmentPaymentDetails error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitEnrollment,
  getMyEnrollments,
  checkEnrollment,
  getAllEnrollments,
  reviewEnrollment,
  revokeEnrollment,
  getEnrollmentPaymentDetails,
  deleteEnrollment,
  getEnrollmentStats,
};
