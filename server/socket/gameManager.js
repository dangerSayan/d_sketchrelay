// server/socket/gameManager.js
const { getRandomWord, getWordHint, checkGuess } = require("../utils/words");

// A Map is like a JavaScript object, but better for this use case.
// Key: room code (string), Value: game state object
// Map gives us fast lookup, easy deletion, and doesn't pollute the prototype.
class GameManager {
  constructor() {
    this.games = new Map();
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  // Called when the host starts the game.
  // 'players' comes from the Room document in MongoDB.
  createGame(roomCode, players, settings) {
    const game = {
      roomCode,
      // Copy players array and reset scores for a fresh game
      players: players.map((p) => ({
        userId: p.userId.toString(), // convert ObjectId to plain string
        username: p.username,
        socketId: p.socketId,
        score: 0,
        hasGuessedCorrectly: false,
      })),
      settings: {
        rounds: settings.rounds || 3,
        drawTime: settings.drawTime || 80,
        maxPlayers: settings.maxPlayers || 8,
      },
      currentRound: 1,
      currentDrawerIndex: 0, // index into the players array
      currentWord: null,
      currentHint: null,
      timeLeft: settings.drawTime || 80,
      timer: null, // will hold the setInterval reference
      status: "playing",
      roundStartTime: null,
    };

    this.games.set(roomCode, game);
    return game;
  }

  // ─── GET ───────────────────────────────────────────────────────────────────
  getGame(roomCode) {
    return this.games.get(roomCode) || null;
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  deleteGame(roomCode) {
    const game = this.games.get(roomCode);
    if (game && game.timer) {
      clearInterval(game.timer); // always clear timers to prevent memory leaks
    }
    this.games.delete(roomCode);
  }

  // ─── START TURN ────────────────────────────────────────────────────────────
  // Sets up the state for a new drawing turn.
  // Returns the game state so the socket handler can emit events.
  startTurn(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    // Clear any existing timer from the previous turn
    if (game.timer) clearInterval(game.timer);

    // Reset per-turn state
    const word = getRandomWord();
    game.currentWord = word;
    game.currentHint = getWordHint(word);
    game.timeLeft = game.settings.drawTime;
    game.roundStartTime = Date.now();

    // Reset everyone's "hasGuessedCorrectly" flag for the new turn
    game.players.forEach((p) => {
      p.hasGuessedCorrectly = false;
    });

    return game;
  }

  // ─── SET TIMER ─────────────────────────────────────────────────────────────
  // We pass an onTick and onEnd callback so the timer can emit socket events.
  // GameManager itself doesn't know about Socket.io — that's the socket
  // handler's job. GameManager only manages data.
  setTurnTimer(roomCode, onTick, onEnd) {
    const game = this.getGame(roomCode);
    if (!game) return;

    // setInterval calls the function every 1000ms (1 second)
    game.timer = setInterval(() => {
      game.timeLeft -= 1;
      onTick(game.timeLeft); // fire the tick callback with current time

      if (game.timeLeft <= 0) {
        clearInterval(game.timer);
        game.timer = null;
        onEnd(); // fire the end callback when time runs out
      }
    }, 1000);
  }

  // ─── PROCESS GUESS ─────────────────────────────────────────────────────────
  // Returns an object describing what happened with the guess.
  processGuess(roomCode, userId, guess) {
    const game = this.getGame(roomCode);
    if (!game || !game.currentWord) return { valid: false };

    const player = game.players.find((p) => p.userId === userId);
    if (!player) return { valid: false };

    // Don't let the drawer guess their own word
    const drawer = game.players[game.currentDrawerIndex];
    if (drawer.userId === userId) return { valid: false, isDrawer: true };

    // Don't let someone guess again after they've already gotten it right
    if (player.hasGuessedCorrectly)
      return { valid: false, alreadyGuessed: true };

    const isCorrect = checkGuess(guess, game.currentWord);

    if (isCorrect) {
      player.hasGuessedCorrectly = true;

      // Score formula: more points for guessing faster
      // timeLeft/drawTime gives a ratio between 0 and 1
      // Multiply by 500 so the max is 500 points
      const timeRatio = game.timeLeft / game.settings.drawTime;
      const points = Math.floor(50 + timeRatio * 450); // 50 to 500
      player.score += points;

      // Give the drawer points too (20% of what the guesser earned)
      const drawerBonus = Math.floor(points * 0.2);
      drawer.score += drawerBonus;

      // Check if everyone (except the drawer) has guessed correctly
      const guessers = game.players.filter((p) => p.userId !== drawer.userId);
      const allGuessed = guessers.every((p) => p.hasGuessedCorrectly);

      return {
        valid: true,
        correct: true,
        points,
        drawerBonus,
        allGuessed,
        player,
      };
    }

    return { valid: true, correct: false, player };
  }

  // ─── ADVANCE TURN ──────────────────────────────────────────────────────────
  // Move to the next drawer. Returns true if the game should end.
  advanceTurn(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return { gameOver: true };

    game.currentDrawerIndex += 1;

    // If we've gone through all players, increment the round
    if (game.currentDrawerIndex >= game.players.length) {
      game.currentDrawerIndex = 0;
      game.currentRound += 1;
    }

    // If we've finished all rounds, the game is over
    if (game.currentRound > game.settings.rounds) {
      game.status = "finished";
      return { gameOver: true, players: game.players };
    }

    return { gameOver: false };
  }

  // ─── GET CURRENT DRAWER ────────────────────────────────────────────────────
  getCurrentDrawer(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;
    return game.players[game.currentDrawerIndex];
  }

  // ─── ADD / REMOVE PLAYER ───────────────────────────────────────────────────
  addPlayer(roomCode, playerData) {
    const game = this.getGame(roomCode);
    if (!game) return;
    const exists = game.players.find((p) => p.userId === playerData.userId);
    if (!exists) game.players.push(playerData);
  }

  removePlayer(roomCode, userId) {
    const game = this.getGame(roomCode);
    if (!game) return;
    game.players = game.players.filter((p) => p.userId !== userId);
  }

  // ─── GET SCORES ────────────────────────────────────────────────────────────
  getScoreboard(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return [];
    // Return sorted by score, highest first
    return [...game.players].sort((a, b) => b.score - a.score);
  }
}

// Export a single instance (singleton pattern).
// Every file that requires this gets the SAME instance,
// so the game state is shared across your whole server.
module.exports = new GameManager();
