/**
 * Debug script — student announcement na dekhar karon বের করার জন্য।
 *
 * Run করো (server folder theke, jekhane .env ache):
 *   node scripts/debug-announcements.js student@email.com
 *
 * Ei script dekhabe:
 *  1. Student er shob enrollment (status soho, course id + title)
 *  2. Shob course-scoped announcement (course id + title + audience + isActive)
 *  3. Kon announcement-er course id student er approved enrollment er shathe match kortese
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node scripts/debug-announcements.js student@email.com");
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

  console.log(`\n📢 Course-scoped Announcements:`);
  const announcements = await Announcement.find({ scope: "course" }).populate("course", "title");
  announcements.forEach((a) => {
    console.log(
      `  - title: ${a.title.padEnd(30)} | audience: ${a.audience.padEnd(11)} | isActive: ${String(a.isActive).padEnd(5)} | course: ${(a.course?.title || "❌ MISSING").padEnd(30)} | course._id: ${a.course?._id || a.course}`
    );
  });

  console.log(`\n🔎 Match check (approved enrollments vs announcement course ids):`);
  const approvedIds = enrollments.filter((e) => e.status === "approved").map((e) => String(e.course?._id || e.course));
  if (approvedIds.length === 0) {
    console.log("  ❌ Student has NO approved enrollments at all.");
  }
  announcements.forEach((a) => {
    const aCourseId = String(a.course?._id || a.course);
    const isMatch = approvedIds.includes(aCourseId);
    console.log(`  - "${a.title}" → course._id ${aCourseId} → ${isMatch ? "✅ MATCHES an approved enrollment" : "❌ NO matching approved enrollment"}`);
  });

  // Bonus: check for duplicate courses with the same title (common cause of this exact bug)
  console.log(`\n🧩 Checking for duplicate course titles...`);
  const allCourses = await Course.find({}).select("title");
  const titleCount = {};
  allCourses.forEach((c) => {
    titleCount[c.title] = (titleCount[c.title] || 0) + 1;
  });
  const dupes = Object.entries(titleCount).filter(([, count]) => count > 1);
  if (dupes.length) {
    console.log("  ⚠️  Duplicate course titles found (different _id, same name):");
    dupes.forEach(([title, count]) => console.log(`     - "${title}" appears ${count} times`));
  } else {
    console.log("  ✅ No duplicate course titles.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
