// server/models/Room.js
const mongoose = require("mongoose");

// Sub-schema for a player inside a room.
// Instead of storing just user IDs, we store a snapshot of the player's
// info. This way, even if the user updates their username, the room
// still shows the name they had when they joined.
const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
    socketId: { type: String, default: "" }, // we'll fill this during socket connection
    isHost: { type: Boolean, default: false },
  },
  { _id: false },
); // _id: false means MongoDB won't give each player their own _id

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // always store as uppercase e.g. "XKCD42"
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: [playerSchema], // array of player sub-documents

    // Room settings (host can configure these)
    maxPlayers: { type: Number, default: 8, min: 2, max: 12 },
    rounds: { type: Number, default: 3, min: 1, max: 5 },
    drawTime: { type: Number, default: 80, min: 30, max: 180 }, // seconds per turn

    // Game state
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"], // only these three values allowed
      default: "waiting",
    },

    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);
