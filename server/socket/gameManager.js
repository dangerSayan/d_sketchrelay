// server/socket/gameManager.js
const {
  getThreeChoices,
  getWordHint,
  checkGuess,
  editDistance,
  getNextRevealIndex,
} = require("../utils/words");

// Maximum letters that can ever be revealed in one turn (timed + guess-triggered combined)
const MAX_REVEALS = 3;

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomCode, players, settings) {
    const activePlayers = players.filter((p) => !p.isSpectator);
    const spectators = players.filter((p) => p.isSpectator);

    const game = {
      roomCode,
      players: activePlayers.map((p) => ({
        userId: p.userId.toString(),
        username: p.username,
        avatar: p.avatar || "",
        socketId: p.socketId || "",
        score: 0,
        hasGuessedCorrectly: false,
      })),
      spectators: spectators.map((p) => ({
        userId: p.userId.toString(),
        username: p.username,
        avatar: p.avatar || "",
        socketId: p.socketId || "",
      })),

      settings: {
        rounds: settings.rounds || 3,
        drawTime: settings.drawTime || 80,
        maxPlayers: settings.maxPlayers || 8,
        category: settings.category || "all",
        customWords: settings.customWords || [],
      },
      currentRound: 1,
      currentDrawerIndex: 0,
      currentWord: null,
      currentHint: null,
      wordChoices: null,
      choosingWord: false,
      choiceTimer: null,
      revealedIndices: new Set(),
      totalRevealCount: 0, // tracks total letters revealed this turn
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
      if (game.choiceTimer) clearTimeout(game.choiceTimer);
    }
    this.games.delete(roomCode);
  }

  prepareTurn(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    if (game.timer) clearInterval(game.timer);
    if (game.revealTimer) clearInterval(game.revealTimer);
    if (game.pendingRevealTimer) clearTimeout(game.pendingRevealTimer);
    if (game.choiceTimer) clearTimeout(game.choiceTimer);

    const choices = getThreeChoices(
      game.settings.category,
      game.settings.customWords,
    );
    game.wordChoices = choices;
    game.choosingWord = true;
    game.currentWord = null;
    game.currentHint = null;

    return { game, choices };
  }

  pickWord(roomCode, chosenWord) {
    const game = this.getGame(roomCode);
    if (!game) return null;

    if (game.choiceTimer) {
      clearTimeout(game.choiceTimer);
      game.choiceTimer = null;
    }

    const validWord =
      game.wordChoices && game.wordChoices.includes(chosenWord)
        ? chosenWord
        : game.wordChoices
          ? game.wordChoices[0]
          : chosenWord;

    game.currentWord = validWord;
    game.choosingWord = false;
    game.wordChoices = null;
    game.revealedIndices = new Set();
    game.totalRevealCount = 0;
    game.pendingRevealCandidates = [];
    game.pendingRevealTimer = null;
    game.currentHint = getWordHint(validWord, game.revealedIndices);
    game.timeLeft = game.settings.drawTime;
    game.roundStartTime = Date.now();
    game.guessedCount = 0;

    game.players.forEach((p) => {
      p.hasGuessedCorrectly = false;
    });

    return game;
  }

  startTurn(roomCode) {
    const result = this.prepareTurn(roomCode);
    if (!result) return null;
    return this.pickWord(roomCode, result.choices[0]);
  }

  getTotalGuessers(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return 0;
    return game.players.length - 1;
  }

  // ─── TIMER + LETTER REVEAL ────────────────────────────────────────────────
  // Reveal schedule (much harder than before):
  //   Reveal 1 — at 65% time elapsed  (e.g. at 28s left of 80s)
  //   Reveal 2 — at 85% time elapsed  (e.g. at 12s left of 80s)
  // Never more than 2 timed reveals. Combined with guess-triggered reveals
  // the hard cap is MAX_REVEALS (3) total per turn.
  setTurnTimer(roomCode, onTick, onReveal, onEnd) {
    const game = this.getGame(roomCode);
    if (!game) return;

    const drawTime = game.settings.drawTime;

    // timeLeft values at which each timed reveal fires
    // 65% elapsed = 35% remaining, 85% elapsed = 15% remaining
    const reveal1At = Math.floor(drawTime * 0.35);
    const reveal2At = Math.floor(drawTime * 0.15);
    let timedRevealsLeft = 2;

    game.timer = setInterval(() => {
      game.timeLeft -= 1;
      onTick(game.timeLeft);

      if (timedRevealsLeft === 2 && game.timeLeft <= reveal1At) {
        timedRevealsLeft--;
        this._revealOneRandom(roomCode, onReveal);
      }

      if (timedRevealsLeft === 1 && game.timeLeft <= reveal2At) {
        timedRevealsLeft--;
        this._revealOneRandom(roomCode, onReveal);
      }

      if (game.timeLeft <= 0) {
        clearInterval(game.timer);
        game.timer = null;
        onEnd();
      }
    }, 1000);
  }

  // Internal: reveal one random unrevealed letter, respecting MAX_REVEALS cap
  _revealOneRandom(roomCode, onReveal) {
    const game = this.getGame(roomCode);
    if (!game || !game.currentWord) return;
    if (game.totalRevealCount >= MAX_REVEALS) return; // hard cap

    const nextIdx = getNextRevealIndex(game.currentWord, game.revealedIndices);
    if (nextIdx === null) return;

    game.revealedIndices.add(nextIdx);
    game.totalRevealCount++;
    game.currentHint = getWordHint(game.currentWord, game.revealedIndices);
    onReveal(game.currentHint);
  }

  // ─── PROCESS GUESS ────────────────────────────────────────────────────────
  processGuess(roomCode, userId, guess) {
    const game = this.getGame(roomCode);
    if (!game || !game.currentWord) return { valid: false };

    const userIdStr = userId.toString();
    const player = game.players.find((p) => p.userId.toString() === userIdStr);
    if (!player) return { valid: false };

    const drawer = game.players[game.currentDrawerIndex];
    if (drawer.userId.toString() === userIdStr)
      return { valid: false, isDrawer: true };
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

    // ── Correct-position letter candidates ───────────────────────────────
    // Only collect candidates if we haven't hit the reveal cap yet
    if (game.totalRevealCount < MAX_REVEALS) {
      const word = game.currentWord.toLowerCase();
      const guessLower = guess.toLowerCase().trim();
      const newCandidates = [];

      for (let i = 0; i < guessLower.length && i < word.length; i++) {
        if (guessLower[i] === word[i] && !game.revealedIndices.has(i)) {
          newCandidates.push(i);
        }
      }

      for (const idx of newCandidates) {
        if (!game.pendingRevealCandidates.includes(idx)) {
          game.pendingRevealCandidates.push(idx);
        }
      }

      // Schedule a delayed reveal — only one pending timer at a time
      // Delay is longer when more time remains (harder early, hint later)
      // Range: 10s (lots of time left) → 5s (almost out of time)
      if (
        newCandidates.length > 0 &&
        !game.pendingRevealTimer &&
        game.pendingRevealCandidates.length > 0
      ) {
        const delaySeconds = Math.min(
          12,
          Math.max(5, Math.floor(game.timeLeft / 6)),
        );

        game.pendingRevealTimer = setTimeout(() => {
          const g = this.getGame(roomCode);
          if (!g || !g.currentWord || !g.pendingRevealCandidates.length) {
            if (g) g.pendingRevealTimer = null;
            return;
          }
          if (g.totalRevealCount >= MAX_REVEALS) {
            g.pendingRevealTimer = null;
            return;
          }

          const pool = g.pendingRevealCandidates.filter(
            (i) => !g.revealedIndices.has(i),
          );
          if (pool.length === 0) {
            g.pendingRevealTimer = null;
            return;
          }

          const chosen = pool[Math.floor(Math.random() * pool.length)];
          g.revealedIndices.add(chosen);
          g.totalRevealCount++;
          g.currentHint = getWordHint(g.currentWord, g.revealedIndices);
          g.pendingRevealCandidates = [];
          g.pendingRevealTimer = null;
          if (g._onReveal) g._onReveal(g.currentHint);
        }, delaySeconds * 1000);
      }
    }

    // ── Graduated close-guess detection ──────────────────────────────────
    // closeLevel 1 = extremely close (distance 1)
    // closeLevel 2 = very close      (distance 2)
    // closeLevel 3 = close           (distance 3)
    // closeLevel 0 = not close
    const dist = editDistance(guess, game.currentWord);
    const closeLevel = dist === 1 ? 1 : dist === 2 ? 2 : dist === 3 ? 3 : 0;

    return {
      valid: true,
      correct: false,
      closeLevel,
      hintUpdated: false,
      updatedHint: null,
      player,
    };
  }

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

  addSpectator(roomCode, playerData) {
    const game = this.getGame(roomCode);
    if (!game) return;
    const exists = game.spectators.find((s) => s.userId === playerData.userId);
    if (!exists) game.spectators.push(playerData);
  }

  removeSpectator(roomCode, userId) {
    const game = this.getGame(roomCode);
    if (!game) return;
    game.spectators = game.spectators.filter(
      (s) => s.userId.toString() !== userId.toString(),
    );
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
