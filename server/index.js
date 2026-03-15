const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes"); // ADD THIS
const roomRoutes = require("./routes/roomRoutes"); // ADD THIS
const socketHandler = require("./socket/socketHandler"); // ADD THIS

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://d-sketchrelay.vercel.app", // you'll fill this in after Vercel deploy
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// Mount the auth router at '/api/auth'
// This means: any request starting with /api/auth goes to authRoutes
// authRoutes then handles /register, /login, /me relative to that prefix
app.use("/api/auth", authRoutes); // ADD THIS
app.use("/api/rooms", roomRoutes); // ADD THIS

app.get("/", (req, res) => {
  res.json({ message: "Skribbl server is running!" });
});

// Replace the old io.on('connection',...) block with this one line:
socketHandler(io); // ADD THIS — wires all socket events

connectDB().then(() => {
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});
