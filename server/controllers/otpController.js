const asyncHandler = require("express-async-handler");
const OTP = require("../models/OTP");
const { sendOTPEmail } = require("../config/mailer");

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/otp/send
// Called after Firebase login — sends OTP to user's email
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  // Delete any existing OTPs for this email
  await OTP.deleteMany({ email: email.toLowerCase() });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await OTP.create({ email: email.toLowerCase(), otp, expiresAt });

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Email send failed:", err.message);
    res.status(500).json({ message: "Failed to send OTP email. Check Gmail config." });
  }
});

// POST /api/otp/verify
// Verify OTP — on success returns true so frontend can proceed to firebase-sync
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

  const record = await OTP.findOne({ email: email.toLowerCase() });

  if (!record) return res.status(400).json({ message: "OTP not found or expired. Request a new one." });

  if (new Date() > record.expiresAt) {
    await OTP.deleteOne({ _id: record._id });
    return res.status(400).json({ message: "OTP expired. Request a new one." });
  }

  if (record.otp !== otp.toString()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP valid — delete it (one-time use)
  await OTP.deleteOne({ _id: record._id });

  res.json({ message: "OTP verified", verified: true });
});

module.exports = { sendOTP, verifyOTP };
