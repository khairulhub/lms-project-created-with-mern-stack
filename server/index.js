require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

  app.use("/api", routes);

  app.get("/", (req, res) => res.json({ message: "MERN Starter API running ✅" }));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || "Server Error" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();