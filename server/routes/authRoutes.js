// server/routes/authRoutes.js

const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// express.Router() creates a mini-router — a modular chunk of routes
// We attach this whole router to '/api/auth' in index.js
const router = express.Router();

// POST /api/auth/register
// No middleware — anyone can register
router.post("/register", register);

// POST /api/auth/login
// No middleware — anyone can try to log in
router.post("/login", login);

// GET /api/auth/me
// 'protect' middleware runs FIRST — if token is invalid, getMe never runs
// This is how you protect a route: router.get('/path', protect, handler)
router.get("/me", protect, getMe);

module.exports = router;
