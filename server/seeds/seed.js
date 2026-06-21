const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Blog = require("../models/Blog");
const NavMenu = require("../models/NavMenu");
const SiteConfig = require("../models/SiteConfig");
const CourseHeroSection = require("../models/CourseHeroSection");
const CoursePaymentSettings = require("../models/CoursePaymentSettings");
const PaymentMethod = require("../models/PaymentMethod");

// ── HELPERS ──────────────────────────────────────────────────────────────────
// Upsert one document by a unique key, without touching it if it already exists.
// Returns the existing-or-newly-created document.
async function upsertOne(Model, filter, data, label) {
  const existing = await Model.findOne(filter);
  if (existing) return existing;
  const created = await Model.create(data);
  console.log(`  + created ${label}`);
  return created;
}

// Upsert a list of documents by a unique key. Only inserts the ones missing;
// existing ones are left untouched. Returns ALL docs (existing + new) in order.
async function upsertMany(Model, items, keyFn, label) {
  const docs = [];
  let createdCount = 0;
  for (const item of items) {
    const filter = keyFn(item);
    const existing = await Model.findOne(filter);
    if (existing) {
      docs.push(existing);
    } else {
      const created = await Model.create(item);
      docs.push(created);
      createdCount++;
    }
  }
  console.log(`  + ${label}: ${createdCount} created, ${items.length - createdCount} already existed`);
  return docs;
}

