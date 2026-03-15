// server/socket/socketHandler.js
const Room = require("../models/Room");
const User = require("../models/User");
const gameManager = require("./gameManager");

const CHOICE_TIME = 15;

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ═══════════════════════════════════════════════════════════
    // EVENT: join-room
    //
    // ROOT CAUSE OF BUG #1 FIXED HERE:
    // Previously we did Room.updateOne() to set socketId, then Room.findOne()
    // to get the updated room. But if the player wasn't in the DB yet (first
    // join race), updateOne matched nothing, and findOne returned stale data.
    //
    // Fix: use findOneAndUpdate with upsert-style logic — if the player exists,
    // update their socketId. If they don't exist in players array, add them.
    // Then emit the authoritative room state from the DB result.
    // ═══════════════════════════════════════════════════════════
    socket.on("join-room", async ({ roomCode, user }) => {
      try {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = user.id.toString();
        socket.username = user.username;
        socket.isSpectator = false;

        // Check if player is already in the room
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        const alreadyIn = room.players.find(
          (p) => p.userId.toString() === user.id.toString(),
        );

        if (alreadyIn) {
          // Update their socketId in place
          await Room.updateOne(
            { code: roomCode, "players.userId": user.id },
            { $set: { "players.$.socketId": socket.id } },
          );
        } else if (room.status === "waiting") {
          // Add player to room (they aren't in it yet)
          await Room.updateOne(
            { code: roomCode },
            {
              $push: {
                players: {
                  userId: user.id,
                  username: user.username,
                  socketId: socket.id,
                  isHost: false,
                  score: 0,
                },
              },
            },
          );
        }

        // Sync socketId into live in-memory game if running
        const activeGame = gameManager.getGame(roomCode);
        if (activeGame) {
          const p = activeGame.players.find(
            (p) => p.userId.toString() === user.id.toString(),
          );
          if (p) p.socketId = socket.id;
        }

        // Fetch the fresh authoritative room state
        const freshRoom = await Room.findOne({ code: roomCode });
        if (!freshRoom) return;

        // Broadcast to EVERYONE in the room including the joiner
        // so all clients get the exact same updated player list
        io.to(roomCode).emit("player-joined", {
          players: freshRoom.players,
          host: freshRoom.host.toString(),
          message: `${user.username} joined the room`,
        });

        // If game is in progress, send current state to reconnecting player
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
            { $set: { "players.$.socketId": socket.id } },
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
    // EVENT: disconnect
    //
    // BUG FIX: use socketId for $pull instead of userId to avoid
    // ObjectId vs string cast mismatch that silently failed before
    // ═══════════════════════════════════════════════════════════
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (!socket.roomCode || !socket.userId) return;

      try {
        const { roomCode, userId, username, isSpectator } = socket;

        // Pull by socketId — always a plain string, never a cast issue
        await Room.updateOne(
          { code: roomCode },
          { $pull: { players: { socketId: socket.id } } },
        );

        const room = await Room.findOne({ code: roomCode });

        // Room is empty — delete it entirely
        if (!room || room.players.filter((p) => !p.isSpectator).length === 0) {
          if (room) await Room.deleteOne({ code: roomCode });
          gameManager.deleteGame(roomCode);
          return;
        }

        io.to(roomCode).emit("player-left", {
          username,
          players: room.players,
          host: room.host.toString(),
          isSpectator,
        });

        // Transfer host if host left during waiting
        if (
          !isSpectator &&
          room.host.toString() === userId.toString() &&
          room.status === "waiting"
        ) {
          const newHost =
            room.players.find((p) => !p.isSpectator) || room.players[0];
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
            const updatedRoom = await Room.findOne({ code: roomCode });
            io.to(roomCode).emit("host-changed", {
              newHostId: newHost.userId.toString(),
              newHostUsername: newHost.username,
              players: updatedRoom.players,
              host: newHost.userId.toString(),
            });
          }
        }

        // Handle in-progress game
        const game = gameManager.getGame(roomCode);
        if (game) {
          if (isSpectator) {
            gameManager.removeSpectator(roomCode, userId);
          } else {
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
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }
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

  // BUG FIX #4: explicitly clear canvas BEFORE broadcasting new-turn
  // so no stale stroke from the previous turn bleeds through
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

  // Clear canvas at end of turn too
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
  } catch (err) {
    console.error("saveFinalScores error:", err);
  }
}
