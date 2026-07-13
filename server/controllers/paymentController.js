const asyncHandler = require("express-async-handler");
const PaymentTransaction = require("../models/PaymentTransaction");
const PaymentGatewaySettings = require("../models/PaymentGatewaySettings");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const { sendPaymentConfirmedEmail, sendInvoiceEmail } = require("../config/mailer");
const { generateInvoicePdfBuffer } = require("../utils/invoicePdf");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Gateway config — admin panel (DB, PaymentGatewaySettings) কে সবসময়
// priority দেয়, DB এ কিছু set করা না থাকলে .env এ fallback করে। এভাবে site
// বিক্রি করার পরে নতুন owner কোড/`.env` টাচ না করেই admin panel থেকে নিজের
// Store ID/Password/Live-Test বসাতে পারবে ───────────────────────────────────
const getGatewayConfig = async () => {
  const settings = await PaymentGatewaySettings.findOne().lean();
  const storeId = settings?.sslStoreId || process.env.SSLCOMMERZ_STORE_ID || "";
  const storePasswd = settings?.sslStorePasswd || process.env.SSLCOMMERZ_STORE_PASSWD || "";
  const isLive = settings ? !!settings.isLive : process.env.SSLCOMMERZ_IS_LIVE === "true";

  return {
    storeId,
    storePasswd,
    isLive,
    initUrl: isLive
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validationUrl: isLive
      ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  };
};

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

// ══════════════════════════════════════════════════════════════════════════
// ADMIN: Gateway settings — Store ID/Password/Live-Test toggle
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/payment-settings
const getGatewaySettings = asyncHandler(async (req, res) => {
  let settings = await PaymentGatewaySettings.findOne();
  if (!settings) {
    // kokhono set kora hoyni — empty defaults + .env e kichu ache kina seta janai
    return res.json({
      sslStoreId: "",
      sslStorePasswd: "",
      isLive: process.env.SSLCOMMERZ_IS_LIVE === "true",
      usingEnvFallback: !!(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWD),
    });
  }
  res.json({ ...settings.toObject(), usingEnvFallback: false });
});

// PUT /api/admin/payment-settings  { sslStoreId, sslStorePasswd, isLive }
const updateGatewaySettings = asyncHandler(async (req, res) => {
  const { sslStoreId, sslStorePasswd, isLive } = req.body;

  let settings = await PaymentGatewaySettings.findOne();
  if (!settings) settings = new PaymentGatewaySettings();

  if (sslStoreId !== undefined) settings.sslStoreId = sslStoreId.trim();
  // Password field blank pathale purono value-i thakbe (jate re-save korar
  // somoy accidentally clear na hoye jay, jehetu UI te eta masked thake)
  if (sslStorePasswd !== undefined && sslStorePasswd.trim()) settings.sslStorePasswd = sslStorePasswd.trim();
  if (isLive !== undefined) settings.isLive = !!isLive;
  settings.updatedBy = req.user._id;

  await settings.save();
  res.json({ message: "Payment gateway settings save হয়েছে।", settings });
});

// ══════════════════════════════════════════════════════════════════════════
// STUDENT: payment flow
// ══════════════════════════════════════════════════════════════════════════

