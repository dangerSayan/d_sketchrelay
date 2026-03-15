// server/utils/words.js

const WORDS = [
  "elephant",
  "penguin",
  "giraffe",
  "dolphin",
  "kangaroo",
  "flamingo",
  "octopus",
  "butterfly",
  "crocodile",
  "porcupine",
  "umbrella",
  "telescope",
  "backpack",
  "helicopter",
  "submarine",
  "escalator",
  "microscope",
  "skateboard",
  "accordion",
  "parachute",
  "pizza",
  "spaghetti",
  "hamburger",
  "broccoli",
  "watermelon",
  "pancake",
  "avocado",
  "sushi",
  "pretzel",
  "icecream",
  "swimming",
  "juggling",
  "sleeping",
  "dancing",
  "climbing",
  "volcano",
  "lighthouse",
  "igloo",
  "castle",
  "pyramid",
  "rainbow",
  "thunder",
  "compass",
  "anchor",
  "trophy",
];

const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

const getWordChoices = () => {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

// Returns full hint string: "_ _ _ _ _ _ _ _"
// revealedIndices is a Set of character indices that have been revealed
const getWordHint = (word, revealedIndices = new Set()) => {
  return word
    .split("")
    .map((char, i) => {
      if (char === " ") return "  ";
      if (revealedIndices.has(i)) return char;
      return "_";
    })
    .join(" ");
};

const checkGuess = (guess, word) =>
  guess.trim().toLowerCase() === word.trim().toLowerCase();

// Levenshtein edit distance — counts minimum insertions, deletions,
// substitutions to turn 'a' into 'b'. Used for "close guess" detection.
const editDistance = (a, b) => {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

// Returns per-letter feedback for a guess vs the actual word.
// Each letter gets: 'correct' (right letter, right spot),
// 'present' (right letter, wrong spot), or 'absent'.
// This is the Wordle-style logic the client uses to colour chat bubbles.
const getLetterFeedback = (guess, word) => {
  guess = guess.toLowerCase().trim();
  word = word.toLowerCase().trim();

  const result = Array(guess.length).fill("absent");
  const wordChars = word.split("");
  const used = Array(word.length).fill(false);

  // Pass 1 — mark exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === wordChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Pass 2 — mark present (right letter, wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < wordChars.length; j++) {
      if (!used[j] && guess[i] === wordChars[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result; // e.g. ['correct','absent','present','absent']
};

// Pick a random index from the word that hasn't been revealed yet.
// Returns null if all non-space letters are already revealed.
const getNextRevealIndex = (word, revealedIndices) => {
  const candidates = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== " " && !revealedIndices.has(i)) {
      candidates.push(i);
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

module.exports = {
  WORDS,
  getRandomWord,
  getWordChoices,
  getWordHint,
  checkGuess,
  editDistance,
  getLetterFeedback,
  getNextRevealIndex,
};
