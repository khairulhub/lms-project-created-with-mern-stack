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

// ── Generic email sender — বাকি সব notification (enrollment, ticket, cert)
// এই একটা function-ই ব্যবহার করবে। Wrap করা try/catch caller-এ থাকবে যাতে
// email fail হলেও মূল action (approve/reply ইত্যাদি) fail না করে।
const sendEmail = async (toEmail, subject, bodyHtml) => {
  const mailOptions = {
    from: `"LMS Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 16px;">
        ${bodyHtml}
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">
          এই ইমেইলটা LMS Platform থেকে automatically পাঠানো হয়েছে।
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ── Ready-made notification templates (সব sendEmail এর উপরে বসানো) ─────────

const sendEnrollmentApprovedEmail = (toEmail, { studentName, courseTitle }) =>
  sendEmail(
    toEmail,
    `🎉 তোমার "${courseTitle}" কোর্সে ভর্তি Approved হয়েছে!`,
    `
      <h2 style="color: #22d3ee; margin-bottom: 8px;">অভিনন্দন, ${studentName}!</h2>
      <p style="color: #94a3b8;">তোমার <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্সে ভর্তির request approve হয়েছে।</p>
      <p style="color: #94a3b8;">এখন Dashboard-এ গিয়ে lecture দেখা শুরু করতে পারো।</p>
    `
  );

const sendEnrollmentRejectedEmail = (toEmail, { studentName, courseTitle, reason }) =>
  sendEmail(
    toEmail,
    `তোমার "${courseTitle}" কোর্সের ভর্তি request নিয়ে একটা আপডেট`,
    `
      <h2 style="color: #f87171; margin-bottom: 8px;">Enrollment Request Rejected</h2>
      <p style="color: #94a3b8;">${studentName}, তোমার <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্সের ভর্তি request-টা admin approve করতে পারেননি।</p>
      ${reason ? `<p style="color:#94a3b8;">কারণ: <span style="color:#f1f5f9;">${reason}</span></p>` : ""}
      <p style="color: #94a3b8;">সমস্যা মনে হলে Helpdesk থেকে ticket খুলে জানাতে পারো।</p>
    `
  );

const sendTicketReplyEmail = (toEmail, { studentName, subject }) =>
  sendEmail(
    toEmail,
    `তোমার Helpdesk ticket "${subject}" এ নতুন রিপ্লাই এসেছে`,
    `
      <h2 style="color: #22d3ee; margin-bottom: 8px;">নতুন রিপ্লাই এসেছে</h2>
      <p style="color: #94a3b8;">${studentName}, তোমার <strong style="color:#f1f5f9;">${subject}</strong> ticket-এ admin/instructor রিপ্লাই দিয়েছে।</p>
      <p style="color: #94a3b8;">Helpdesk-এ গিয়ে দেখে নাও।</p>
    `
  );

const sendCertificateIssuedEmail = (toEmail, { studentName, courseTitle }) =>
  sendEmail(
    toEmail,
    `🏅 তোমার "${courseTitle}" কোর্সের Certificate রেডি!`,
    `
      <h2 style="color: #fbbf24; margin-bottom: 8px;">অভিনন্দন, ${studentName}!</h2>
      <p style="color: #94a3b8;">তুমি <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্স সম্পূর্ণ করেছো এবং certificate ইস্যু হয়ে গেছে।</p>
      <p style="color: #94a3b8;">Dashboard থেকে certificate download করে নাও।</p>
    `
  );

const sendPaymentConfirmedEmail = (toEmail, { studentName, courseTitle, amount }) =>
  sendEmail(
    toEmail,
    `✅ Payment সফল হয়েছে — "${courseTitle}"`,
    `
      <h2 style="color: #22c55e; margin-bottom: 8px;">Payment Confirmed</h2>
      <p style="color: #94a3b8;">${studentName}, তোমার <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্সের জন্য ৳${amount} পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং তুমি এখন enrolled।</p>
      <p style="color: #94a3b8;">Dashboard-এ গিয়ে এখনই শুরু করে দাও।</p>
    `
  );

// ── Invoice email — PDF buffer attach kore pathano hoy, payment/enrollment
// confirm howar por (kono blocking effect nei — fail korle log hoy, action
// atke thake na, caller-e try/catch/.catch() diye call kora hoy) ──────────
const sendInvoiceEmail = async (toEmail, { studentName, courseTitle, invoiceId }, pdfBuffer) => {
  const mailOptions = {
    from: `"LMS Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🧾 তোমার Invoice — ${courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 16px;">
        <h2 style="color: #22d3ee; margin-bottom: 8px;">Payment Invoice</h2>
        <p style="color: #94a3b8;">${studentName}, তোমার <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্সের পেমেন্ট invoice এই ইমেইলে attach করা আছে (Invoice ID: ${invoiceId})।</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">
          এই ইমেইলটা LMS Platform থেকে automatically পাঠানো হয়েছে।
        </p>
      </div>
    `,
    attachments: pdfBuffer
      ? [{ filename: `invoice-${invoiceId}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
      : [],
  };
  await transporter.sendMail(mailOptions);
};

const sendEnrollmentRevokedEmail = (toEmail, { studentName, courseTitle, reason, refunded }) =>
  sendEmail(
    toEmail,
    `তোমার "${courseTitle}" কোর্সের access বন্ধ করা হয়েছে`,
    `
      <h2 style="color: #f87171; margin-bottom: 8px;">Enrollment Access Revoked</h2>
      <p style="color: #94a3b8;">${studentName}, তোমার <strong style="color:#f1f5f9;">${courseTitle}</strong> কোর্সের access admin বন্ধ করে দিয়েছেন।</p>
      ${reason ? `<p style="color:#94a3b8;">কারণ: <span style="color:#f1f5f9;">${reason}</span></p>` : ""}
      ${refunded ? `<p style="color:#4ade80;">তোমার টাকা refund করা হয়েছে।</p>` : ""}
      <p style="color: #94a3b8;">প্রশ্ন থাকলে Helpdesk থেকে ticket খুলে জানাতে পারো।</p>
    `
  );

module.exports = {
  sendOTPEmail,
  sendEmail,
  sendEnrollmentApprovedEmail,
  sendEnrollmentRejectedEmail,
  sendEnrollmentRevokedEmail,
  sendTicketReplyEmail,
  sendCertificateIssuedEmail,
  sendPaymentConfirmedEmail,
  sendInvoiceEmail,
};
