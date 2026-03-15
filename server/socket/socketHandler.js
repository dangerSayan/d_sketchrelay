// server/socket/socketHandler.js

const Room = require("../models/Room");
const User = require("../models/User");
const gameManager = require("./gameManager");

// We export a function that receives 'io' (the Socket.io server instance).
// index.js will call this once: socketHandler(io)
// This pattern keeps all socket logic out of index.js
module.exports = (io) => {
  io.on("connection", (socket) => {
    // 'socket' represents ONE connected browser tab.
    // Every new connection gets a unique socket.id like "abc123xyz"
    console.log(`Socket connected: ${socket.id}`);

    // ═══════════════════════════════════════════════════════════
    // EVENT: join-room
    // Fired when a player navigates to the game room page
    // ═══════════════════════════════════════════════════════════
    socket.on("join-room", async ({ roomCode, user }) => {
      try {
        // 1. Subscribe this socket to the Socket.io channel for this room.
        //    After this, io.to(roomCode).emit(...) will reach this socket.
        socket.join(roomCode);

        // 2. Store context on the socket object itself.
        //    This lets us identify WHO this socket belongs to on disconnect.
        socket.roomCode = roomCode;
        socket.userId = user.id;
        socket.username = user.username;

        // 3. Update the player's socketId in MongoDB so we know
        //    which socket belongs to which player
        await Room.updateOne(
          { code: roomCode, "players.userId": user.id },
          { $set: { "players.$.socketId": socket.id } },
        );

        // 4. Fetch fresh room data to broadcast to everyone
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        // 5. Tell EVERYONE in the room (including the new joiner)
        //    that the player list has updated
        io.to(roomCode).emit("player-joined", {
          players: room.players,
          message: `${user.username} joined the room`,
        });

        // 6. If a game is already in progress (reconnecting player),
        //    send them the current game state so they can catch up
        const activeGame = gameManager.getGame(roomCode);
        if (activeGame) {
          socket.emit("game-state-sync", {
            currentDrawer: gameManager.getCurrentDrawer(roomCode),
            wordHint: activeGame.currentHint,
            timeLeft: activeGame.timeLeft,
            scores: gameManager.getScoreboard(roomCode),
            round: activeGame.currentRound,
            maxRounds: activeGame.settings.rounds,
          });
        }
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: start-game
    // Only the host can trigger this
    // ═══════════════════════════════════════════════════════════
    socket.on("start-game", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit("error", { message: "Room not found" });

        // Security: only the host can start the game
        if (room.host.toString() !== socket.userId) {
          return socket.emit("error", {
            message: "Only the host can start the game",
          });
        }
        if (room.players.length < 2) {
          return socket.emit("error", {
            message: "Need at least 2 players to start",
          });
        }
        if (room.status !== "waiting") {
          return socket.emit("error", { message: "Game already started" });
        }

        // Update room status in DB
        room.status = "playing";
        await room.save();

        // Create in-memory game state
        const game = gameManager.createGame(roomCode, room.players, {
          rounds: room.rounds,
          drawTime: room.drawTime,
          maxPlayers: room.maxPlayers,
        });

        // Tell everyone the game is starting
        io.to(roomCode).emit("game-started", {
          message: "Game is starting!",
          players: game.players,
          rounds: game.settings.rounds,
        });

        // Small delay so clients can navigate to the game view,
        // then kick off the first turn
        setTimeout(() => startNewTurn(io, roomCode), 3000);
      } catch (err) {
        console.error("start-game error:", err);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: draw
    // Fired continuously as the drawer moves their mouse
    // This is the highest-frequency event — keep it lean
    // ═══════════════════════════════════════════════════════════
    socket.on("draw", ({ roomCode, stroke }) => {
      // Security: only broadcast if this socket is actually the drawer
      const game = gameManager.getGame(roomCode);
      if (!game) return;

      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!drawer || drawer.socketId !== socket.id) return; // not the drawer, ignore

      // socket.to() = everyone in the room EXCEPT the sender
      // The sender already drew it locally — no need to send it back to them
      socket.to(roomCode).emit("draw-broadcast", stroke);
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: clear-canvas
    // Drawer can wipe the canvas clean
    // ═══════════════════════════════════════════════════════════
    socket.on("clear-canvas", ({ roomCode }) => {
      const game = gameManager.getGame(roomCode);
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!game || !drawer || drawer.socketId !== socket.id) return;

      // io.to() = everyone INCLUDING the sender
      // The drawer's canvas also needs to clear
      io.to(roomCode).emit("canvas-cleared");
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: send-guess
    // Non-drawers send their guesses through here
    // This also doubles as the chat message handler
    // ═══════════════════════════════════════════════════════════
    socket.on("send-guess", ({ roomCode, guess, userId }) => {
      const game = gameManager.getGame(roomCode);
      if (!game || game.status !== "playing") return;

      const result = gameManager.processGuess(roomCode, userId, guess);

      if (!result.valid) {
        // Silently ignore invalid attempts (drawer guessing, already guessed)
        return;
      }

      if (result.correct) {
        // Broadcast the correct guess celebration to everyone
        io.to(roomCode).emit("correct-guess", {
          username: result.player.username,
          points: result.points,
          drawerBonus: result.drawerBonus,
          scores: gameManager.getScoreboard(roomCode),
        });

        // If everyone has guessed, end the turn early
        if (result.allGuessed) {
          endTurn(io, roomCode);
        }
      } else {
        // Wrong guess — broadcast as a chat message so everyone can see it
        // The word is NOT revealed in wrong guesses
        io.to(roomCode).emit("chat-message", {
          username: result.player.username,
          message: guess,
          type: "guess", // frontend can style guesses differently from chat
        });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: disconnect
    // Fires automatically when a browser tab closes or loses connection
    // ═══════════════════════════════════════════════════════════
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // socket.roomCode and socket.userId were set in join-room
      // If they're missing, this socket never joined a game room
      if (!socket.roomCode || !socket.userId) return;

      try {
        const { roomCode, userId, username } = socket;

        // Tell the room this player left
        io.to(roomCode).emit("player-left", { username });

        // Remove from MongoDB
        await Room.updateOne(
          { code: roomCode },
          { $pull: { players: { userId } } },
        );

        // If a game was active, remove from in-memory state too
        const game = gameManager.getGame(roomCode);
        if (game) {
          gameManager.removePlayer(roomCode, userId);

          // If fewer than 2 players remain, end the game
          if (game.players.length < 2) {
            gameManager.deleteGame(roomCode);
            await Room.updateOne({ code: roomCode }, { status: "finished" });
            io.to(roomCode).emit("game-over", {
              reason: "Not enough players",
              finalScores: [],
            });
          }
        }

        // If the room is now empty, clean it up from MongoDB
        const room = await Room.findOne({ code: roomCode });
        if (room && room.players.length === 0) {
          await Room.deleteOne({ code: roomCode });
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: startNewTurn
// Called at game start and after each turn ends.
// Defined outside io.on('connection') because it's called recursively
// via setTimeout — it doesn't need the 'socket' variable.
// ═══════════════════════════════════════════════════════════════════
function startNewTurn(io, roomCode) {
  const game = gameManager.startTurn(roomCode);
  if (!game) return;

  const drawer = gameManager.getCurrentDrawer(roomCode);

  // Tell everyone who's drawing and the word hint (underscores)
  io.to(roomCode).emit("new-turn", {
    drawer: { id: drawer.userId, username: drawer.username },
    wordHint: game.currentHint,
    timeLeft: game.timeLeft,
    round: game.currentRound,
    maxRounds: game.settings.rounds,
  });

  // Tell ONLY the drawer their actual word — using socket.to with a specific socketId
  // This is a Socket.io feature: you can emit to a specific socket by its ID
  io.to(drawer.socketId).emit("your-word", { word: game.currentWord });

  // Start the countdown timer
  // onTick: fires every second, broadcasts the remaining time
  // onEnd:  fires when time runs out
  gameManager.setTurnTimer(
    roomCode,
    (timeLeft) => {
      io.to(roomCode).emit("timer-tick", { timeLeft });
    },
    () => {
      endTurn(io, roomCode);
    },
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: endTurn
// Called either when time runs out OR when everyone guesses correctly
// ═══════════════════════════════════════════════════════════════════
function endTurn(io, roomCode) {
  const game = gameManager.getGame(roomCode);
  if (!game) return;

  // Stop the timer immediately
  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }

  // Reveal the word to everyone
  io.to(roomCode).emit("turn-ended", {
    word: game.currentWord,
    scores: gameManager.getScoreboard(roomCode),
  });

  // Clear the canvas for the next turn
  io.to(roomCode).emit("canvas-cleared");

  // Check if the game should continue or end
  const { gameOver, players } = gameManager.advanceTurn(roomCode);

  if (gameOver) {
    // Save final scores to DB, then emit game-over
    saveFinalScores(roomCode, players);

    io.to(roomCode).emit("game-over", {
      finalScores: gameManager.getScoreboard(roomCode),
    });

    gameManager.deleteGame(roomCode);
  } else {
    // Wait 4 seconds (so players can see the revealed word + scores)
    // then start the next turn
    setTimeout(() => startNewTurn(io, roomCode), 4000);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: saveFinalScores
// Persists the game results to MongoDB asynchronously
// ═══════════════════════════════════════════════════════════════════
async function saveFinalScores(roomCode, players) {
  try {
    // Update room status
    await Room.updateOne({ code: roomCode }, { status: "finished" });

    // Add each player's earned score to their lifetime total
    // Promise.all runs all DB updates in parallel — much faster than sequentially
    await Promise.all(
      players.map((p) =>
        User.updateOne(
          { _id: p.userId },
          {
            $inc: { totalScore: p.score, gamesPlayed: 1 },
            // $inc adds to the existing value rather than replacing it
          },
        ),
      ),
    );
  } catch (err) {
    console.error("saveFinalScores error:", err);
  }
}
