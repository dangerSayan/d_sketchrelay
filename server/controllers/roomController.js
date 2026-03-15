// server/controllers/roomController.js
const Room = require("../models/Room");

// ─── Generate a unique room code ───────────────────────────────────────────
// Creates a 6-character alphanumeric code like "XK4F2A"
const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // removed O,0,1,I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// ─── CREATE ROOM ───────────────────────────────────────────────────────────
exports.createRoom = async (req, res) => {
  try {
    // req.user is set by the protect middleware — we know who's logged in
    const {
      maxPlayers = 8,
      rounds = 3,
      drawTime = 80,
      isPrivate = false,
    } = req.body;

    // Keep generating codes until we find one that doesn't exist yet
    // In practice, collisions are extremely rare with 6 chars
    let code;
    let exists = true;
    while (exists) {
      code = generateRoomCode();
      exists = await Room.findOne({ code });
    }

    // Create the room document in MongoDB
    const room = await Room.create({
      code,
      host: req.user._id,
      maxPlayers,
      rounds,
      drawTime,
      isPrivate,
      // The creator is automatically the first player and the host
      players: [
        {
          userId: req.user._id,
          username: req.user.username,
          isHost: true,
          score: 0,
        },
      ],
    });

    res.status(201).json({
      message: "Room created",
      room: {
        code: room.code,
        maxPlayers: room.maxPlayers,
        rounds: room.rounds,
        drawTime: room.drawTime,
        isPrivate: room.isPrivate,
        status: room.status,
        players: room.players,
        host: room.host,
      },
    });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

// ─── JOIN ROOM ─────────────────────────────────────────────────────────────
exports.joinRoom = async (req, res) => {
  try {
    const { code } = req.params; // from the URL: /api/rooms/:code

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (room.status !== "waiting") {
      return res.status(400).json({ message: "Game already in progress" });
    }
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Check if this user is already in the room
    const alreadyIn = room.players.find(
      (p) => p.userId.toString() === req.user._id.toString(),
    );

    if (!alreadyIn) {
      // Add them to the players array and save
      room.players.push({
        userId: req.user._id,
        username: req.user.username,
        isHost: false,
        score: 0,
      });
      await room.save();
    }

    res.status(200).json({
      message: "Joined room",
      room: {
        code: room.code,
        maxPlayers: room.maxPlayers,
        rounds: room.rounds,
        drawTime: room.drawTime,
        status: room.status,
        players: room.players,
        host: room.host,
      },
    });
  } catch (err) {
    console.error("Join room error:", err);
    res.status(500).json({ message: "Failed to join room" });
  }
};

// ─── GET ROOM ──────────────────────────────────────────────────────────────
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.status(200).json({ room });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET PUBLIC ROOMS ──────────────────────────────────────────────────────
// So the lobby can show open rooms players can browse and join
exports.getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      isPrivate: false,
      status: "waiting",
    })
      .select("code players maxPlayers rounds status") // only send what frontend needs
      .limit(20); // never return unlimited data

    res.status(200).json({ rooms });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
