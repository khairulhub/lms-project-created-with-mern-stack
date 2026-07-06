const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const path = require("path");
const https = require("https");
const http = require("http");

const Certificate = require("../models/Certificate");
const Enrollment = require("../models/Enrollment");
const CourseProgress = require("../models/CourseProgress");
const CourseDetail = require("../models/CourseDetail");
const Course = require("../models/Course");
const CourseHeroSection = require("../models/CourseHeroSection");
const SiteConfig = require("../models/SiteConfig");

// ── Mixed Bengali/English text rendering ──────────────────────────────────
const BENGALI_RANGE = /[\u0980-\u09FF]/;

const splitIntoScriptRuns = (text) => {
  const runs = [];
  let current = "";
  let currentIsBengali = null;
  for (const ch of text) {
    const isBengali = BENGALI_RANGE.test(ch);
    const belongsToCurrent = currentIsBengali === null || isBengali === currentIsBengali || !/[a-zA-Z\u0980-\u09FF]/.test(ch);
    if (belongsToCurrent) {
      current += ch;
      if (currentIsBengali === null && /[a-zA-Z\u0980-\u09FF]/.test(ch)) currentIsBengali = isBengali;
    } else {
      runs.push({ text: current, bengali: currentIsBengali });
      current = ch;
      currentIsBengali = isBengali;
    }
  }
  if (current) runs.push({ text: current, bengali: currentIsBengali });
  return runs;
};

const drawMixedText = (doc, text, { x, y, width, fontSize, color, bold = false, align = "center" }) => {
  const bengaliFont = bold ? "Bengali-Bold" : "Bengali";
  const latinFont = bold ? "Latin-Bold" : "Latin";
  const runs = splitIntoScriptRuns(text);
  doc.fontSize(fontSize).fillColor(color);
  const widths = runs.map((run) => {
    doc.font(run.bengali ? bengaliFont : latinFont);
    return doc.widthOfString(run.text);
  });
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  let startX;
  if (align === "center") startX = x + (width - totalWidth) / 2;
  else if (align === "right") startX = x + width - totalWidth;
  else startX = x;
  let cursorX = startX;
  runs.forEach((run, i) => {
    doc.font(run.bengali ? bengaliFont : latinFont).text(run.text, cursorX, y, { lineBreak: false });
    cursorX += widths[i];
  });
};

const FONT_REGULAR = path.join(__dirname, "..", "assets", "fonts", "NotoSerifBengali-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "..", "assets", "fonts", "NotoSerifBengali-Bold.ttf");

// ── imgBB URL থেকে image buffer ডাউনলোড করে ─────────────────────────────
// logo URL থেকে raw image bytes নিয়ে pdfkit-এ embed করার জন্য।
// timeout 5s — বেশি দেরি হলে null রিটার্ন করে, fallback text-logo দেখাবে।
const fetchImageBuffer = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => resolve(null));
    }).on("error", () => resolve(null))
      .on("timeout", () => resolve(null));
  });

const countTotalLectures = async (courseId) => {
  const detail = await CourseDetail.findOne({ course: courseId }).select("curriculum").lean();
  if (!detail?.curriculum?.length) return 0;
  return detail.curriculum.reduce((sum, section) => sum + (section.lectures?.length || 0), 0);
};

const checkEligibility = async (userId, courseId) => {
  const enrollment = await Enrollment.findOne({ user: userId, course: courseId, status: "approved" });
  if (!enrollment) return { eligible: false, reason: "not_enrolled" };
  const totalLectures = await countTotalLectures(courseId);
  if (totalLectures === 0) return { eligible: false, reason: "no_curriculum" };
  const progress = await CourseProgress.findOne({ user: userId, course: courseId });
  const doneCount = progress?.completedLectures?.length || 0;
  if (doneCount < totalLectures) return { eligible: false, reason: "incomplete", doneCount, totalLectures };
  return { eligible: true, doneCount, totalLectures };
};

const getEligibility = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(courseId))
    return res.status(400).json({ message: "Invalid course id" });
  const result = await checkEligibility(req.user._id, courseId);
  const existing = await Certificate.findOne({ user: req.user._id, course: courseId }).select("certificateId issuedAt");
  res.json({ ...result, certificateId: existing?.certificateId || null, issuedAt: existing?.issuedAt || null });
});

