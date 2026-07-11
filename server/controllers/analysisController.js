const asyncHandler = require("express-async-handler");
const Enrollment = require("../models/Enrollment");
const CourseProgress = require("../models/CourseProgress");
const CourseDetail = require("../models/CourseDetail");
const Certificate = require("../models/Certificate");
const QuizAttempt = require("../models/QuizAttempt");
const AssignmentSubmission = require("../models/AssignmentSubmission");

// ── Student: নিজের সব approved course মিলিয়ে performance summary + প্রতি
// course এর breakdown (progress %, quiz avg, assignment avg) ──────────────
// GET /api/analysis/me
const getMyAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const enrollments = await Enrollment.find({ user: userId, status: "approved" })
    .populate("course", "title image emoji")
    .sort({ createdAt: -1 })
    .lean();

  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);

  const [progresses, courseDetails, certificates, quizAttempts, submissions] = await Promise.all([
    CourseProgress.find({ user: userId, course: { $in: courseIds } }).lean(),
    CourseDetail.find({ course: { $in: courseIds } }).select("course curriculum").lean(),
    Certificate.find({ user: userId, course: { $in: courseIds } }).select("course issuedAt certificateId").lean(),
    QuizAttempt.find({ user: userId, course: { $in: courseIds } }).lean(),
    AssignmentSubmission.find({ user: userId, course: { $in: courseIds }, mark: { $ne: null } }).lean(),
  ]);

  const progressByCourse = new Map(progresses.map((p) => [String(p.course), p]));
  const detailByCourse = new Map(courseDetails.map((d) => [String(d.course), d]));
  const certByCourse = new Map(certificates.map((c) => [String(c.course), c]));

  // quiz: প্রতি course এ, প্রতি sectionId এর best score নিয়ে course-average
  const quizByCourse = new Map();
  for (const a of quizAttempts) {
    const key = String(a.course);
    if (!quizByCourse.has(key)) quizByCourse.set(key, new Map());
    const bySection = quizByCourse.get(key);
    const sKey = String(a.sectionId);
    if (!bySection.has(sKey) || bySection.get(sKey) < a.score) bySection.set(sKey, a.score);
  }

  // assignment: প্রতি course এ mark গুলোর average
  const asgnByCourse = new Map();
  for (const s of submissions) {
    const key = String(s.course);
    if (!asgnByCourse.has(key)) asgnByCourse.set(key, []);
    asgnByCourse.get(key).push(s.mark);
  }

  const courseBreakdown = enrollments
    .filter((e) => e.course)
    .map((e) => {
      const cId = String(e.course._id);
      const detail = detailByCourse.get(cId);
      const totalLectures = (detail?.curriculum || []).reduce(
        (sum, sec) => sum + (sec.lectures?.length || 0),
        0
      );
      const completedCount = progressByCourse.get(cId)?.completedLectures?.length || 0;
      const progressPercent = totalLectures > 0
        ? Math.round((completedCount / totalLectures) * 100)
        : 0;

      const quizScores = [...(quizByCourse.get(cId)?.values() || [])];
      const quizAvg = quizScores.length
        ? Math.round((quizScores.reduce((a, b) => a + b, 0) / quizScores.length) * 10) / 10
        : null;

      const asgnMarks = asgnByCourse.get(cId) || [];
      const asgnAvg = asgnMarks.length
        ? Math.round((asgnMarks.reduce((a, b) => a + b, 0) / asgnMarks.length) * 10) / 10
        : null;

      return {
        courseId: cId,
        title: e.course.title,
        image: e.course.image,
        emoji: e.course.emoji,
        totalLectures,
        completedCount,
        progressPercent,
        quizAvg,
        quizAttempted: quizScores.length,
        asgnAvg,
        asgnGraded: asgnMarks.length,
        certificateEarned: !!certByCourse.get(cId),
        certificateId: certByCourse.get(cId)?.certificateId || null,
      };
    });

  const allQuizScores = courseBreakdown.filter((c) => c.quizAvg !== null).map((c) => c.quizAvg);
  const allAsgnAvgs = courseBreakdown.filter((c) => c.asgnAvg !== null).map((c) => c.asgnAvg);
  const avgProgress = courseBreakdown.length
    ? Math.round(courseBreakdown.reduce((a, c) => a + c.progressPercent, 0) / courseBreakdown.length)
    : 0;

  res.json({
    summary: {
      totalEnrolled: courseBreakdown.length,
      totalCertificates: certificates.length,
      avgProgress,
      avgQuizScore: allQuizScores.length
        ? Math.round((allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length) * 10) / 10
        : null,
      avgAssignmentMark: allAsgnAvgs.length
        ? Math.round((allAsgnAvgs.reduce((a, b) => a + b, 0) / allAsgnAvgs.length) * 10) / 10
        : null,
    },
    courses: courseBreakdown,
  });
});

module.exports = { getMyAnalysis };
