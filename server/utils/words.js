// server/utils/words.js

const WORDS = [
  // animals
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
  // objects
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
  // food
  "pizza",
  "spaghetti",
  "hamburger",
  "broccoli",
  "watermelon",
  "pancake",
  "avocado",
  "sushi",
  "pretzel",
  "ice cream",
  // actions
  "swimming",
  "juggling",
  "sleeping",
  "dancing",
  "climbing",
  // places
  "volcano",
  "lighthouse",
  "igloo",
  "castle",
  "pyramid",
  // misc
  "rainbow",
  "thunder",
  "compass",
  "anchor",
  "trophy",
];

// Returns a random word from the list
const getRandomWord = () => {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
};

// Returns 3 random DIFFERENT words for the drawer to choose from
const getWordChoices = () => {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

// Takes a word and returns the hint e.g. "elephant" → "_ _ _ _ _ _ _ _"
// We keep spaces as spaces so two-word clues feel right
const getWordHint = (word) => {
  return word
    .split("")
    .map((char) => (char === " " ? "  " : "_"))
    .join(" ");
};

// Checks if a guess is correct (case-insensitive, trimmed)
const checkGuess = (guess, word) => {
  return guess.trim().toLowerCase() === word.trim().toLowerCase();
};

module.exports = {
  WORDS,
  getRandomWord,
  getWordChoices,
  getWordHint,
  checkGuess,
};
