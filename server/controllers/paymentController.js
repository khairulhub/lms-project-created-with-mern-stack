const asyncHandler = require("express-async-handler");
const PaymentTransaction = require("../models/PaymentTransaction");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const { sendPaymentConfirmedEmail } = require("../config/mailer");

// ─── SSLCommerz config — sandbox by default, .env এ SSLCOMMERZ_IS_LIVE=true
// দিলে live gateway তে switch হবে। BD-তে SSLCommerz একটাই aggregator
// integration দিয়ে bKash/Nagad/Rocket/card/net-banking সবগুলো cover করে —
// তাই আলাদাভাবে প্রতিটা mobile-banking এর নিজস্ব merchant API লাগে না ────────
const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
const SSL_INIT_URL = isLive
  ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
  : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const SSL_VALIDATION_URL = isLive
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASSWD = process.env.SSLCOMMERZ_STORE_PASSWD;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// course price + coupon মিলিয়ে final amount বের করা — enrollmentController-এর
// manual flow যেভাবে হিসাব করে, এখানেও একই নিয়ম মানা হলো
const computeFinalAmount = async (course, couponCode) => {
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      discountAmount = coupon.discountType === "flat"
        ? coupon.discountValue
        : Math.round((course.price * coupon.discountValue) / 100);
    }
  }
  const finalAmount = Math.max(0, course.price - discountAmount);
  return { finalAmount, discountAmount };
};

// ─── STUDENT: payment session শুরু করা ───────────────────────────────────────
// POST /api/payments/sslcommerz/init  { courseId, couponCode }
const initiatePayment = asyncHandler(async (req, res) => {
  if (!STORE_ID || !STORE_PASSWD) {
    return res.status(500).json({
      message: "Payment gateway এখনো configure করা হয়নি। .env এ SSLCOMMERZ_STORE_ID আর SSLCOMMERZ_STORE_PASSWD দাও (sandbox account লাগবে sslcommerz.com থেকে)।",
    });
  }

  const { courseId, couponCode } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course পাওয়া যায়নি।" });

  const existing = await Enrollment.findOne({
    user: req.user._id, course: courseId, status: { $in: ["pending", "approved"] },
  });
  if (existing) {
    return res.status(400).json({
      message: existing.status === "approved" ? "তুমি ইতোমধ্যে এই কোর্সে enrolled।" : "তোমার একটা enrollment request already pending আছে।",
    });
  }

  const { finalAmount, discountAmount } = await computeFinalAmount(course, couponCode);
  const tranId = `LMS${Date.now()}${Math.floor(Math.random() * 10000)}`;

  await PaymentTransaction.create({
    user: req.user._id,
    course: course._id,
    tranId,
    amount: finalAmount,
    couponCode: couponCode || "",
    discountAmount,
    status: "pending",
  });

  const payload = {
    store_id: STORE_ID,
    store_passwd: STORE_PASSWD,
    total_amount: finalAmount > 0 ? finalAmount : 10, // SSLCommerz sandbox 0 amount নেয় না
    currency: "BDT",
    tran_id: tranId,
    success_url: `${BACKEND_URL}/api/payments/sslcommerz/success`,
    fail_url: `${BACKEND_URL}/api/payments/sslcommerz/fail`,
    cancel_url: `${BACKEND_URL}/api/payments/sslcommerz/cancel`,
    ipn_url: `${BACKEND_URL}/api/payments/sslcommerz/ipn`,
    shipping_method: "NO",
    product_name: course.title,
    product_category: "Course",
    product_profile: "general",
    cus_name: req.user.name || "Student",
    cus_email: req.user.email,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: req.user.phone || "01700000000",
  };

  let data;
  try {
    const response = await fetch(SSL_INIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString(),
    });
    data = await response.json();
  } catch (err) {
    console.error("SSLCommerz init call failed:", err.message);
    return res.status(502).json({ message: "Payment gateway-এর সাথে সংযোগ করা যায়নি। একটু পর আবার চেষ্টা করো।" });
  }

  if (data.status !== "SUCCESS") {
    return res.status(502).json({ message: "Payment session শুরু করা যায়নি।", detail: data.failedreason || "" });
  }

  res.json({ gatewayUrl: data.GatewayPageURL, tranId });
});

