// server/socket/socketHandler.js
const Room = require("../models/Room");
const User = require("../models/User");
const gameManager = require("./gameManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ═══════════════════════════════════════════════════════════
    // EVENT: join-room
    // ═══════════════════════════════════════════════════════════
    socket.on("join-room", async ({ roomCode, user }) => {
      try {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = user.id.toString();
        socket.username = user.username;

        // Update socketId in MongoDB
        await Room.updateOne(
          { code: roomCode, "players.userId": user.id },
          { $set: { "players.$.socketId": socket.id } },
        );

        // Sync socketId into live in-memory game state if game is running
        const activeGame = gameManager.getGame(roomCode);
        if (activeGame) {
          const player = activeGame.players.find(
            (p) => p.userId.toString() === user.id.toString(),
          );
          if (player) player.socketId = socket.id;
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        // Broadcast updated player list to everyone in the room
        io.to(roomCode).emit("player-joined", {
          players: room.players,
          message: `${user.username} joined the room`,
        });

        // If a game is already in progress (reconnecting), send current state
        if (activeGame) {
          const { guessed, total } = gameManager.getGuessedCount(roomCode);
          socket.emit("game-state-sync", {
            currentDrawer: gameManager.getCurrentDrawer(roomCode),
            wordHint: activeGame.currentHint,
            timeLeft: activeGame.timeLeft,
            scores: gameManager.getScoreboard(roomCode),
            round: activeGame.currentRound,
            maxRounds: activeGame.settings.rounds,
            guessedCount: guessed,
            totalGuessers: total,
          });
        }
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: start-game
    // ═══════════════════════════════════════════════════════════
    socket.on("start-game", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit("error", { message: "Room not found" });

        if (room.host.toString() !== socket.userId.toString()) {
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

        room.status = "playing";
        await room.save();

        const game = gameManager.createGame(roomCode, room.players, {
          rounds: room.rounds,
          drawTime: room.drawTime,
          maxPlayers: room.maxPlayers,
        });

        io.to(roomCode).emit("game-started", {
          message: "Game is starting!",
          players: game.players,
          rounds: game.settings.rounds,
        });

        setTimeout(() => startNewTurn(io, roomCode), 3000);
      } catch (err) {
        console.error("start-game error:", err);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: draw
    // ═══════════════════════════════════════════════════════════
    socket.on("draw", ({ roomCode, stroke }) => {
      const game = gameManager.getGame(roomCode);
      if (!game) return;
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!drawer || !drawer.socketId || drawer.socketId !== socket.id) return;
      socket.to(roomCode).emit("draw-broadcast", stroke);
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: clear-canvas
    // ═══════════════════════════════════════════════════════════
    socket.on("clear-canvas", ({ roomCode }) => {
      const game = gameManager.getGame(roomCode);
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!game || !drawer || !drawer.socketId || drawer.socketId !== socket.id)
        return;
      io.to(roomCode).emit("canvas-cleared");
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: send-guess
    // ═══════════════════════════════════════════════════════════
    socket.on("send-guess", ({ roomCode, guess, userId }) => {
      const game = gameManager.getGame(roomCode);
      if (!game || game.status !== "playing") return;

      const result = gameManager.processGuess(
        roomCode,
        userId.toString(),
        guess,
      );
      if (!result.valid) return;

      if (result.correct) {
        const { guessed, total } = gameManager.getGuessedCount(roomCode);
        io.to(roomCode).emit("correct-guess", {
          username: result.player.username,
          points: result.points,
          drawerBonus: result.drawerBonus,
          scores: gameManager.getScoreboard(roomCode),
          guessedCount: guessed,
          totalGuessers: total,
        });
        if (result.allGuessed) endTurn(io, roomCode);
      } else {
        // Show the wrong guess as plain chat to everyone
        io.to(roomCode).emit("chat-message", {
          username: result.player.username,
          message: guess,
          type: "guess",
        });

        // If a single letter was silently revealed in the hint, broadcast the update
        if (result.hintUpdated) {
          io.to(roomCode).emit("hint-update", { wordHint: result.updatedHint });
        }

        // Private "close" hint — ONLY to the guesser, not the drawer
        if (result.isClose) {
          io.to(socket.id).emit("close-guess", {
            message: `"${guess}" is very close!`,
          });
        }
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: disconnect
    // FIX: properly update player list on disconnect and handle host leaving
    // ═══════════════════════════════════════════════════════════
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (!socket.roomCode || !socket.userId) return;

      try {
        const { roomCode, userId, username } = socket;

        // Remove player from MongoDB
        await Room.updateOne(
          { code: roomCode },
          { $pull: { players: { userId } } },
        );

        const room = await Room.findOne({ code: roomCode });

        // Room is now empty — clean it up entirely
        if (!room || room.players.length === 0) {
          if (room) await Room.deleteOne({ code: roomCode });
          gameManager.deleteGame(roomCode);
          return;
        }

        // FIX: always broadcast the updated players array, not just a message.
        // This is what was missing — the waiting room never updated visually.
        io.to(roomCode).emit("player-left", {
          username,
          players: room.players, // send full updated list
        });

        // FIX: if the host left and the game hasn't started, transfer host
        // to the next player so the room can still be started
        if (
          room.host.toString() === userId.toString() &&
          room.status === "waiting"
        ) {
          const newHost = room.players[0];
          await Room.updateOne(
            { code: roomCode },
            {
              $set: {
                host: newHost.userId,
                "players.0.isHost": true,
              },
            },
          );
          const updatedRoom = await Room.findOne({ code: roomCode });
          io.to(roomCode).emit("host-changed", {
            newHostId: newHost.userId.toString(),
            newHostUsername: newHost.username,
            players: updatedRoom.players,
          });
        }

        // Handle in-progress game
        const game = gameManager.getGame(roomCode);
        if (game) {
          gameManager.removePlayer(roomCode, userId);

          if (game.players.length < 2) {
            gameManager.deleteGame(roomCode);
            await Room.updateOne({ code: roomCode }, { status: "finished" });
            io.to(roomCode).emit("game-over", {
              reason: "Not enough players",
              finalScores: [],
            });
          }
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });
};

// ═══════════════════════════════════════════════════════════════════
// HELPER: startNewTurn
// ═══════════════════════════════════════════════════════════════════
function startNewTurn(io, roomCode) {
  const game = gameManager.startTurn(roomCode);
  if (!game) return;

  const drawer = gameManager.getCurrentDrawer(roomCode);
  console.log(
    `New turn — drawer: ${drawer.username} | word: ${game.currentWord}`,
  );

  io.to(roomCode).emit("new-turn", {
    drawer: { id: drawer.userId, username: drawer.username },
    wordHint: game.currentHint,
    timeLeft: game.timeLeft,
    round: game.currentRound,
    maxRounds: game.settings.rounds,
    guessedCount: 0,
    totalGuessers: game.players.length - 1,
  });

  if (drawer.socketId) {
    io.to(drawer.socketId).emit("your-word", { word: game.currentWord });
  } else {
    console.warn(
      `WARNING: drawer ${drawer.username} has no socketId — your-word not sent`,
    );
  }

  const onReveal = (newHint) => {
    io.to(roomCode).emit("hint-update", { wordHint: newHint });
  };

  // Store callback so the pending-reveal timer (triggered by correct-position guesses)
  // can also call it without needing the io reference directly
  gameManager.storeRevealCallback(roomCode, onReveal);

  gameManager.setTurnTimer(
    roomCode,
    (timeLeft) => {
      io.to(roomCode).emit("timer-tick", { timeLeft });
    },
    onReveal,
    () => {
      endTurn(io, roomCode);
    },
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: endTurn
// ═══════════════════════════════════════════════════════════════════
function endTurn(io, roomCode) {
  const game = gameManager.getGame(roomCode);
  if (!game) return;

  if (game.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }
  if (game.revealTimer) {
    clearInterval(game.revealTimer);
    game.revealTimer = null;
  }

  io.to(roomCode).emit("turn-ended", {
    word: game.currentWord,
    scores: gameManager.getScoreboard(roomCode),
  });
  io.to(roomCode).emit("canvas-cleared");

  const { gameOver, players } = gameManager.advanceTurn(roomCode);

  if (gameOver) {
    saveFinalScores(roomCode, players);
    io.to(roomCode).emit("game-over", {
      finalScores: gameManager.getScoreboard(roomCode),
    });
    gameManager.deleteGame(roomCode);
  } else {
    setTimeout(() => startNewTurn(io, roomCode), 4000);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: saveFinalScores
// ═══════════════════════════════════════════════════════════════════
async function saveFinalScores(roomCode, players) {
  try {
    await Room.updateOne({ code: roomCode }, { status: "finished" });
    await Promise.all(
      players.map((p) =>
        User.updateOne(
          { _id: p.userId },
          { $inc: { totalScore: p.score, gamesPlayed: 1 } },
        ),
      ),
    );
  } catch (err) {
    console.error("saveFinalScores error:", err);
  }
}
