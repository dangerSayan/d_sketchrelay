// server/test-socket.js  — run this with: node test-socket.js
// Delete this file after testing. It's just for learning.

const { io } = require("socket.io-client");

// Simulate Player A
const socketA = io("http://localhost:5000");
// Simulate Player B
const socketB = io("http://localhost:5000");

socketA.on("connect", () => {
  console.log("Player A connected:", socketA.id);

  // Player A joins a room
  socketA.emit("join-room", {
    roomCode: "UDUFTP",
    user: { id: "69b64dfa57e88c5400d11a6e", username: "testuser" },
  });
});

socketB.on("connect", () => {
  console.log("Player B connected:", socketB.id);

  // Player B joins the same room after a short delay
  setTimeout(() => {
    socketB.emit("join-room", {
      roomCode: "UDUFTP",
      user: { id: "69b653334bcebf876a027fbc", username: "testuser2" },
    });
  }, 500);
});

// Both sockets listen for player-joined
socketA.on("player-joined", (data) => {
  console.log(
    "A sees player-joined:",
    data.message,
    "| Players:",
    data.players.length,
  );
});

socketB.on("player-joined", (data) => {
  console.log(
    "B sees player-joined:",
    data.message,
    "| Players:",
    data.players.length,
  );
});

// Player A sends a draw event after 1 second
setTimeout(() => {
  console.log("\nA emits a draw stroke...");
  socketA.emit("draw", {
    roomCode: "UDUFTP",
    stroke: { x0: 10, y0: 20, x1: 30, y1: 40, color: "#000000", size: 4 },
  });
}, 1000);

// Player B listens for draw-broadcast
socketB.on("draw-broadcast", (stroke) => {
  console.log("B received draw-broadcast:", stroke);
});

// Player B sends a guess after 1.5 seconds
setTimeout(() => {
  console.log('\nB guesses "elephant"...');
  socketB.emit("send-guess", {
    roomCode: "UDUFTP",
    guess: "elephant",
    userId: "69b653334bcebf876a027fbc",
  });
}, 1500);

// Both listen for chat-message (wrong guesses appear here)
socketA.on("chat-message", (data) => {
  console.log(`A sees chat: [${data.username}] ${data.message}`);
});
socketB.on("chat-message", (data) => {
  console.log(`B sees chat: [${data.username}] ${data.message}`);
});

// Close after 3 seconds
setTimeout(() => {
  console.log("\nTest complete. Closing connections.");
  socketA.disconnect();
  socketB.disconnect();
  process.exit(0);
}, 3000);