// ─── Gateway থেকে val_id দিয়ে server-side validate করে enrollment auto-approve
// করা — success redirect আর IPN দুই জায়গা থেকেই call হতে পারে, তাই idempotent ───
const finalizeTransaction = async (tranId, valId) => {
  if (!tranId || !valId) return { ok: false };

  const txn = await PaymentTransaction.findOne({ tranId });
  if (!txn) return { ok: false };
  if (txn.status === "success") return { ok: true, courseId: txn.course }; // already processed

  const params = new URLSearchParams({ val_id: valId, store_id: STORE_ID, store_passwd: STORE_PASSWD, format: "json" });
  let vData;
  try {
    const vRes = await fetch(`${SSL_VALIDATION_URL}?${params.toString()}`);
    vData = await vRes.json();
  } catch (err) {
    console.error("SSLCommerz validation call failed:", err.message);
    return { ok: false };
  }

  const isValid = ["VALID", "VALIDATED"].includes(vData.status);
  if (!isValid) {
    txn.status = "failed";
    txn.gatewayRawResponse = vData;
    await txn.save();
    return { ok: false };
  }

  txn.status = "success";
  txn.valId = valId;
  txn.bankTranId = vData.bank_tran_id || "";
  txn.cardType = vData.card_type || "";
  txn.gatewayRawResponse = vData;

  // Enrollment auto তৈরি + approve — manual bKash/Nagad screenshot review এর
  // মতো admin-wait লাগবে না, কারণ gateway নিজেই payment validate করে দিয়েছে
  let enrollment = await Enrollment.findOne({
    user: txn.user, course: txn.course, status: { $in: ["pending", "approved"] },
  });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      user: txn.user,
      course: txn.course,
      paymentMethod: "SSLCommerz",
      transactionId: txn.tranId,
      couponCode: txn.couponCode,
      discountAmount: txn.discountAmount,
      amountPaid: txn.amount,
      status: "approved",
      reviewedAt: new Date(),
    });
  } else if (enrollment.status !== "approved") {
    enrollment.status = "approved";
    enrollment.reviewedAt = new Date();
    await enrollment.save();
  }
  txn.enrollment = enrollment._id;
  await txn.save();

  const [user, course] = await Promise.all([
    User.findById(txn.user).select("name email"),
    Course.findById(txn.course).select("title"),
  ]);
  if (user?.email) {
    sendPaymentConfirmedEmail(user.email, {
      studentName: user.name, courseTitle: course?.title || "কোর্স", amount: txn.amount,
    }).catch((e) => console.error("Payment confirm email failed:", e.message));
  }

  return { ok: true, courseId: txn.course };
};

// ─── SSLCommerz → browser এই তিনটার একটাতে redirect করে (form POST) ─────────
// POST /api/payments/sslcommerz/success  (PUBLIC — gateway call করে, JWT থাকে না)
const paymentSuccess = asyncHandler(async (req, res) => {
  const { tran_id, val_id } = req.body;
  const result = await finalizeTransaction(tran_id, val_id);
  const q = result.ok ? `status=success&course=${result.courseId}` : "status=failed";
  res.redirect(`${CLIENT_URL}/payment/callback?${q}`);
});

// POST /api/payments/sslcommerz/fail
const paymentFail = asyncHandler(async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) await PaymentTransaction.findOneAndUpdate({ tranId: tran_id, status: "pending" }, { status: "failed" });
  res.redirect(`${CLIENT_URL}/payment/callback?status=failed`);
});

// POST /api/payments/sslcommerz/cancel
const paymentCancel = asyncHandler(async (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) await PaymentTransaction.findOneAndUpdate({ tranId: tran_id, status: "pending" }, { status: "cancelled" });
  res.redirect(`${CLIENT_URL}/payment/callback?status=cancelled`);
});

// POST /api/payments/sslcommerz/ipn — reliability backstop, server-to-server
const paymentIPN = asyncHandler(async (req, res) => {
  const { tran_id, val_id } = req.body;
  await finalizeTransaction(tran_id, val_id);
  res.status(200).send("IPN received");
});

// ─── STUDENT: নিজের transaction-এর status check (PaymentCallback পেজ পোল করবে)
// GET /api/payments/sslcommerz/status/:tranId
const getTransactionStatus = asyncHandler(async (req, res) => {
  const txn = await PaymentTransaction.findOne({ tranId: req.params.tranId, user: req.user._id })
    .populate("course", "title")
    .select("status amount course enrollment");
  if (!txn) return res.status(404).json({ message: "Transaction পাওয়া যায়নি।" });
  res.json(txn);
});

module.exports = {
  initiatePayment, paymentSuccess, paymentFail, paymentCancel, paymentIPN, getTransactionStatus,
};
