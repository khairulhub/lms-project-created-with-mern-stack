require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const connectDB = require("./config/db");
const seedDatabase = require("./seeds/seed");
const routes = require("./routes/index");

const app = express();

const start = async () => {
  await connectDB();

  // Auto-seed on every boot. Each section checks itself and only inserts
  // what's missing — if everything's already there, this just logs and
  // moves on (no duplicates, nothing re-written).
  try {
    await seedDatabase();
  } catch (err) {
    console.error("⚠️  Seed check failed (server will still start):", err.message);
  }

  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Legacy static serving — new video uploads now go straight to Cloudinary
  // (see config/upload.js), so nothing new gets saved here. Kept only so any
  // file uploaded before the Cloudinary migration is still reachable.
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.use("/api", routes);

  app.get("/", (req, res) => res.json({ message: "MERN Starter API running ✅" }));

  // Multer errors (e.g. file too large, bad mimetype) come through as
  // MulterError / generic Error from the fileFilter — turn them into a
  // clean 400 instead of falling through to the generic 500 handler.
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Video file 100MB-er beshi boro. Choto file upload koro." });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err && err.message && err.message.includes("Unsupported video format")) {
      return res.status(400).json({ message: err.message });
    }
    if (err && /cloudinary|cloud_name|Invalid Signature|Must supply api_key/i.test(err.message || "")) {
      return res.status(500).json({ message: "Video upload service set up hoyni thik moto। .env-e CLOUDINARY_* values check koro." });
    }
    next(err);
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || "Server Error" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();