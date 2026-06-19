require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Blog = require("../models/Blog");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing
  await User.deleteMany({});
  await Category.deleteMany({});
  await Blog.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // ── USERS ──────────────────────────────────────────────────────────────────
  // NOTE: These users use firebaseUid placeholder.
  // For real Firebase auth, you'd create them in Firebase Console and use real UIDs.
  // For testing, you can also add email/password fields and use a separate login endpoint.
  const users = await User.insertMany([
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
  ]);

  const [adminUser, instructorUser] = users;
  console.log("👥 Users seeded:", users.map((u) => `${u.name} (${u.role})`).join(", "));

  // ── CATEGORIES ─────────────────────────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: "Web Development", slug: "web-development", icon: "🌐", description: "HTML, CSS, JavaScript and frameworks", createdBy: adminUser._id },
    { name: "Backend", slug: "backend", icon: "⚙️", description: "Node.js, Express, databases and APIs", createdBy: adminUser._id },
    { name: "Database", slug: "database", icon: "🗄️", description: "MongoDB, MySQL, PostgreSQL", createdBy: adminUser._id },
    { name: "DevOps", slug: "devops", icon: "🚀", description: "Docker, CI/CD, deployment", createdBy: adminUser._id },
    { name: "Networking", slug: "networking", icon: "🔌", description: "Cisco, MikroTik, network engineering", createdBy: adminUser._id },
  ]);

  console.log("📁 Categories seeded:", categories.map((c) => c.name).join(", "));

  // ── BLOGS ──────────────────────────────────────────────────────────────────
  const [webCat, backendCat] = categories;
  await Blog.insertMany([
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
  ]);

  console.log("📝 Blogs seeded");
  console.log("\n🎉 Seed complete!\n");
  console.log("Test accounts (use Firebase Console to create these emails or use your own Firebase UIDs):");
  console.log("  Admin:      admin@mernstarter.com");
  console.log("  Instructor: instructor@mernstarter.com");
  console.log("  User:       user@mernstarter.com\n");

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
