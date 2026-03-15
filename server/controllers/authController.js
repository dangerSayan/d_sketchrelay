// server/controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── Helper: Generate a JWT token ───────────────────────────────────────────
// We define this as a small helper function to avoid repeating code.
// jwt.sign() takes three arguments:
//   1. PAYLOAD — the data to encode inside the token (we store the user's ID)
//   2. SECRET  — a secret string only your server knows, used to sign the token
//   3. OPTIONS — like expiry: '7d' means this token is valid for 7 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
// exports.register makes this function available when another file does:
// const { register } = require('./authController')
exports.register = async (req, res) => {
  // async because we'll be doing database operations which take time
  try {
    // req.body contains the JSON data the user sent in the request body
    // We destructure the three fields we expect
    const { username, email, password } = req.body;

    // --- Validation ---
    // Always validate on the server, even if the frontend already does it.
    // A user can bypass your frontend. They cannot bypass your backend.
    if (!username || !email || !password) {
      // 400 = Bad Request (the client sent something wrong)
      return res.status(400).json({ message: "All fields are required" });
    }

    // --- Check if user already exists ---
    // findOne() searches for ONE document matching the query
    // We check both email AND username in one query using $or
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      // Tell them specifically what's taken so they know what to fix
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already in use" });
      }
      return res.status(400).json({ message: "Username already taken" });
    }

    // --- Hash the password ---
    // bcrypt.hash() takes the plain password and a "salt rounds" number.
    // Salt rounds = how many times to apply the hashing algorithm.
    // 12 is a good balance between security and speed.
    // Higher = more secure but slower. 12 takes ~250ms, which is fine.
    const hashedPassword = await bcrypt.hash(password, 12);

    // --- Create the user in the database ---
    // User.create() validates against the schema THEN saves to MongoDB
    const user = await User.create({
      username,
      email,
      password: hashedPassword, // store the HASH, never the original
    });

    // --- Generate a token for immediate login after registration ---
    // user._id is MongoDB's auto-generated unique ID for this document
    const token = generateToken(user._id);

    // --- Send the response ---
    // 201 = Created (more specific than 200 for new resources)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalScore: user.totalScore,
      },
      message: "Account created successfully",
    });
  } catch (error) {
    // Mongoose validation errors have a specific shape
    // e.g. if 'username' is too short, error.name === 'ValidationError'
    if (error.name === "ValidationError") {
      // Object.values() gets all the error messages, we join them into one string
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    // 500 = Internal Server Error (something broke on our end)
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // --- Find the user by email ---
    // findOne() returns null if nobody matches — we check for that
    const user = await User.findOne({ email });

    if (!user) {
      // IMPORTANT: use a vague message here intentionally.
      // If you say "email not found", you're telling hackers which emails exist.
      // Always say "Invalid credentials" for both wrong email AND wrong password.
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // --- Compare the submitted password against the stored hash ---
    // bcrypt.compare() hashes the plain text and compares to the stored hash
    // It returns true if they match, false if not
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // --- Generate JWT ---
    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalScore: user.totalScore,
      },
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
// This route is protected — only works if you send a valid JWT
exports.getMe = async (req, res) => {
  try {
    // req.user is attached by the auth middleware (which we build next)
    // It already contains the full user object from the DB
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
