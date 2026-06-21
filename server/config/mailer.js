const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,   // your gmail address
    pass: process.env.GMAIL_PASS,   // gmail app password (not regular password)
  },
});

// Send OTP email
const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"LMS Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Login OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 16px;">
        <h2 style="color: #22d3ee; margin-bottom: 8px;">Login Verification</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">Use the OTP below to complete your login. It expires in <strong style="color: #f1f5f9;">5 minutes</strong>.</p>
        
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">Your OTP Code</p>
          <h1 style="color: #22d3ee; font-size: 48px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h1>
        </div>

        <p style="color: #64748b; font-size: 12px;">If you didn't request this, please ignore this email. Do not share this code with anyone.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