const buildCertificateData = async (userId, courseId, userDoc) => {
  const course = await Course.findById(courseId).select("title");
  const hero = await CourseHeroSection.findOne().select("instructorName instructorTitle");
  return {
    studentName: userDoc.name,
    courseTitle: course?.title || "Course",
    instructorName: hero?.instructorName || "Programming Hero",
    instructorTitle: hero?.instructorTitle || "Lead Instructor",
  };
};

// ── Certificate PDF — Programming Hero style ──────────────────────────────
// siteConfig থেকে siteName + logo আসে (DB-driven)।
// logoBuffer null হলে text-based "P" circle fallback দেখায়।
const renderCertificatePdf = async (res, {
  certificateId, studentName, courseTitle,
  instructorName, instructorTitle, issuedAt,
  siteName, logoBuffer, showLogoImage,
}) => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="certificate-${certificateId}.pdf"`);
  doc.pipe(res);

  doc.registerFont("Bengali", FONT_REGULAR);
  doc.registerFont("Bengali-Bold", FONT_BOLD);
  doc.registerFont("Latin", "Helvetica");
  doc.registerFont("Latin-Bold", "Helvetica-Bold");
  doc.registerFont("Latin-Oblique", "Helvetica-Oblique");

  const { width, height } = doc.page;
  const cx = width / 2;

  // ── White background ──────────────────────────────────────────────────
  doc.rect(0, 0, width, height).fill("#ffffff");

  // ── Subtle diagonal watermark ─────────────────────────────────────────
  doc.save().opacity(0.03);
  for (let i = -height; i < width + height; i += 30)
    doc.moveTo(i, 0).lineTo(i + height, height).lineWidth(12).strokeColor("#888888").stroke();
  doc.restore();

  // ── Gold border frame ─────────────────────────────────────────────────
  doc.lineWidth(4).strokeColor("#f59e0b").rect(18, 18, width - 36, height - 36).stroke();

  // ── Decorative corner blobs ───────────────────────────────────────────
  // Top-left orange circle
  doc.circle(0, 0, 55).fill("#fb923c").opacity(0.88);
  doc.opacity(1);

  // Bottom-left green circle
  doc.circle(0, height, 50).fill("#22c55e").opacity(0.72);
  doc.opacity(1);

  // Top-right: 3 vertical pills (blue, pink, orange)
  doc.roundedRect(width - 140, 22, 28, 90, 14).fill("#3b82f6").opacity(0.9);
  doc.opacity(1);
  doc.roundedRect(width - 105, 22, 28, 90, 14).fill("#ec4899");
  doc.roundedRect(width - 70, 22, 28, 90, 14).fill("#f97316").opacity(0.85);
  doc.opacity(1);

  // Bottom-left pills
  doc.roundedRect(25, height - 108, 75, 22, 11).fill("#a855f7");
  doc.roundedRect(25, height - 80, 75, 22, 11).fill("#3b82f6").opacity(0.9);
  doc.opacity(1);

  // Bottom-right pills
  doc.roundedRect(width - 102, height - 108, 75, 22, 11).fill("#ec4899").opacity(0.85);
  doc.opacity(1);
  doc.roundedRect(width - 102, height - 80, 75, 22, 11).fill("#14b8a6");

  // ── Logo area — top center ────────────────────────────────────────────
  const logoY = 52;
  const logoSize = 52; // bounding box for logo image

  if (showLogoImage && logoBuffer) {
    // imgBB থেকে আনা real logo image embed করো
    // pdfkit image() — center X এর জন্য x = cx - logoSize/2
    try {
      doc.image(logoBuffer, cx - logoSize / 2, logoY, {
        width: logoSize,
        height: logoSize,
        fit: [logoSize, logoSize],
        align: "center",
        valign: "center",
      });
    } catch (_) {
      // image corrupt হলে fallback circle
      drawLogoFallback(doc, cx, logoY + logoSize / 2);
    }
  } else {
    // Text-based fallback: purple circle + first letter of siteName
    drawLogoFallback(doc, cx, logoY + logoSize / 2, siteName);
  }

  // Company / site name below logo — DB থেকে আসা siteName
  const displayName = siteName || instructorName || "LMS Platform";
  doc.font("Latin-Bold").fontSize(10).fillColor("#1e1b4b");
  const nameW = doc.widthOfString(displayName);
  doc.text(displayName, cx - nameW / 2, logoY + logoSize + 12, { lineBreak: false });

  // ── CERTIFICATE OF ACHIEVEMENT ────────────────────────────────────────
  doc.font("Latin-Bold").fontSize(36).fillColor("#111111");
  doc.text("CERTIFICATE OF ACHIEVEMENT", 0, 128, { width, align: "center", lineBreak: false });

  // ── "is awarded to" ───────────────────────────────────────────────────
  doc.font("Latin").fontSize(14).fillColor("#374151");
  doc.text("is awarded to", 0, 176, { width, align: "center", lineBreak: false });

  // ── Student name — italic ─────────────────────────────────────────────
  doc.font("Latin-Oblique").fontSize(34).fillColor("#1a1a2e");
  doc.text(studentName, 0, 200, { width, align: "center", lineBreak: false });

  // Dotted underline below name
  const nameLineW = Math.min(doc.widthOfString(studentName) + 40, width - 180);
  const nameLineY = 244;
  doc.save()
    .dash(3, { space: 5 })
    .moveTo(cx - nameLineW / 2, nameLineY)
    .lineTo(cx + nameLineW / 2, nameLineY)
    .lineWidth(1).strokeColor("#9ca3af").stroke()
    .restore();

  // ── Course info ───────────────────────────────────────────────────────
  doc.font("Latin").fontSize(12).fillColor("#374151");
  doc.text(
    "for the dedication and hard work that resulted in the successful culmination of the",
    80, 258, { width: width - 160, align: "center", lineBreak: false }
  );
  doc.font("Latin-Bold").fontSize(13).fillColor("#111111");
  doc.text(courseTitle + " course.", 80, 278, { width: width - 160, align: "center", lineBreak: false });

  doc.font("Latin").fontSize(10.5).fillColor("#374151");
  doc.text(
    `${studentName} has completed a rigorous curriculum with dedication and performed excellently.`,
    120, 304, { width: width - 240, align: "center", lineBreak: false }
  );

  doc.font("Latin").fontSize(11).fillColor("#374151");
  doc.text("You did it, and we're proud of you!", 0, 330, { width, align: "center", lineBreak: false });

  // ── Medal badge — bottom center ───────────────────────────────────────
  const medalX = cx;
  const medalY = height - 110;

  // Ribbon (purple v-shape below circle)
  doc.polygon([medalX - 14, medalY + 20], [medalX, medalY + 40], [medalX + 14, medalY + 20]).fill("#7c3aed");
  doc.polygon([medalX - 14, medalY + 20], [medalX - 5, medalY + 30], [medalX - 14, medalY + 40]).fill("#6d28d9");
  doc.polygon([medalX + 14, medalY + 20], [medalX + 5, medalY + 30], [medalX + 14, medalY + 40]).fill("#6d28d9");

  // Circle — gold
  doc.circle(medalX, medalY, 24).fill("#f59e0b");
  doc.circle(medalX, medalY, 17).fill("#fbbf24");

  // 5-pointed star drawn geometrically — no text glyph
  const starPts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 11 : 5;
    starPts.push([medalX + r * Math.cos(angle), medalY + r * Math.sin(angle)]);
  }
  doc.polygon(...starPts).fill("#92400e");

  // ── Footer ────────────────────────────────────────────────────────────
  // medalY bottom edge ~ height-70, so footerY starts at height-62
  const footerY = height - 62;
  const dateStr = new Date(issuedAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // Cert ID — bottom left
  doc.font("Latin-Bold").fontSize(10).fillColor("#111111");
  doc.text(certificateId, 55, footerY, { lineBreak: false });

  // Signature line + instructor name + title — bottom right
  // Line sits ABOVE the name text
  doc.moveTo(width - 255, footerY - 16).lineTo(width - 55, footerY - 16)
    .lineWidth(1).strokeColor("#374151").stroke();
  doc.font("Latin-Bold").fontSize(11).fillColor("#111111");
  doc.text(instructorName, width - 265, footerY - 12, { width: 210, align: "center", lineBreak: false });
  doc.font("Latin").fontSize(9).fillColor("#6b7280");
  doc.text(instructorTitle, width - 265, footerY + 4, { width: 210, align: "center", lineBreak: false });
  doc.font("Latin").fontSize(8.5).fillColor("#6b7280");
  doc.text(`Issued: ${dateStr}`, width - 265, footerY + 18, { width: 210, align: "center", lineBreak: false });

  // Verify URL — very bottom center
  doc.font("Latin").fontSize(7.5).fillColor("#9ca3af");
  doc.text(
    `Verify at: /verify-certificate/${certificateId}`,
    0, height - 18, { width, align: "center", lineBreak: false }
  );

  doc.end();
};

// Purple circle + first-letter fallback when no logo image available
const drawLogoFallback = (doc, cx, cy, siteName = "") => {
  const r = 26;
  doc.circle(cx, cy, r + 4).fill("#e9d5ff").opacity(0.5);
  doc.opacity(1);
  doc.circle(cx, cy, r).fill("#7c3aed");
  const letter = (siteName || "P")[0].toUpperCase();
  doc.font("Latin-Bold").fontSize(22).fillColor("#ffffff");
  doc.text(letter, cx - 7, cy - 11, { lineBreak: false });
};

// GET /api/certificates/:courseId — student certificate ডাউনলোড
const getOrIssueCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(courseId))
    return res.status(400).json({ message: "Invalid course id" });

  let certificate = await Certificate.findOne({ user: req.user._id, course: courseId });

  if (!certificate) {
    const eligibility = await checkEligibility(req.user._id, courseId);
    if (!eligibility.eligible) {
      const messages = {
        not_enrolled: "তুমি এই কোর্সে enrolled নেই অথবা এখনো approve হয়নি।",
        no_curriculum: "এই কোর্সের curriculum এখনো প্রস্তুত হয়নি।",
        incomplete: `কোর্স এখনো শেষ হয়নি (${eligibility.doneCount}/${eligibility.totalLectures} lecture সম্পন্ন)।`,
      };
      return res.status(403).json({ message: messages[eligibility.reason] || "Certificate এর জন্য এখনো eligible নও।" });
    }

    const data = await buildCertificateData(req.user._id, courseId, req.user);
    try {
      certificate = await Certificate.create({
        certificateId: Certificate.generateCertificateId(),
        user: req.user._id,
        course: courseId,
        studentName: data.studentName,
        courseTitle: data.courseTitle,
      });
    } catch (err) {
      if (err.code === 11000) {
        certificate = await Certificate.findOne({ user: req.user._id, course: courseId });
      } else {
        throw err;
      }
    }
  }

  // DB থেকে instructor + site config টেনে আনো প্রতিবার render-এর আগে
  const [hero, siteConfig] = await Promise.all([
    CourseHeroSection.findOne().select("instructorName instructorTitle"),
    SiteConfig.findOne().select("siteName logoUrl logoText showLogoImage"),
  ]);

  // logo image URL থাকলে buffer ডাউনলোড করো — না হলে null (fallback দেখাবে)
  const logoUrl = siteConfig?.showLogoImage && siteConfig?.logoUrl ? siteConfig.logoUrl : null;
  const logoBuffer = await fetchImageBuffer(logoUrl);

  await renderCertificatePdf(res, {
    certificateId: certificate.certificateId,
    studentName: certificate.studentName,
    courseTitle: certificate.courseTitle,
    instructorName: hero?.instructorName || "Programming Hero",
    instructorTitle: hero?.instructorTitle || "Lead Instructor",
    issuedAt: certificate.issuedAt,
    siteName: siteConfig?.siteName || siteConfig?.logoText || "LMS Platform",
    logoBuffer,
    showLogoImage: !!(siteConfig?.showLogoImage && logoBuffer),
  });
});

// GET /api/certificates/verify/:certificateId — PUBLIC verify
const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.certificateId });
  if (!certificate)
    return res.status(404).json({ valid: false, message: "এই certificate ID-টা খুঁজে পাওয়া যায়নি।" });
  res.json({
    valid: true,
    studentName: certificate.studentName,
    courseTitle: certificate.courseTitle,
    issuedAt: certificate.issuedAt,
    certificateId: certificate.certificateId,
  });
});

module.exports = { getEligibility, getOrIssueCertificate, verifyCertificate };
