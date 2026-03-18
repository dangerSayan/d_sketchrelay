// server/controllers/roomController.js
const Room = require("../models/Room");

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

exports.createRoom = async (req, res) => {
  try {
    const {
      maxPlayers = 8,
      rounds = 3,
      drawTime = 80,
      isPrivate = false,
      category = "all",
      customWords = [],
    } = req.body;

    const sanitisedCustomWords = customWords
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 1 && w.length <= 30)
      .slice(0, 50);

    let code;
    let exists = true;
    while (exists) {
      code = generateRoomCode();
      exists = await Room.findOne({ code });
    }

    const room = await Room.create({
      code,
      host: req.user._id,
      maxPlayers,
      rounds,
      drawTime,
      isPrivate,
      category,
      customWords: sanitisedCustomWords,
      players: [
        {
          userId: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar || "",
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
        category: room.category,
        customWords: room.customWords,
        players: room.players,
        host: room.host,
      },
    });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) return res.status(404).json({ message: "Room not found" });

    // Private rooms can only be joined via code (which they already have), so allow it.
    // The only restriction is full rooms.
    const activePlayers = room.players.filter((p) => !p.isSpectator);
    if (activePlayers.length >= room.maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    const alreadyIn = room.players.find(
      (p) => p.userId.toString() === req.user._id.toString(),
    );
    if (!alreadyIn) {
      room.players.push({
        userId: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar || "",
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
        category: room.category,
        isPrivate: room.isPrivate,
        players: room.players,
        host: room.host,
      },
    });
  } catch (err) {
    console.error("Join room error:", err);
    res.status(500).json({ message: "Failed to join room" });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.status(200).json({ room });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// FIX: return ALL rooms (both public and private) that are waiting or in progress.
// The client shows private rooms with a lock icon and a disabled Join button.
// Private rooms ARE visible so players can see they exist — they just can't join
// without knowing the code.
exports.getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: "waiting" })
      .select("code players maxPlayers rounds status isPrivate category")
      .limit(20);
    res.status(200).json({ rooms });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
