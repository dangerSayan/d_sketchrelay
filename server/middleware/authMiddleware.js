// server/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// This function has THREE parameters: req, res, next
// 'next' is a function — calling next() means "I'm done, pass to the next handler"
// NOT calling next() means "I'm stopping this request here"
const protect = async (req, res, next) => {
  try {
    // --- Extract the token from the Authorization header ---
    // The header looks like: "Authorization: Bearer eyJhbGci..."
    // We split by space and take the second part
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // get the part after "Bearer "

    // --- Verify the token ---
    // jwt.verify() does TWO things:
    //   1. Checks the signature (was this token actually made by our server?)
    //   2. Checks expiry (has the 7-day window passed?)
    // If either fails, it throws an error — caught by our catch block
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: 'the_user_id_we_put_in', iat: ..., exp: ... }

    // --- Fetch the user from DB ---
    // We look up the full user so req.user has up-to-date info
    // .select('-password') means: give me everything EXCEPT the password field
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      // Token was valid but user was deleted after token was issued
      return res.status(401).json({ message: "User no longer exists" });
    }

    // --- Attach user to the request object ---
    // This makes req.user available in every route handler that uses this middleware
    req.user = user;

    // Pass control to the next function in the chain (the actual route handler)
    next();
  } catch (error) {
    // jwt.verify() throws JsonWebTokenError for invalid signatures
    // and TokenExpiredError for expired tokens
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please log in again" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { protect };
