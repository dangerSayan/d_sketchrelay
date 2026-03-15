// server/routes/roomRoutes.js
const express = require("express");
const {
  createRoom,
  joinRoom,
  getRoom,
  getPublicRooms,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All room routes require authentication — protect is applied to all of them
router.use(protect); // applies protect to every route below this line

router.post("/", createRoom); // POST   /api/rooms
router.post("/:code/join", joinRoom); // POST   /api/rooms/XK4F2A/join
router.get("/public", getPublicRooms); // GET    /api/rooms/public
router.get("/:code", getRoom); // GET    /api/rooms/XK4F2A

module.exports = router;
