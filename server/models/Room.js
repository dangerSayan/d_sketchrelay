// server/models/Room.js
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true },
    avatar: { type: String, default: "" },
    score: { type: Number, default: 0 },
    socketId: { type: String, default: "" },
    isHost: { type: Boolean, default: false },
    isSpectator: { type: Boolean, default: false }, // NEW: spectator flag
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    players: [playerSchema],
    maxPlayers: { type: Number, default: 8, min: 2, max: 20 },
    rounds: { type: Number, default: 3, min: 1, max: 5 },
    drawTime: { type: Number, default: 80, min: 30, max: 180 },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    isPrivate: { type: Boolean, default: false },
    // NEW: word category ('all' | 'animals' | 'food' | 'objects' | 'actions' | 'places' | 'movies')
    category: { type: String, default: "all" },
    // NEW: custom words typed by the host (stored as array, max 50)
    customWords: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);