// Main entry point. Does NOT connect/disconnect mongoose itself — the caller
// (server startup, or the standalone CLI block at the bottom of this file)
// is responsible for the connection. This lets it be called safely from
// index.js on every server boot: each section checks itself and only
// inserts what's missing, so if all seed data already exists, this is a
// fast no-op (a handful of findOne checks, nothing written).
const seedDatabase = async () => {
  console.log("🌱 Checking seed data (per-section, auto-skips what already exists)...\n");

  // ── USERS ──────────────────────────────────────────────────────────────────
  // NOTE: These users use firebaseUid placeholder.
  // For real Firebase auth, you'd create them in Firebase Console and use real UIDs.
  console.log("👥 Users");
  const users = await upsertMany(
    User,
    [
      {
        name: "Admin User",
        email: "admin@mernstarter.com",
        firebaseUid: "seed-admin-uid-001",
        role: "admin",
        designation: "Platform Administrator",
        bio: "Managing the entire platform and keeping things running smoothly.",
        profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        isActive: true,
      },
      {
        name: "Instructor Rahim",
        email: "instructor@mernstarter.com",
        firebaseUid: "seed-instructor-uid-002",
        role: "instructor",
        designation: "Senior Web Developer",
        bio: "10+ years of experience in full stack web development. Teaching MERN stack.",
        profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=instructor",
        isActive: true,
      },
      {
        name: "Regular Karim",
        email: "user@mernstarter.com",
        firebaseUid: "seed-user-uid-003",
        role: "user",
        designation: "Junior Developer",
        bio: "Learning web development. Excited to grow!",
        profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        isActive: true,
      },
    ],
    (u) => ({ email: u.email }), // unique key
    "users"
  );

  const adminUser = users.find((u) => u.role === "admin");
  const instructorUser = users.find((u) => u.role === "instructor");

  // ── CATEGORIES ─────────────────────────────────────────────────────────────
  console.log("📁 Categories");
  const categories = await upsertMany(
    Category,
    [
      { name: "MERN Stack", slug: "mern-stack", icon: "🌐", description: "MongoDB, Express, React and Node.js দিয়ে ফুল স্ট্যাক ওয়েব ডেভেলপমেন্ট", createdBy: adminUser._id },
      { name: "PHP/Laravel", slug: "php-laravel", icon: "🐘", description: "PHP এবং Laravel framework দিয়ে ব্যাকএন্ড ও ওয়েব অ্যাপ ডেভেলপমেন্ট", createdBy: adminUser._id },
      { name: "Networking", slug: "networking", icon: "🔌", description: "Cisco, MikroTik সহ নেটওয়ার্ক ইঞ্জিনিয়ারিং", createdBy: adminUser._id },
    ],
    (c) => ({ slug: c.slug }), // unique key
    "categories"
  );

  const webCat = categories.find((c) => c.slug === "web-development");
  const backendCat = categories.find((c) => c.slug === "backend");

  // ── BLOGS ──────────────────────────────────────────────────────────────────
  console.log("📝 Blogs");
  await upsertMany(
    Blog,
    [
      {
        title: "Getting Started with MERN Stack",
        slug: "getting-started-mern-stack",
        excerpt: "A complete beginner guide to building full stack apps with MongoDB, Express, React, and Node.js",
        content: "<h2>Introduction</h2><p>The MERN stack is one of the most popular full stack JavaScript frameworks. In this guide we'll walk through building your first MERN application from scratch.</p><h2>What is MERN?</h2><p>MERN stands for MongoDB, Express.js, React.js, and Node.js. Together they form a powerful, end-to-end JavaScript development stack.</p>",
        coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
        category: webCat._id,
        author: instructorUser._id,
        isPublished: true,
        publishedAt: new Date(),
        tags: ["mern", "react", "nodejs", "beginner"],
      },
      {
        title: "REST API Design Best Practices",
        slug: "rest-api-design-best-practices",
        excerpt: "Learn how to design clean, scalable, and developer-friendly REST APIs",
        content: "<h2>REST API Basics</h2><p>A well-designed REST API is the backbone of any modern web application. Let's explore the key principles that make APIs great.</p><h2>Use Proper HTTP Methods</h2><p>GET for fetching, POST for creating, PUT/PATCH for updating, DELETE for removing resources.</p>",
        coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
        category: backendCat._id,
        author: instructorUser._id,
        isPublished: true,
        publishedAt: new Date(Date.now() - 86400000),
        tags: ["api", "rest", "backend", "nodejs"],
      },
    ],
    (b) => ({ slug: b.slug }), // unique key
    "blogs"
  );

  // ── NAV MENUS ──────────────────────────────────────────────────────────────
  console.log("🧭 Nav menus");
  await upsertMany(
    NavMenu,
    [
      { label: "Course Details", path: "/courses", order: 0, isActive: true, isDefault: true },
      { label: "Category", path: "/categories", order: 1, isActive: true, isDefault: true },
      { label: "Blog", path: "/blogs", order: 2, isActive: true, isDefault: true },
      { label: "Students Feedback", path: "/feedback", order: 3, isActive: true, isDefault: true },
    ],
    (m) => ({ label: m.label }), // unique key
    "nav menus"
  );

  // ── SITE CONFIG (singleton) ──────────────────────────────────────────────────
  console.log("⚙️  Site config");
  await upsertOne(
    SiteConfig,
    {}, // singleton — match any existing doc, there should only ever be one
    {
      siteName: "LMS Platform",
      logoText: "LMS",
      logoUrl: "",
      showLogoImage: false,
      enrollUrl: "/enroll",
    },
    "site config"
  );

  // ── COURSE DETAILS → HERO SECTION (singleton) ───────────────────────────────
  // Same values that used to be hardcoded on the public CourseDetails page —
  // now living in the DB so admin can edit them. Inserted once; admin edits
  // after that won't be overwritten on next server boot (upsertOne skips if exists).
  console.log("🦸 Course Hero section");
  await upsertOne(
    CourseHeroSection,
    {}, // singleton — match any existing doc
    {
      badgeText: "পূর্ণ বাংলায় শিখো এবং তোমার ক্যারিয়ার গড়ো Full Stack Web Engineer হিসেবে",
      headingHtml: '<span class="gradient-text">AI-Driven</span> Web Development Course',
      description: "HTML, CSS, JavaScript, React, Node.js, MongoDB সহ সম্পূর্ণ Full Stack Web Development শেখো। প্রজেক্ট বানাও, পোর্টফোলিও তৈরি করো এবং ক্যারিয়ার শুরু করো।",
      stats: [
        { value: "৩০০০+", label: "শিক্ষার্থী" },
        { value: "৪.৮★", label: "রেটিং" },
        { value: "৬০+", label: "ঘণ্টার কন্টেন্ট" },
        { value: "৫০০+", label: "জব প্লেসমেন্ট" },
      ],
      primaryButtonText: "এখনই ভর্তি হও",
      primaryButtonLink: "/enroll",
      secondaryButtonText: "Demo দেখো",
      secondaryButtonLink: "",
      guaranteeText: "✅ ৩০ দিনের মানি-ব্যাক গ্যারান্টি \u00a0·\u00a0 ✅ লাইফটাইম অ্যাক্সেস",
      showInstructorCard: true,
      instructorImage: "",
      instructorName: "Jhankar Mahbub",
      instructorTitle: "Lead Instructor",
      instructorSubtitle: "Ex-Google Engineer",
      bestsellerBadgeText: "🔥 BESTSELLER",
      jobSupportBadgeText: "✅ Job Support",
    },
    "course hero section"
  );

  // ── COURSE DETAILS → PAYMENT SETTINGS (singleton) ───────────────────────────
  // Same price/disclaimer text that used to be hardcoded in CoursePaymentSection.jsx
  // — now living in the DB so admin can edit them from the Payment Method page.
  console.log("💳 Course payment settings");
  await upsertOne(
    CoursePaymentSettings,
    {}, // singleton — match any existing doc
    {
      isActive: false,
      price: "৪,৫০০",
      oldPrice: "১২,০০০",
      discountText: "৬৩% ছাড়",
      bootcampFeeLabel: "বুটক্যাম্প ফি",
      bootcampFee: "৫,৫০০ টাকা",
      disclaimerBadgeText: "Disclaimer",
      disclaimerLine1: "৫৫০০ টাকায় ভর্তির এটাই শেষ সুযোগ,",
      disclaimerLine2: "পরের ব্যাচ থেকে ভর্তি ফি বেড়ে যাবে।",
      paymentButtonsLabel: "পেমেন্ট করো:",
      enrollButtonText: "ভর্তি হও →",
      enrollButtonLink: "/enroll",
      modalCloseButtonText: "বুঝেছি",
      modalStepsHeading: "কীভাবে পেমেন্ট করবে:",
    },
    "course payment settings"
  );

  // ── COURSE DETAILS → PAYMENT METHODS (CRUD collection) ──────────────────────
  // The bKash/Nagad/Rocket/Visa/Bank buttons + their step-by-step instructions
  // that used to be a hardcoded array in CoursePaymentSection.jsx — now seeded
  // into the DB once; admin can edit/add/remove from the admin panel after that.
  console.log("🏦 Payment methods");
  await upsertMany(
    PaymentMethod,
    [
      {
        label: "bKash",
        accountLabel: "bKash নম্বর (Personal)",
        accountNumber: "01XXXXXXXXX",
        reference: "তোমার নাম / ফোন নম্বর",
        steps: [
          "bKash অ্যাপ থেকে Send Money অপশনে যাও",
          "উপরের নম্বরে টাকা পাঠাও",
          "Reference এ তোমার নাম/ফোন নম্বর দাও",
          "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
        ],
        isActive: true,
        order: 0,
        createdBy: adminUser._id,
      },
      {
        label: "Nagad",
        accountLabel: "Nagad নম্বর (Personal)",
        accountNumber: "01XXXXXXXXX",
        reference: "তোমার নাম / ফোন নম্বর",
        steps: [
          "Nagad অ্যাপ থেকে Send Money অপশনে যাও",
          "উপরের নম্বরে টাকা পাঠাও",
          "Reference এ তোমার নাম/ফোন নম্বর দাও",
          "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
        ],
        isActive: true,
        order: 1,
        createdBy: adminUser._id,
      },
      {
        label: "Rocket",
        accountLabel: "Rocket নম্বর (Personal)",
        accountNumber: "01XXXXXXXXX-X",
        reference: "তোমার নাম / ফোন নম্বর",
        steps: [
          "Rocket অ্যাপ থেকে Send Money অপশনে যাও",
          "উপরের নম্বরে টাকা পাঠাও",
          "Reference এ তোমার নাম/ফোন নম্বর দাও",
          "পেমেন্ট সম্পন্ন হলে Transaction ID স্ক্রিনশট রাখো",
        ],
        isActive: true,
        order: 2,
        createdBy: adminUser._id,
      },
      {
        label: "Visa/MC",
        accountLabel: "কার্ড পেমেন্ট",
        accountNumber: "চেকআউট পেজে কার্ড দিয়ে পে করো",
        reference: "",
        steps: [
          "\"ভর্তি হও\" বাটনে ক্লিক করো",
          "চেকআউট পেজে Visa/Mastercard সিলেক্ট করো",
          "কার্ডের তথ্য দিয়ে পেমেন্ট সম্পন্ন করো",
        ],
        isActive: true,
        order: 3,
        createdBy: adminUser._id,
      },
      {
        label: "Bank",
        accountLabel: "ব্যাংক অ্যাকাউন্ট নম্বর",
        accountNumber: "XXXX-XXXXXXX-XXX",
        reference: "তোমার নাম উল্লেখ করে",
        steps: [
          "নিকটস্থ ব্রাঞ্চ থেকে উপরের অ্যাকাউন্টে টাকা জমা দাও",
          "Deposit slip এ তোমার নাম লিখো",
          "জমার রসিদের ছবি/স্ক্রিনশট রাখো",
        ],
        isActive: true,
        order: 4,
        createdBy: adminUser._id,
      },
    ],
    (m) => ({ label: m.label }), // unique key
    "payment methods"
  );

  // ── ADD FUTURE SECTIONS HERE ──────────────────────────────────────────────
  // Just copy one of the patterns above:
  //   - upsertMany(Model, [...items], (item) => ({ uniqueField: item.uniqueField }), "label")
  //   - upsertOne(Model, { someFilter }, data, "label")
  // Each new section is independent: it will never be skipped just because
  // an earlier section (like Users) was already seeded.

  console.log("\n🎉 Seed check complete.\n");
};

module.exports = seedDatabase;

// ── STANDALONE CLI MODE ───────────────────────────────────────────────────
// Still works if you ever want to run `node server/seeds/seed.js` by hand —
// it just connects/disconnects on its own in that case. Not required for
// normal use anymore since index.js calls seedDatabase() automatically.
if (require.main === module) {
  require("dotenv").config();
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ Connected to MongoDB");
      await seedDatabase();
      await mongoose.disconnect();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}