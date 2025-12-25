// ===============================
// Lumix Core Backend Server
// ===============================

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

// -------------------------------
// Path Fix (required for ES modules)
// -------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------
// App Init
// -------------------------------
const app = express();

// -------------------------------
// Middleware
// -------------------------------
app.use(cors());
app.use(express.json());

// Basic rate limiting (safe for Render)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use(limiter);

// -------------------------------
// Serve Frontend (HTML / CSS / JS)
// -------------------------------
app.use(express.static(__dirname));

// -------------------------------
// Homepage
// -------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// -------------------------------
// Example API route (optional)
// -------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Lumix Core backend is running 🚀",
  });
});

// -------------------------------
// Port (Render compatible)
// -------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Lumix Core backend running on port ${PORT}`);
});
