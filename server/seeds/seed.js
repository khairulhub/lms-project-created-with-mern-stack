const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Blog = require("../models/Blog");
const NavMenu = require("../models/NavMenu");
const SiteConfig = require("../models/SiteConfig");
const CourseHeroSection = require("../models/CourseHeroSection");
const CoursePaymentSettings = require("../models/CoursePaymentSettings");
const PaymentMethod = require("../models/PaymentMethod");
const CourseHighlightSection = require("../models/CourseHighlightSection");
const CourseHighlightItem = require("../models/CourseHighlightItem");
const CourseVideoSection = require("../models/CourseVideoSection");
const CourseWhatYouLearnSection = require("../models/CourseWhatYouLearnSection");
const CourseWhatYouLearnItem = require("../models/CourseWhatYouLearnItem");
const CourseCurriculumSection = require("../models/CourseCurriculumSection");
const CourseCurriculumModule  = require("../models/CourseCurriculumModule");
const CourseProject           = require("../models/CourseProject");
const CourseProjectSettings   = require("../models/CourseProjectSettings");
const CourseCareerItem        = require("../models/CourseCareerItem");
const CourseCareerSettings    = require("../models/CourseCareerSettings");
const CourseReview            = require("../models/CourseReview");
const CourseReviewSettings    = require("../models/CourseReviewSettings");

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

  const mernCat = categories.find((c) => c.slug === "mern-stack");
  const laravelCat = categories.find((c) => c.slug === "php-laravel");
  const networkingCat = categories.find((c) => c.slug === "networking");

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
        category: mernCat._id,
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
        category: mernCat._id,
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

  // ── COURSE DETAILS → HIGHLIGHTS SECTION (per category) ──────────────────────
  // The "এই কোর্সে তুমি কী পাবে?" cards + tech-tag list — now ONE set per
  // category (MERN / PHP-Laravel / Networking) instead of a single hardcoded
  // block. Public Home page shows whichever category is selected (MERN by
  // default); admin can fully CRUD the cards per category from
  // Admin → Course Details → Highlights Section.
  console.log("✨ Course Highlights (per category)");

  // -- MERN Stack --------------------------------------------------------
  await upsertOne(
    CourseHighlightSection,
    { category: mernCat._id },
    {
      category: mernCat._id,
      heading: "এই কোর্সে তুমি কী পাবে?",
      subtitle: "একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট",
      techTagsLabel: "যা যা শিখবে:",
      techTags: ["HTML", "CSS", "Tailwind", "JavaScript", "React", "Node.js", "Express", "MongoDB", "Firebase", "Git", "REST API", "JWT"],
    },
    "MERN highlight section"
  );
  await upsertMany(
    CourseHighlightItem,
    [
      { category: mernCat._id, icon: "🤖", title: "AI-Powered Learning", description: "AI tools দিয়ে faster এবং smarter ভাবে কোড শেখো", order: 0, createdBy: adminUser._id },
      { category: mernCat._id, icon: "📋", title: "Structured Path", description: "Week-by-week structured curriculum তোমাকে গাইড করবে", order: 1, createdBy: adminUser._id },
      { category: mernCat._id, icon: "🌐", title: "Full Stack Skills", description: "Frontend থেকে Backend — সব কিছু এক জায়গায়", order: 2, createdBy: adminUser._id },
      { category: mernCat._id, icon: "💼", title: "Job Ready", description: "ইন্টারভিউ প্রেপ, CV রিভিউ এবং জব সাপোর্ট", order: 3, createdBy: adminUser._id },
    ],
    (i) => ({ category: i.category, title: i.title }),
    "MERN highlight items"
  );

  // -- PHP / Laravel ------------------------------------------------------
  await upsertOne(
    CourseHighlightSection,
    { category: laravelCat._id },
    {
      category: laravelCat._id,
      heading: "এই কোর্সে তুমি কী পাবে?",
      subtitle: "একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট",
      techTagsLabel: "যা যা শিখবে:",
      techTags: ["HTML", "CSS", "Bootstrap", "PHP", "Laravel", "Blade", "MySQL", "Eloquent ORM", "Composer", "Git", "REST API", "Sanctum"],
    },
    "PHP/Laravel highlight section"
  );
  await upsertMany(
    CourseHighlightItem,
    [
      { category: laravelCat._id, icon: "🤖", title: "AI-Powered Learning", description: "AI tools দিয়ে faster এবং smarter ভাবে কোড শেখো", order: 0, createdBy: adminUser._id },
      { category: laravelCat._id, icon: "📋", title: "Structured Path", description: "Week-by-week structured curriculum তোমাকে গাইড করবে", order: 1, createdBy: adminUser._id },
      { category: laravelCat._id, icon: "🐘", title: "Laravel Mastery", description: "MVC, Eloquent, Blade — Laravel-এর সব core concept শিখবে", order: 2, createdBy: adminUser._id },
      { category: laravelCat._id, icon: "💼", title: "Job Ready", description: "ইন্টারভিউ প্রেপ, CV রিভিউ এবং জব সাপোর্ট", order: 3, createdBy: adminUser._id },
    ],
    (i) => ({ category: i.category, title: i.title }),
    "PHP/Laravel highlight items"
  );

  // -- Networking ----------------------------------------------------------
  await upsertOne(
    CourseHighlightSection,
    { category: networkingCat._id },
    {
      category: networkingCat._id,
      heading: "এই কোর্সে তুমি কী পাবে?",
      subtitle: "একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট",
      techTagsLabel: "যা যা শিখবে:",
      techTags: ["Networking Basics", "TCP/IP", "Cisco Packet Tracer", "MikroTik", "Routing", "Switching", "Firewall", "VPN", "Network Security", "Wireless"],
    },
    "Networking highlight section"
  );
  await upsertMany(
    CourseHighlightItem,
    [
      { category: networkingCat._id, icon: "🤖", title: "AI-Powered Learning", description: "AI tools দিয়ে faster এবং smarter ভাবে শেখো", order: 0, createdBy: adminUser._id },
      { category: networkingCat._id, icon: "📋", title: "Structured Path", description: "Week-by-week structured curriculum তোমাকে গাইড করবে", order: 1, createdBy: adminUser._id },
      { category: networkingCat._id, icon: "🔌", title: "Hands-on Labs", description: "Cisco ও MikroTik দিয়ে practical lab ও simulation", order: 2, createdBy: adminUser._id },
      { category: networkingCat._id, icon: "💼", title: "Job Ready", description: "ইন্টারভিউ প্রেপ, CV রিভিউ এবং জব সাপোর্ট", order: 3, createdBy: adminUser._id },
    ],
    (i) => ({ category: i.category, title: i.title }),
    "Networking highlight items"
  );

  // ── COURSE DETAILS → VIDEO SECTION (per category) ───────────────────────────
  // The "কোর্সের একটু আভাস নাও" preview-video block — one settings doc per
  // category. Defaults to the same YouTube embed that used to be hardcoded;
  // admin can switch to an uploaded file anytime from the admin panel.
  console.log("🎬 Course Video section");
  await upsertOne(
    CourseVideoSection,
    { category: mernCat._id },
    {
      category: mernCat._id,
      heading: "কোর্সের একটু আভাস নাও",
      subtitle: "ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই",
      videoType: "youtube",
      videoUrl: "https://www.youtube.com/embed/zAbT_zvSaM4",
    },
    "MERN video section"
  );
  await upsertOne(
    CourseVideoSection,
    { category: laravelCat._id },
    {
      category: laravelCat._id,
      heading: "কোর্সের একটু আভাস নাও",
      subtitle: "ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই",
      videoType: "youtube",
      videoUrl: "https://www.youtube.com/embed/zAbT_zvSaM4",
    },
    "PHP/Laravel video section"
  );
  await upsertOne(
    CourseVideoSection,
    { category: networkingCat._id },
    {
      category: networkingCat._id,
      heading: "কোর্সের একটু আভাস নাও",
      subtitle: "ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই",
      videoType: "youtube",
      videoUrl: "https://www.youtube.com/embed/zAbT_zvSaM4",
    },
    "Networking video section"
  );

  // ── COURSE DETAILS → WHAT YOU'LL LEARN SECTION (per category) ───────────────
  console.log("📚 Course What-You'll-Learn (per category)");

  // -- MERN Stack --------------------------------------------------------
  await upsertOne(
    CourseWhatYouLearnSection,
    { category: mernCat._id },
    {
      category: mernCat._id,
      heading: "কী কী শিখবে এই কোর্সে?",
      subtitle: "শেষ করলে তুমি একজন দক্ষ Full Stack Developer হয়ে যাবে",
    },
    "MERN what-you-learn section"
  );
  await upsertMany(
    CourseWhatYouLearnItem,
    [
      "HTML5 ও CSS3 দিয়ে সুন্দর ওয়েবসাইট বানানো",
      "Tailwind CSS দিয়ে Responsive Design",
      "JavaScript ES6+ এর সব আধুনিক ফিচার",
      "React.js দিয়ে Dynamic UI তৈরি",
      "React Router, Context API, Hooks",
      "Node.js ও Express দিয়ে REST API",
      "MongoDB ও Mongoose দিয়ে Database",
      "Firebase Authentication সেটআপ",
      "JWT দিয়ে Secure Login System",
      "Git ও GitHub ব্যবহার",
      "Vercel ও Netlify তে Deploy করা",
      "Interview Preparation ও DSA Basics",
    ].map((text, i) => ({ category: mernCat._id, text, order: i, createdBy: adminUser._id })),
    (i) => ({ category: i.category, text: i.text }),
    "MERN what-you-learn items"
  );

  // -- PHP / Laravel ------------------------------------------------------
  await upsertOne(
    CourseWhatYouLearnSection,
    { category: laravelCat._id },
    {
      category: laravelCat._id,
      heading: "কী কী শিখবে এই কোর্সে?",
      subtitle: "শেষ করলে তুমি একজন দক্ষ PHP/Laravel Developer হয়ে যাবে",
    },
    "PHP/Laravel what-you-learn section"
  );
  await upsertMany(
    CourseWhatYouLearnItem,
    [
      "HTML5 ও CSS3 দিয়ে সুন্দর ওয়েবসাইট বানানো",
      "Bootstrap দিয়ে Responsive Design",
      "PHP-এর Core Concepts ও OOP",
      "Laravel Framework ও MVC Architecture",
      "Blade Templating Engine",
      "Eloquent ORM দিয়ে Database কাজ",
      "MySQL Database Design",
      "Laravel Authentication ও Sanctum",
      "RESTful API বানানো Laravel দিয়ে",
      "Composer ও Package Management",
      "Git ও GitHub ব্যবহার",
      "Laravel App Deploy করা",
    ].map((text, i) => ({ category: laravelCat._id, text, order: i, createdBy: adminUser._id })),
    (i) => ({ category: i.category, text: i.text }),
    "PHP/Laravel what-you-learn items"
  );

  // -- Networking ----------------------------------------------------------
  await upsertOne(
    CourseWhatYouLearnSection,
    { category: networkingCat._id },
    {
      category: networkingCat._id,
      heading: "কী কী শিখবে এই কোর্সে?",
      subtitle: "শেষ করলে তুমি একজন দক্ষ Network Engineer হয়ে যাবে",
    },
    "Networking what-you-learn section"
  );
  await upsertMany(
    CourseWhatYouLearnItem,
    [
      "Networking Fundamentals ও OSI Model",
      "TCP/IP Protocol Suite",
      "Cisco Packet Tracer দিয়ে Simulation",
      "Routing ও Switching Basics",
      "VLAN Configuration",
      "MikroTik Router Configuration",
      "Firewall ও Network Security",
      "VPN Setup ও Configuration",
      "Wireless Networking",
      "Network Troubleshooting",
      "IP Addressing ও Subnetting",
      "Industry Certification Prep (CCNA)",
    ].map((text, i) => ({ category: networkingCat._id, text, order: i, createdBy: adminUser._id })),
    (i) => ({ category: i.category, text: i.text }),
    "Networking what-you-learn items"
  );

  // ── COURSE DETAILS → CURRICULUM SECTION (per category) ─────────────────────
  console.log("📖 Course Curriculum (per category)");

  // -- MERN Stack --------------------------------------------------------
  await upsertOne(
    CourseCurriculumSection,
    { category: mernCat._id },
    {
      category: mernCat._id,
      heading:  "কোর্সের সিলেবাস",
      subtitle: "সম্পূর্ণ কোর্স কারিকুলাম একনজরে দেখো",
    },
    "MERN curriculum section"
  );
  await upsertMany(
    CourseCurriculumModule,
    [
      {
        category: mernCat._id, week: "Week 1-2", title: "HTML & CSS Foundation",
        lessons: 18, duration: "6h 30m", order: 0, isActive: true,
        topics: ["HTML5 Semantic Elements", "CSS Box Model ও Flexbox", "CSS Grid Layout", "Responsive Design", "Tailwind CSS Basics", "Mini Project: Portfolio Page"],
        createdBy: adminUser._id,
      },
      {
        category: mernCat._id, week: "Week 3-5", title: "JavaScript Essentials",
        lessons: 24, duration: "9h 15m", order: 1, isActive: true,
        topics: ["Variables, Functions, Scope", "Arrays ও Objects", "DOM Manipulation", "Events ও Event Listeners", "ES6+: Arrow Functions, Destructuring", "Promises, Async/Await, Fetch API"],
        createdBy: adminUser._id,
      },
      {
        category: mernCat._id, week: "Week 6-9", title: "React.js Deep Dive",
        lessons: 30, duration: "13h 40m", order: 2, isActive: true,
        topics: ["React Fundamentals ও JSX", "Components, Props, State", "useState, useEffect, useContext", "React Router v6", "Form Handling", "Project: E-commerce App"],
        createdBy: adminUser._id,
      },
      {
        category: mernCat._id, week: "Week 10-12", title: "Backend — Node.js & Express",
        lessons: 22, duration: "9h 20m", order: 3, isActive: true,
        topics: ["Node.js Basics ও NPM", "Express Framework", "REST API Design", "Middleware", "JWT Authentication", "File Upload"],
        createdBy: adminUser._id,
      },
      {
        category: mernCat._id, week: "Week 13-14", title: "Database — MongoDB",
        lessons: 16, duration: "6h 45m", order: 4, isActive: true,
        topics: ["MongoDB Atlas Setup", "CRUD Operations", "Mongoose Schema", "Relationships", "Aggregation Pipeline"],
        createdBy: adminUser._id,
      },
      {
        category: mernCat._id, week: "Week 15-16", title: "Final Project ও Job Prep",
        lessons: 14, duration: "7h 00m", order: 5, isActive: true,
        topics: ["Full Stack MERN Project", "GitHub Portfolio", "Resume Building", "Interview Prep", "Freelancing Tips", "Job Application Guide"],
        createdBy: adminUser._id,
      },
    ],
    (m) => ({ category: m.category, week: m.week, title: m.title }),
    "MERN curriculum modules"
  );

  // -- PHP / Laravel --------------------------------------------------------
  await upsertOne(
    CourseCurriculumSection,
    { category: laravelCat._id },
    {
      category: laravelCat._id,
      heading:  "কোর্সের সিলেবাস",
      subtitle: "সম্পূর্ণ কোর্স কারিকুলাম একনজরে দেখো",
    },
    "PHP/Laravel curriculum section"
  );
  await upsertMany(
    CourseCurriculumModule,
    [
      {
        category: laravelCat._id, week: "Week 1-2", title: "HTML, CSS ও Bootstrap",
        lessons: 16, duration: "6h 00m", order: 0, isActive: true,
        topics: ["HTML5 Basics", "CSS Fundamentals", "Bootstrap Grid", "Responsive Design", "Mini Project: Landing Page"],
        createdBy: adminUser._id,
      },
      {
        category: laravelCat._id, week: "Week 3-5", title: "PHP Core ও OOP",
        lessons: 22, duration: "9h 00m", order: 1, isActive: true,
        topics: ["PHP Variables ও Data Types", "Functions ও Arrays", "OOP: Class, Object, Inheritance", "Error Handling", "File Handling"],
        createdBy: adminUser._id,
      },
      {
        category: laravelCat._id, week: "Week 6-9", title: "Laravel Framework",
        lessons: 28, duration: "12h 30m", order: 2, isActive: true,
        topics: ["Laravel Installation ও MVC", "Routing ও Controllers", "Blade Templating", "Eloquent ORM", "Form Validation", "Middleware"],
        createdBy: adminUser._id,
      },
      {
        category: laravelCat._id, week: "Week 10-12", title: "Database — MySQL",
        lessons: 18, duration: "7h 30m", order: 3, isActive: true,
        topics: ["MySQL Setup", "CRUD with Eloquent", "Migrations ও Seeders", "Relationships (HasMany, BelongsTo)", "Query Builder"],
        createdBy: adminUser._id,
      },
      {
        category: laravelCat._id, week: "Week 13-14", title: "Authentication ও API",
        lessons: 16, duration: "6h 30m", order: 4, isActive: true,
        topics: ["Laravel Breeze / Sanctum", "API Routes", "Token-based Auth", "CORS Configuration", "Postman Testing"],
        createdBy: adminUser._id,
      },
      {
        category: laravelCat._id, week: "Week 15-16", title: "Final Project ও Deploy",
        lessons: 12, duration: "6h 00m", order: 5, isActive: true,
        topics: ["Full Laravel Project", "Shared Hosting Deploy", "cPanel Setup", "GitHub Portfolio", "Job Application Guide"],
        createdBy: adminUser._id,
      },
    ],
    (m) => ({ category: m.category, week: m.week, title: m.title }),
    "PHP/Laravel curriculum modules"
  );

  // -- Networking ----------------------------------------------------------
  await upsertOne(
    CourseCurriculumSection,
    { category: networkingCat._id },
    {
      category: networkingCat._id,
      heading:  "কোর্সের সিলেবাস",
      subtitle: "সম্পূর্ণ কোর্স কারিকুলাম একনজরে দেখো",
    },
    "Networking curriculum section"
  );
  await upsertMany(
    CourseCurriculumModule,
    [
      {
        category: networkingCat._id, week: "Week 1-2", title: "Networking Fundamentals",
        lessons: 14, duration: "5h 30m", order: 0, isActive: true,
        topics: ["OSI Model ও TCP/IP", "IP Addressing", "Subnetting Basics", "Network Devices", "LAN vs WAN"],
        createdBy: adminUser._id,
      },
      {
        category: networkingCat._id, week: "Week 3-5", title: "Cisco Packet Tracer",
        lessons: 20, duration: "8h 00m", order: 1, isActive: true,
        topics: ["Packet Tracer Install", "Router Configuration", "Switch Configuration", "VLAN Setup", "Static Routing", "RIP ও OSPF"],
        createdBy: adminUser._id,
      },
      {
        category: networkingCat._id, week: "Week 6-8", title: "MikroTik Router",
        lessons: 18, duration: "7h 30m", order: 2, isActive: true,
        topics: ["MikroTik Winbox", "IP Configuration", "DHCP Server", "Firewall Rules", "Bandwidth Management", "Hotspot Setup"],
        createdBy: adminUser._id,
      },
      {
        category: networkingCat._id, week: "Week 9-11", title: "Network Security",
        lessons: 16, duration: "6h 30m", order: 3, isActive: true,
        topics: ["Firewall Concepts", "VPN Types ও Setup", "Network Threats", "IDS/IPS Basics", "Wireless Security", "ACL Configuration"],
        createdBy: adminUser._id,
      },
      {
        category: networkingCat._id, week: "Week 12-14", title: "Advanced Topics ও Labs",
        lessons: 14, duration: "6h 00m", order: 4, isActive: true,
        topics: ["Network Troubleshooting", "Wireless Networking", "Network Monitoring", "Real Lab Practice", "Case Studies"],
        createdBy: adminUser._id,
      },
      {
        category: networkingCat._id, week: "Week 15-16", title: "Certification Prep ও Job",
        lessons: 10, duration: "5h 00m", order: 5, isActive: true,
        topics: ["CCNA Exam Prep", "Practice Questions", "Resume Building", "LinkedIn Profile", "Job Application Guide"],
        createdBy: adminUser._id,
      },
    ],
    (m) => ({ category: m.category, week: m.week, title: m.title }),
    "Networking curriculum modules"
  );

  // ── COURSE DETAILS → CAREER SECTION ─────────────────────────────────────────
  console.log("🎯 Course Career Section");

  let careerSettings = await CourseCareerSettings.findOne();
  if (!careerSettings) {
    await CourseCareerSettings.create({
      heading:      "কোর্স শেষে তোমার ক্যারিয়ার 🚀",
      subtitle:     "আমাদের ৫০০+ গ্র্যাজুয়েট দেশে এবং বিদেশে সফলভাবে কাজ করছে। চাকরি, ফ্রিল্যান্সিং বা নিজের স্টার্টআপ — যেকোনো পথে প্রস্তুত করব।",
      displayStyle: "split",
    });
    console.log("  ✅ CourseCareerSettings created");
  } else {
    console.log("  ⏭️  CourseCareerSettings already exists");
  }

  // Bullet items (left side list) — latest 3 active shown on frontend
  await upsertMany(
    CourseCareerItem,
    [
      { type: "bullet", icon: "🏢", text: "Top Tech Company তে জব পাওয়ার সুযোগ",    isActive: true, order: 0, createdBy: adminUser._id },
      { type: "bullet", icon: "💻", text: "Upwork, Fiverr এ Freelancing শুরু",        isActive: true, order: 1, createdBy: adminUser._id },
      { type: "bullet", icon: "📁", text: "শক্তিশালী GitHub Portfolio তৈরি",          isActive: true, order: 2, createdBy: adminUser._id },
      { type: "bullet", icon: "📝", text: "Professional CV ও LinkedIn Profile",       isActive: true, order: 3, createdBy: adminUser._id },
      { type: "bullet", icon: "🎤", text: "Mock Interview ও Job Referral সাপোর্ট",   isActive: true, order: 4, createdBy: adminUser._id },
    ],
    (i) => ({ type: i.type, text: i.text }),
    "CourseCareer bullets"
  );

  // Stat cards (right side grid)
  await upsertMany(
    CourseCareerItem,
    [
      { type: "stat", icon: "🎓", value: "৫০০+", label: "সফল গ্র্যাজুয়েট",   colorFrom: "#7c3aed", colorTo: "#6d28d9", isActive: true, order: 0, createdBy: adminUser._id },
      { type: "stat", icon: "💼", value: "৮৫%",  label: "জব পেয়েছে",          colorFrom: "#db2777", colorTo: "#be185d", isActive: true, order: 1, createdBy: adminUser._id },
      { type: "stat", icon: "📈", value: "৩x",   label: "স্যালারি বৃদ্ধি",    colorFrom: "#4f46e5", colorTo: "#4338ca", isActive: true, order: 2, createdBy: adminUser._id },
      { type: "stat", icon: "🤝", value: "৬০+",  label: "হায়ারিং পার্টনার",  colorFrom: "#0891b2", colorTo: "#0e7490", isActive: true, order: 3, createdBy: adminUser._id },
    ],
    (i) => ({ type: i.type, value: i.value, label: i.label }),
    "CourseCareer stats"
  );

  // ── COURSE DETAILS → REVIEWS SECTION ─────────────────────────────────────
  console.log("⭐ Course Reviews");

  let reviewSettings = await CourseReviewSettings.findOne();
  if (!reviewSettings) {
    await CourseReviewSettings.create({
      heading:      "শিক্ষার্থীরা কী বলছে?",
      avgRating:    4.8,
      totalReviews: "১২,৪৮০",
      displayStyle: "grid-slider",
      autoSlideMs:  3000,
    });
    console.log("  ✅ CourseReviewSettings created");
  } else {
    console.log("  ⏭️  CourseReviewSettings already exists");
  }

  await upsertMany(
    CourseReview,
    [
      { name: "রাহিম উদ্দিন",  role: "Junior Developer @ TechCorp",    avatarSeed: "rahim",  rating: 5, order: 0, isActive: true, text: "এই কোর্সটা আমার জীবন বদলে দিয়েছে। ৬ মাসে জব পেয়েছি। এত ভালো পড়ান যে কঠিন বিষয়ও সহজ মনে হয়!", createdBy: adminUser._id },
      { name: "ফাতেমা খাতুন", role: "Freelancer @ Upwork",             avatarSeed: "fatema", rating: 5, order: 1, isActive: true, text: "আমি গৃহিণী ছিলাম, কোডিং জানতাম না। এখন মাসে ৫০k+ ইনকাম করি। এই কোর্স সত্যিকারের জীবন পরিবর্তন করে।", createdBy: adminUser._id },
      { name: "করিম হোসেন",   role: "Full Stack Dev @ StartupBD",      avatarSeed: "karim",  rating: 5, order: 2, isActive: true, text: "Projects গুলো এত real-world যে job interview তে সরাসরি কাজে লেগেছে। Community support অসাধারণ!", createdBy: adminUser._id },
      { name: "নাফিসা আক্তার",role: "React Developer @ RemoteJob",     avatarSeed: "nafisa", rating: 5, order: 3, isActive: true, text: "বিদেশ থেকে remote job পেয়েছি এই কোর্সের পরে। Mentor support ছাড়া এত দূর আসতে পারতাম না।", createdBy: adminUser._id },
      { name: "সজীব আহমেদ",   role: "Software Engineer @ BJIT",        avatarSeed: "sajib",  rating: 4, order: 4, isActive: true, text: "Curriculum অনেক comprehensive। Node.js ও React একসাথে শিখতে পেরেছি যা অনেক জায়গায় আলাদা করে শেখায়।", createdBy: adminUser._id },
      { name: "মারিয়া বেগম",  role: "Frontend Dev @ Agency",           avatarSeed: "maria",  rating: 5, order: 5, isActive: true, text: "মেয়ে হিসেবে tech এ আসতে ভয় ছিল। এই community আমাকে confident করেছে। ধন্যবাদ!", createdBy: adminUser._id },
    ],
    (r) => ({ name: r.name, role: r.role }),
    "CourseReviews"
  );

  // ── ADD FUTURE SECTIONS HERE ──────────────────────────────────────────────

  // ── COURSE DETAILS → PROJECTS SECTION (global, not per-category) ─────────
  console.log("🛠️  Course Projects");

  // Singleton settings
  let projectSettings = await CourseProjectSettings.findOne();
  if (!projectSettings) {
    await CourseProjectSettings.create({
      heading:      "বাস্তব প্রজেক্ট বানাবে",
      subtitle:     "শুধু থিওরি না — real-world project যা portfolio তে রাখতে পারবে",
      displayStyle: "grid",
    });
    console.log("  ✅ CourseProjectSettings created");
  } else {
    console.log("  ⏭️  CourseProjectSettings already exists");
  }

  await upsertMany(
    CourseProject,
    [
      {
        emoji: "🛒", title: "E-Commerce Platform", order: 0, isActive: true,
        description: "পূর্ণ ফিচারযুক্ত ই-কমার্স অ্যাপ — product listing, cart, payment, admin panel",
        techTags: ["React", "Node.js", "MongoDB"],
        createdBy: adminUser._id,
      },
      {
        emoji: "📚", title: "LMS Platform", order: 1, isActive: true,
        description: "Course management system, video player, quiz system সহ",
        techTags: ["React", "Firebase", "Express"],
        createdBy: adminUser._id,
      },
      {
        emoji: "💬", title: "Real-time Chat App", order: 2, isActive: true,
        description: "Real-time messaging, group chat, online status",
        techTags: ["Socket.io", "React", "Node"],
        createdBy: adminUser._id,
      },
      {
        emoji: "🏠", title: "Property Listing Site", order: 3, isActive: true,
        description: "Property search, filter, booking এবং review system",
        techTags: ["React", "MongoDB", "JWT"],
        createdBy: adminUser._id,
      },
    ],
    (p) => ({ title: p.title }),
    "CourseProjects"
  );
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