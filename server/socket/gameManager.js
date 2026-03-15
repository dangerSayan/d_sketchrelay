// server/socket/gameManager.js
const {
  getRandomWord,
  getWordHint,
  checkGuess,
  editDistance,
  getNextRevealIndex,
} = require("../utils/words");

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomCode, players, settings) {
    const game = {
      roomCode,
      players: players.map((p) => ({
        userId: p.userId.toString(),
        username: p.username,
        socketId: p.socketId || "",
        score: 0,
        hasGuessedCorrectly: false,
      })),
      settings: {
        rounds: settings.rounds || 3,
        drawTime: settings.drawTime || 80,
        maxPlayers: settings.maxPlayers || 8,
      },
      currentRound: 1,
      currentDrawerIndex: 0,
      currentWord: null,
      currentHint: null,
      revealedIndices: new Set(),
      // pendingReveal: indices that could be revealed (correct-position guesses)
      // but haven't been shown yet — we wait and pick ONE after a delay
      pendingRevealCandidates: [],
      pendingRevealTimer: null,
      revealTimer: null,
      timeLeft: settings.drawTime || 80,
      timer: null,
      status: "playing",
      roundStartTime: null,
      guessedCount: 0,
    };

    this.games.set(roomCode, game);
    return game;
  }

  getGame(roomCode) {
    return this.games.get(roomCode) || null;
  }

  deleteGame(roomCode) {
    const game = this.games.get(roomCode);
    if (game) {
      if (game.timer) clearInterval(game.timer);
      if (game.revealTimer) clearInterval(game.revealTimer);
      if (game.pendingRevealTimer) clearTimeout(game.pendingRevealTimer);
    }
    this.games.delete(roomCode);
  }

  startTurn(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    if (game.timer) clearInterval(game.timer);
    if (game.revealTimer) clearInterval(game.revealTimer);
    if (game.pendingRevealTimer) clearTimeout(game.pendingRevealTimer);

    const word = getRandomWord();
    game.currentWord = word;
    game.revealedIndices = new Set();
    game.pendingRevealCandidates = [];
    game.pendingRevealTimer = null;
    game.currentHint = getWordHint(word, game.revealedIndices);
    game.timeLeft = game.settings.drawTime;
    game.roundStartTime = Date.now();
    game.guessedCount = 0;

    game.players.forEach((p) => {
      p.hasGuessedCorrectly = false;
    });

    return game;
  }

  getTotalGuessers(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return 0;
    return game.players.length - 1;
  }

  // ─── TIMER + TIMED LETTER REVEAL ─────────────────────────────────────────
  // Letter reveal schedule:
  //   - For an N-letter word with T seconds draw time:
  //   - Reveal the FIRST letter at T * 0.4 seconds elapsed (40% of time gone)
  //   - Reveal a SECOND letter at T * 0.7 seconds elapsed (70% of time gone)
  //   - Never reveal more than 2 letters via timer (keeps it competitive)
  //   - If a correct-position guess came in, that may reveal 1 additional letter
  //     but only after a 5-second delay and only if < 2 have been revealed
  setTurnTimer(roomCode, onTick, onReveal, onEnd) {
    const game = this.getGame(roomCode);
    if (!game) return;

    const drawTime = game.settings.drawTime;
    // Thresholds: reveal letter at 40% and 70% time elapsed
    const reveal1At = Math.floor(drawTime * 0.4); // timeLeft when first reveal fires
    const reveal2At = Math.floor(drawTime * 0.3); // timeLeft when second reveal fires
    let revealsLeft = 2; // max timed reveals per turn

    game.timer = setInterval(() => {
      game.timeLeft -= 1;
      onTick(game.timeLeft);

      // First timed reveal
      if (revealsLeft === 2 && game.timeLeft <= reveal1At) {
        revealsLeft--;
        this._revealOneRandom(roomCode, onReveal);
      }

      // Second timed reveal
      if (revealsLeft === 1 && game.timeLeft <= reveal2At) {
        revealsLeft--;
        this._revealOneRandom(roomCode, onReveal);
      }

      if (game.timeLeft <= 0) {
        clearInterval(game.timer);
        game.timer = null;
        onEnd();
      }
    }, 1000);
  }

  // Internal: pick one random unrevealed letter, add to hint, call onReveal
  _revealOneRandom(roomCode, onReveal) {
    const game = this.getGame(roomCode);
    if (!game || !game.currentWord) return;

    const nextIdx = getNextRevealIndex(game.currentWord, game.revealedIndices);
    if (nextIdx === null) return; // all letters already revealed

    game.revealedIndices.add(nextIdx);
    game.currentHint = getWordHint(game.currentWord, game.revealedIndices);
    onReveal(game.currentHint);
  }

  // ─── PROCESS GUESS ────────────────────────────────────────────────────────
  processGuess(roomCode, userId, guess) {
    const game = this.getGame(roomCode);
    if (!game || !game.currentWord) return { valid: false };

    const userIdStr = userId.toString();
    const player = game.players.find((p) => p.userId.toString() === userIdStr);
    if (!player) {
      console.log(`processGuess: player not found for userId ${userIdStr}`);
      return { valid: false };
    }

    const drawer = game.players[game.currentDrawerIndex];
    if (drawer.userId.toString() === userIdStr) {
      return { valid: false, isDrawer: true };
    }

    if (player.hasGuessedCorrectly)
      return { valid: false, alreadyGuessed: true };

    const isCorrect = checkGuess(guess, game.currentWord);

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      game.guessedCount += 1;

      const timeRatio = game.timeLeft / game.settings.drawTime;
      const points = Math.floor(50 + timeRatio * 450);
      player.score += points;

      const drawerBonus = Math.floor(points * 0.2);
      drawer.score += drawerBonus;

      const guessers = game.players.filter(
        (p) => p.userId.toString() !== drawer.userId.toString(),
      );
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

    // ── WRONG GUESS: check for correct-position letters ──────────────────
    // Find all indices where this guess has the right letter in the right spot
    // and that haven't been revealed yet.
    const word = game.currentWord.toLowerCase();
    const guessLower = guess.toLowerCase().trim();
    const newCandidates = [];

    for (let i = 0; i < guessLower.length && i < word.length; i++) {
      if (guessLower[i] === word[i] && !game.revealedIndices.has(i)) {
        newCandidates.push(i);
      }
    }

    // Add new candidates to the pool (deduplicated)
    for (const idx of newCandidates) {
      if (!game.pendingRevealCandidates.includes(idx)) {
        game.pendingRevealCandidates.push(idx);
      }
    }

    // FIX: we do NOT reveal immediately. We schedule a delayed reveal of ONE
    // letter from the candidate pool. The delay is proportional to the remaining
    // time: longer remaining time = longer delay (max 8s, min 3s).
    // We only start a pending timer if one isn't already running.
    let hintUpdated = false;
    let updatedHint = null;

    if (
      newCandidates.length > 0 &&
      !game.pendingRevealTimer &&
      game.pendingRevealCandidates.length > 0
    ) {
      // Delay: between 3 and 8 seconds, proportional to time remaining
      const delaySeconds = Math.min(
        8,
        Math.max(3, Math.floor(game.timeLeft / 10)),
      );

      game.pendingRevealTimer = setTimeout(() => {
        const g = this.getGame(roomCode);
        if (!g || !g.currentWord || !g.pendingRevealCandidates.length) {
          if (g) g.pendingRevealTimer = null;
          return;
        }

        // Pick ONE random candidate from the pool
        const pool = g.pendingRevealCandidates.filter(
          (i) => !g.revealedIndices.has(i),
        );
        if (pool.length === 0) {
          g.pendingRevealTimer = null;
          return;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        g.revealedIndices.add(chosen);
        g.currentHint = getWordHint(g.currentWord, g.revealedIndices);
        g.pendingRevealCandidates = []; // clear the pool after one reveal
        g.pendingRevealTimer = null;

        // The socketHandler passes onReveal as a callback through setTurnTimer.
        // We can't call it here because we don't have the reference.
        // Instead we store the pending hint and the socketHandler polls nothing —
        // we trigger through a stored callback reference.
        if (g._onReveal) g._onReveal(g.currentHint);
      }, delaySeconds * 1000);
    }

    // Check if close (edit distance <= 2)
    const distance = editDistance(guess, game.currentWord);
    const isClose = distance <= 2 && distance > 0;

    return {
      valid: true,
      correct: false,
      isClose,
      hintUpdated, // false here — reveal happens async via setTimeout callback
      updatedHint,
      player,
    };
  }

  // Store the onReveal callback so the pending reveal timer can call it
  storeRevealCallback(roomCode, onReveal) {
    const game = this.getGame(roomCode);
    if (game) game._onReveal = onReveal;
  }

  advanceTurn(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return { gameOver: true };

    game.currentDrawerIndex += 1;

    if (game.currentDrawerIndex >= game.players.length) {
      game.currentDrawerIndex = 0;
      game.currentRound += 1;
    }

    if (game.currentRound > game.settings.rounds) {
      game.status = "finished";
      return { gameOver: true, players: game.players };
    }

    return { gameOver: false };
  }

  getCurrentDrawer(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;
    return game.players[game.currentDrawerIndex];
  }

  addPlayer(roomCode, playerData) {
    const game = this.getGame(roomCode);
    if (!game) return;
    const exists = game.players.find((p) => p.userId === playerData.userId);
    if (!exists) game.players.push(playerData);
  }

  removePlayer(roomCode, userId) {
    const game = this.getGame(roomCode);
    if (!game) return;
    game.players = game.players.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );
  }

  getScoreboard(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return [];
    return [...game.players].sort((a, b) => b.score - a.score);
  }

  getGuessedCount(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return { guessed: 0, total: 0 };
    return { guessed: game.guessedCount, total: game.players.length - 1 };
  }
}

module.exports = new GameManager();
