// server/socket/socketHandler.js
const Room = require("../models/Room");
const User = require("../models/User");
const gameManager = require("./gameManager");

const CHOICE_TIME = 15;

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-room", async ({ roomCode, user }) => {
      try {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = user.id.toString();
        socket.username = user.username;
        socket.isSpectator = false;

        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit("error", { message: "Room not found" });

        const alreadyIn = room.players.find(
          (p) => p.userId.toString() === user.id.toString(),
        );

        if (alreadyIn) {
          // Reconnecting player — update socketId and avatar
          await Room.updateOne(
            { code: roomCode, "players.userId": user.id },
            {
              $set: {
                "players.$.socketId": socket.id,
                "players.$.avatar": user.avatar || "",
              },
            },
          );

          // Also sync into in-memory game
          const activeGame = gameManager.getGame(roomCode);
          if (activeGame) {
            const p = activeGame.players.find(
              (p) => p.userId.toString() === user.id.toString(),
            );
            if (p) p.socketId = socket.id;
          }
        } else if (room.status === "waiting") {
          // ── NEW PLAYER joining a waiting room ───────────────
          const activePlayers = room.players.filter((p) => !p.isSpectator);
          if (activePlayers.length >= room.maxPlayers) {
            return socket.emit("error", { message: "Room is full" });
          }

          await Room.updateOne(
            { code: roomCode },
            {
              $push: {
                players: {
                  userId: user.id,
                  username: user.username,
                  avatar: user.avatar || "",
                  socketId: socket.id,
                  isHost: false,
                  score: 0,
                },
              },
            },
          );
        } else if (room.status === "playing") {
          // ── NEW PLAYER joining a game already in progress ───
          // Like Skribbl.io: allowed if room isn't full.
          // Player starts with 0 points and joins from the next turn.
          const activePlayers = room.players.filter((p) => !p.isSpectator);
          if (activePlayers.length >= room.maxPlayers) {
            return socket.emit("error", { message: "Room is full" });
          }

          // Add to MongoDB
          await Room.updateOne(
            { code: roomCode },
            {
              $push: {
                players: {
                  userId: user.id,
                  username: user.username,
                  avatar: user.avatar || "",
                  socketId: socket.id,
                  isHost: false,
                  score: 0,
                },
              },
            },
          );

          // Add to the live in-memory game so they can guess this turn
          const activeGame = gameManager.getGame(roomCode);
          if (activeGame) {
            gameManager.addPlayer(roomCode, {
              userId: user.id.toString(),
              username: user.username,
              avatar: user.avatar || "",
              socketId: socket.id,
              score: 0,
              hasGuessedCorrectly: false,
            });
          }

          // Notify everyone a new player joined mid-game
          const freshRoom = await Room.findOne({ code: roomCode });
          if (!freshRoom) return;

          io.to(roomCode).emit("player-joined", {
            players: freshRoom.players,
            host: freshRoom.host.toString(),
            message: `${user.username} joined mid-game`,
          });

          // Send full current game state to the late joiner
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
              choosingWord: activeGame.choosingWord,
            });
          }

          return; // already emitted player-joined + game-state-sync above
        }

        // ── Sync socketId into live in-memory game (reconnect path) ────
        const activeGame = gameManager.getGame(roomCode);
        if (activeGame) {
          const p = activeGame.players.find(
            (p) => p.userId.toString() === user.id.toString(),
          );
          if (p) p.socketId = socket.id;
        }

        // Fresh room state for broadcast
        const freshRoom = await Room.findOne({ code: roomCode });
        if (!freshRoom) return;

        io.to(roomCode).emit("player-joined", {
          players: freshRoom.players,
          host: freshRoom.host.toString(),
          message: `${user.username} joined the room`,
        });

        // Send game state to reconnecting player
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
            choosingWord: activeGame.choosingWord,
          });
        }
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: join-as-spectator
    // ═══════════════════════════════════════════════════════════
    socket.on("join-as-spectator", async ({ roomCode, user }) => {
      try {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = user.id.toString();
        socket.username = user.username;
        socket.isSpectator = true;

        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit("error", { message: "Room not found" });

        const alreadyIn = room.players.find(
          (p) => p.userId.toString() === user.id.toString(),
        );

        if (!alreadyIn) {
          await Room.updateOne(
            { code: roomCode },
            {
              $push: {
                players: {
                  userId: user.id,
                  username: user.username,
                  avatar: user.avatar || "",
                  isSpectator: true,
                  socketId: socket.id,
                  score: 0,
                },
              },
            },
          );
        } else {
          await Room.updateOne(
            { code: roomCode, "players.userId": user.id },
            {
              $set: {
                "players.$.socketId": socket.id,
                "players.$.avatar": user.avatar || "",
              },
            },
          );
        }

        const activeGame = gameManager.getGame(roomCode);
        if (activeGame) {
          gameManager.addSpectator(roomCode, {
            userId: user.id.toString(),
            username: user.username,
            socketId: socket.id,
          });
        }

        const freshRoom = await Room.findOne({ code: roomCode });
        io.to(roomCode).emit("spectator-joined", {
          players: freshRoom.players,
          host: freshRoom.host.toString(),
          message: `${user.username} joined as spectator`,
        });

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
            isSpectator: true,
          });
        }
      } catch (err) {
        console.error("join-as-spectator error:", err);
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

        const activePlayers = room.players.filter((p) => !p.isSpectator);
        if (activePlayers.length < 2) {
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
          category: room.category || "all",
          customWords: room.customWords || [],
        });

        io.to(roomCode).emit("game-started", {
          message: "Game is starting!",
          players: game.players,
          rounds: game.settings.rounds,
          host: room.host.toString(),
        });

        setTimeout(() => startNewTurn(io, roomCode), 3000);
      } catch (err) {
        console.error("start-game error:", err);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: pick-word
    // ═══════════════════════════════════════════════════════════
    socket.on("pick-word", ({ roomCode, word }) => {
      const game = gameManager.getGame(roomCode);
      if (!game || !game.choosingWord) return;
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!drawer || drawer.socketId !== socket.id) return;
      beginTurn(io, roomCode, word);
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
    // EVENT: canvas-state
    // ═══════════════════════════════════════════════════════════
    socket.on("canvas-state", ({ roomCode, dataURL }) => {
      const game = gameManager.getGame(roomCode);
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!game || !drawer || !drawer.socketId || drawer.socketId !== socket.id)
        return;
      socket.to(roomCode).emit("canvas-state-broadcast", { dataURL });
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: cursor-move
    // ═══════════════════════════════════════════════════════════
    socket.on("cursor-move", ({ roomCode, x, y }) => {
      const game = gameManager.getGame(roomCode);
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!game || !drawer || !drawer.socketId || drawer.socketId !== socket.id)
        return;
      socket
        .to(roomCode)
        .emit("cursor-update", { x, y, username: socket.username });
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: shape-preview
    // ═══════════════════════════════════════════════════════════
    socket.on("shape-preview", ({ roomCode, preview }) => {
      const game = gameManager.getGame(roomCode);
      const drawer = gameManager.getCurrentDrawer(roomCode);
      if (!game || !drawer || !drawer.socketId || drawer.socketId !== socket.id)
        return;
      socket.to(roomCode).emit("shape-preview", preview);
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: send-guess
    // ═══════════════════════════════════════════════════════════
    socket.on("send-guess", ({ roomCode, guess, userId }) => {
      if (socket.isSpectator) return;
      const game = gameManager.getGame(roomCode);
      if (!game || game.status !== "playing" || game.choosingWord) return;

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
        io.to(roomCode).emit("chat-message", {
          username: result.player.username,
          message: guess,
          type: "guess",
        });

        if (result.closeLevel > 0) {
          const msg =
            result.closeLevel === 3
              ? `"${guess}" is close!`
              : result.closeLevel === 2
                ? `"${guess}" is very close!`
                : `"${guess}" is extremely close!`;
          io.to(socket.id).emit("close-guess", {
            message: msg,
            level: result.closeLevel,
          });
        }
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: react
    // ═══════════════════════════════════════════════════════════
    socket.on("react", ({ roomCode, emoji }) => {
      const allowed = ["🔥", "😂", "👏", "😮"];
      if (!allowed.includes(emoji)) return;
      io.to(roomCode).emit("reaction", { username: socket.username, emoji });
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: restart-game
    // ═══════════════════════════════════════════════════════════
    socket.on("restart-game", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        if (room.host.toString() !== socket.userId.toString()) {
          return socket.emit("error", {
            message: "Only host can restart the game",
          });
        }

        room.status = "waiting";
        await room.save();

        gameManager.deleteGame(roomCode);

        await Room.updateOne(
          { code: roomCode },
          { $set: { "players.$[].score": 0 } },
        );

        io.to(roomCode).emit("game-restarted", {
          players: room.players,
          host: room.host.toString(),
        });
      } catch (err) {
        console.error("restart-game error:", err);
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EVENT: disconnect  (8-second grace period for mobile)
    // ═══════════════════════════════════════════════════════════
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (!socket.roomCode || !socket.userId) return;

      const { roomCode, userId, username, isSpectator } = socket;

      setTimeout(async () => {
        try {
          const room = await Room.findOne({ code: roomCode });
          if (!room) return;

          const player = room.players.find(
            (p) => p.userId.toString() === userId.toString(),
          );

          // Player already reconnected with a new socketId — leave them alone
          if (!player || player.socketId !== socket.id) {
            console.log("⚡ Player reconnected, skipping removal");
            return;
          }

          console.log("❌ Removing disconnected player:", username);

          await Room.updateOne(
            { code: roomCode },
            { $pull: { players: { socketId: socket.id } } },
          );

          const updatedRoom = await Room.findOne({ code: roomCode });

          if (
            !updatedRoom ||
            updatedRoom.players.filter((p) => !p.isSpectator).length === 0
          ) {
            if (updatedRoom) await Room.deleteOne({ code: roomCode });
            gameManager.deleteGame(roomCode);
            return;
          }

          io.to(roomCode).emit("player-left", {
            username,
            players: updatedRoom.players,
            host: updatedRoom.host.toString(),
            isSpectator,
          });

          if (
            !isSpectator &&
            updatedRoom.host.toString() === userId.toString() &&
            updatedRoom.status === "waiting"
          ) {
            const newHost =
              updatedRoom.players.find((p) => !p.isSpectator) ||
              updatedRoom.players[0];

            if (newHost) {
              await Room.updateOne(
                { code: roomCode },
                {
                  $set: {
                    host: newHost.userId,
                    "players.$[el].isHost": true,
                  },
                },
                { arrayFilters: [{ "el.userId": newHost.userId }] },
              );

              const finalRoom = await Room.findOne({ code: roomCode });
              io.to(roomCode).emit("host-changed", {
                newHostId: newHost.userId.toString(),
                newHostUsername: newHost.username,
                players: finalRoom.players,
                host: newHost.userId.toString(),
              });
            }
          }

          const game = gameManager.getGame(roomCode);
          if (game) {
            if (isSpectator) {
              gameManager.removeSpectator(roomCode, userId);
            } else {
              gameManager.removePlayer(roomCode, userId);
              if (game.players.length < 2) {
                gameManager.deleteGame(roomCode);
                await Room.updateOne(
                  { code: roomCode },
                  { status: "finished" },
                );
                io.to(roomCode).emit("game-over", {
                  reason: "Not enough players",
                  finalScores: [],
                });
              }
            }
          }
        } catch (err) {
          console.error("disconnect error:", err);
        }
      }, 8000);
    });
  });
};

// ═══════════════════════════════════════════════════════════
// HELPER: startNewTurn
// ═══════════════════════════════════════════════════════════
function startNewTurn(io, roomCode) {
  const result = gameManager.prepareTurn(roomCode);
  if (!result) return;

  const { game, choices } = result;
  const drawer = gameManager.getCurrentDrawer(roomCode);

  io.to(roomCode).emit("choosing-word", {
    drawer: { id: drawer.userId, username: drawer.username },
    choiceTime: CHOICE_TIME,
    round: game.currentRound,
    maxRounds: game.settings.rounds,
  });

  if (drawer.socketId) {
    io.to(drawer.socketId).emit("word-choices", {
      choices,
      choiceTime: CHOICE_TIME,
    });
  } else {
    console.warn(`Drawer ${drawer.username} has no socketId — auto-picking`);
    beginTurn(io, roomCode, choices[0]);
    return;
  }

  game.choiceTimer = setTimeout(() => {
    const g = gameManager.getGame(roomCode);
    if (g && g.choosingWord) beginTurn(io, roomCode, choices[0]);
  }, CHOICE_TIME * 1000);
}

// ═══════════════════════════════════════════════════════════
// HELPER: beginTurn
// ═══════════════════════════════════════════════════════════
function beginTurn(io, roomCode, chosenWord) {
  const game = gameManager.pickWord(roomCode, chosenWord);
  if (!game) return;

  const drawer = gameManager.getCurrentDrawer(roomCode);

  io.to(roomCode).emit("canvas-cleared");

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
  }

  const onReveal = (newHint) => {
    io.to(roomCode).emit("hint-update", { wordHint: newHint });
  };
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

// ═══════════════════════════════════════════════════════════
// HELPER: endTurn
// ═══════════════════════════════════════════════════════════
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
    // Auto-delete after 5 minutes if nobody restarted
    setTimeout(
      async () => {
        try {
          const room = await Room.findOne({ code: roomCode });
          if (room && room.status === "finished") {
            await Room.deleteOne({ code: roomCode });
            console.log(`🧹 Auto-deleted finished room ${roomCode}`);
          }
        } catch (_) {}
      },
      5 * 60 * 1000,
    );
  } catch (err) {
    console.error("saveFinalScores error:", err);
  }
}