// POST /api/payments/sslcommerz/init  { courseId, couponCode }
const initiatePayment = asyncHandler(async (req, res) => {
  const gw = await getGatewayConfig();
  if (!gw.storeId || !gw.storePasswd) {
    return res.status(500).json({
      message: "Payment gateway এখনো configure করা হয়নি। Admin কে Payment Gateway settings থেকে SSLCommerz credentials বসাতে বলো।",
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
    store_id: gw.storeId,
    store_passwd: gw.storePasswd,
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
    const response = await fetch(gw.initUrl, {
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

  const gw = await getGatewayConfig();
  const params = new URLSearchParams({ val_id: valId, store_id: gw.storeId, store_passwd: gw.storePasswd, format: "json" });
  let vData;
  try {
    const vRes = await fetch(`${gw.validationUrl}?${params.toString()}`);
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
  txn.cardType = vData.card_type || ""; // mobile banking hole eikhane "bKash"/"Nagad"/"Rocket" thake, card hole "VISA-BankName"
  txn.cardNo = vData.card_no || ""; // masked account/card number, e.g. "01712XXXXXX34"
  txn.gatewayRawResponse = vData;

  // Enrollment auto তৈরি + approve — manual bKash/Nagad screenshot review এর
  // মতো admin-wait লাগবে না, কারণ gateway নিজেই payment validate করে দিয়েছে
  let enrollment = await Enrollment.findOne({
    user: txn.user, course: txn.course, status: { $in: ["pending", "approved"] },
  });
  let newlyApproved = false;
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
    newlyApproved = true;
  } else if (enrollment.status !== "approved") {
    enrollment.status = "approved";
    enrollment.reviewedAt = new Date();
    await enrollment.save();
    newlyApproved = true;
  }
  txn.enrollment = enrollment._id;
  await txn.save();

  if (newlyApproved && txn.couponCode) {
    Coupon.updateOne({ code: txn.couponCode }, { $inc: { usedCount: 1 } })
      .catch((e) => console.error("Coupon usedCount update failed:", e.message));
  }

  const [user, course] = await Promise.all([
    User.findById(txn.user).select("name email"),
    Course.findById(txn.course).select("title"),
  ]);

  if (user?.email) {
    sendPaymentConfirmedEmail(user.email, {
      studentName: user.name, courseTitle: course?.title || "কোর্স", amount: txn.amount,
    }).catch((e) => console.error("Payment confirm email failed:", e.message));

    // Invoice PDF generate kore email e attach kore pathano — best-effort,
    // fail korle main enrollment flow atke thake na
    generateInvoicePdfBuffer({
      invoiceId: txn.tranId,
      studentName: user.name,
      studentEmail: user.email,
      courseTitle: course?.title || "Course",
      amount: txn.amount,
      discountAmount: txn.discountAmount,
      paymentMethod: "SSLCommerz",
      transactionId: txn.bankTranId || txn.tranId,
      date: new Date(),
    })
      .then((pdfBuffer) => sendInvoiceEmail(user.email, {
        studentName: user.name, courseTitle: course?.title || "Course", invoiceId: txn.tranId,
      }, pdfBuffer))
      .catch((e) => console.error("Invoice email failed:", e.message));
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

// ─── STUDENT: নিজের সব payment transaction (history) ────────────────────────
// GET /api/payments/my
const getMyPayments = asyncHandler(async (req, res) => {
  const transactions = await PaymentTransaction.find({ user: req.user._id })
    .populate("course", "title image emoji")
    .sort({ createdAt: -1 })
    .lean();
  res.json(transactions);
});

// ─── STUDENT: invoice আবার download করা (email হারিয়ে ফেললে) ────────────────
// GET /api/payments/invoice/:tranId  → PDF stream
const downloadInvoice = asyncHandler(async (req, res) => {
  const txn = await PaymentTransaction.findOne({ tranId: req.params.tranId, user: req.user._id })
    .populate("course", "title")
    .populate("user", "name email");
  if (!txn || txn.status !== "success") {
    return res.status(404).json({ message: "Invoice পাওয়া যায়নি।" });
  }

  const pdfBuffer = await generateInvoicePdfBuffer({
    invoiceId: txn.tranId,
    studentName: txn.user.name,
    studentEmail: txn.user.email,
    courseTitle: txn.course?.title || "Course",
    amount: txn.amount,
    discountAmount: txn.discountAmount,
    paymentMethod: "SSLCommerz",
    transactionId: txn.bankTranId || txn.tranId,
    date: txn.createdAt,
  });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="invoice-${txn.tranId}.pdf"`,
  });
  res.send(pdfBuffer);
});

// ─── ADMIN: সব payment transaction (success/failed/cancelled/pending সব) —
// manual bKash/Nagad flow-এ admin শুধু approved enrollment দেখে, কিন্তু এখানে
// SSLCommerz-এ কেউ payment শুরু করে fail/cancel করলে সেটাও দেখা যাবে (debug-এর জন্য)
// GET /api/admin/payments?status=success
const getAllPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const transactions = await PaymentTransaction.find(filter)
    .populate("user", "name email")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json(transactions);
});

module.exports = {
  initiatePayment, paymentSuccess, paymentFail, paymentCancel, paymentIPN, getTransactionStatus,
  getGatewaySettings, updateGatewaySettings, getMyPayments, downloadInvoice, getAllPayments,
};
