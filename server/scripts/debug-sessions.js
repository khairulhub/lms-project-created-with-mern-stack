/**
 * Debug script — student/instructor session na dekhar karon বের করার জন্য।
 *
 * Run করো (server folder theke, jekhane .env ache):
 *   node scripts/debug-sessions.js student@email.com
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const ConceptualSession = require("../models/ConceptualSession");
const Course = require("../models/Course");

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node scripts/debug-sessions.js student@email.com");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to DB\n");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log(`❌ No user found with email: ${email}`);
    return process.exit(1);
  }
  console.log(`👤 User: ${user.name} | role: ${user.role} | _id: ${user._id}\n`);

  const enrollments = await Enrollment.find({ user: user._id }).populate("course", "title");
  console.log(`📚 Enrollments (${enrollments.length}):`);
  enrollments.forEach((e) => {
    console.log(
      `  - status: ${e.status.padEnd(9)} | course: ${(e.course?.title || "❌ COURSE DELETED/MISSING").padEnd(30)} | course._id: ${e.course?._id || e.course}`
    );
  });

  console.log(`\n🎥 All Conceptual Sessions:`);
  const sessions = await ConceptualSession.find({}).populate("course", "title").populate("createdBy", "name role");
  if (sessions.length === 0) console.log("  (কোনো session-ই তৈরি হয়নি)");
  sessions.forEach((s) => {
    console.log(
      `  - title: ${s.title.padEnd(28)} | scope: ${s.scope.padEnd(7)} | status: ${s.status.padEnd(9)} | by: ${(s.createdBy?.name || "?").padEnd(15)} (${s.createdByRole}) | course: ${(s.course?.title || (s.scope === "global" ? "— (global)" : "❌ MISSING")).padEnd(30)} | course._id: ${s.course?._id || s.course || "-"}`
    );
  });

  console.log(`\n🔎 Match check (approved enrollments vs course-scoped session course ids):`);
  const approvedIds = enrollments.filter((e) => e.status === "approved").map((e) => String(e.course?._id || e.course));
  if (approvedIds.length === 0) {
    console.log("  ❌ Student has NO approved enrollments at all.");
  }
  const courseSessions = sessions.filter((s) => s.scope === "course");
  if (courseSessions.length === 0) {
    console.log("  (কোনো course-scoped session নেই — শুধু global session থাকলে সেগুলো সবার কাছেই দেখানোর কথা)");
  }
  courseSessions.forEach((s) => {
    const sCourseId = String(s.course?._id || s.course);
    const isMatch = approvedIds.includes(sCourseId);
    console.log(`  - "${s.title}" → course._id ${sCourseId} → ${isMatch ? "✅ MATCHES an approved enrollment" : "❌ NO matching approved enrollment"}`);
  });

  const globalSessions = sessions.filter((s) => s.scope === "global");
  if (globalSessions.length > 0) {
    console.log(`\n🌍 Global sessions (এইগুলো সব student-ই দেখার কথা, enrollment লাগে না):`);
    globalSessions.forEach((s) => console.log(`  - "${s.title}" | status: ${s.status}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
