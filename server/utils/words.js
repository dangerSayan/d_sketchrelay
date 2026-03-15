// server/utils/words.js

const WORD_CATEGORIES = {
  animals: [
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
    "cheetah",
    "gorilla",
    "jellyfish",
    "platypus",
    "chameleon",
    "narwhal",
    "pangolin",
    "axolotl",
    "capybara",
    "armadillo",
  ],
  food: [
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
    "burrito",
    "croissant",
    "dumplings",
    "cheesecake",
    "nachos",
    "ramen",
    "taco",
    "waffle",
    "lasagna",
    "fondue",
  ],
  objects: [
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
    "boomerang",
    "chandelier",
    "periscope",
    "compass",
    "anchor",
    "trophy",
    "hourglass",
    "abacus",
    "magnifying glass",
    "safe",
  ],
  actions: [
    "swimming",
    "juggling",
    "sleeping",
    "dancing",
    "climbing",
    "skydiving",
    "surfing",
    "knitting",
    "gardening",
    "cooking",
    "painting",
    "weightlifting",
    "meditation",
    "rollerblading",
    "fishing",
    "karate",
    "hiking",
    "sneezing",
    "yawning",
    "whistling",
  ],
  places: [
    "volcano",
    "lighthouse",
    "igloo",
    "castle",
    "pyramid",
    "rainforest",
    "glacier",
    "canyon",
    "archipelago",
    "savanna",
    "treehouse",
    "space station",
    "underwater cave",
    "windmill",
    "stadium",
    "observatory",
    "library",
    "aquarium",
    "haunted house",
  ],
  movies: [
    "superhero",
    "dragon",
    "spaceship",
    "robot",
    "wizard",
    "vampire",
    "pirate",
    "ninja",
    "zombie",
    "mermaid",
    "ghost",
    "alien",
    "time machine",
    "treasure map",
    "magic wand",
    "invisibility cloak",
    "lightsaber",
    "wormhole",
    "portal",
    "teleportation",
  ],
};

const WORDS = Object.values(WORD_CATEGORIES).flat();

const getRandomWord = (category = "all", customWords = []) => {
  if (customWords && customWords.length > 0) {
    return customWords[Math.floor(Math.random() * customWords.length)];
  }
  const pool = category === "all" ? WORDS : WORD_CATEGORIES[category] || WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const getThreeChoices = (category = "all", customWords = []) => {
  const pool =
    customWords && customWords.length > 0
      ? customWords
      : category === "all"
        ? WORDS
        : WORD_CATEGORIES[category] || WORDS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [...new Set(shuffled)].slice(0, 3);
};

const getWordChoices = () => getThreeChoices();

// Multi-word hints: each word's letters shown as underscores separated by spaces.
// Words are separated from each other by THREE spaces so players can see
// how many words there are without any special character.
// e.g. "magic wand"  → "_ _ _ _ _   _ _ _ _"
// e.g. "elephant"    → "_ _ _ _ _ _ _ _"
const getWordHint = (word, revealedIndices = new Set()) => {
  const words = word.split(" ");

  if (words.length === 1) {
    return word
      .split("")
      .map((char, i) => (revealedIndices.has(i) ? char : "_"))
      .join(" ");
  }

  // Multi-word: build hint per word, separate words with 3 spaces
  let charIndex = 0;
  const wordHints = words.map((w) => {
    const hint = w
      .split("")
      .map((char, j) => (revealedIndices.has(charIndex + j) ? char : "_"))
      .join(" ");
    charIndex += w.length + 1; // +1 for the original space
    return hint;
  });

  // Three spaces between words — visually distinct without a special character
  return wordHints.join("   ");
};

const checkGuess = (guess, word) =>
  guess.trim().toLowerCase() === word.trim().toLowerCase();

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

const getLetterFeedback = (guess, word) => {
  guess = guess.toLowerCase().trim();
  word = word.toLowerCase().trim();
  const result = Array(guess.length).fill("absent");
  const wordChars = word.split("");
  const used = Array(word.length).fill(false);
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === wordChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
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
  return result;
};

const getNextRevealIndex = (word, revealedIndices) => {
  const candidates = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== " " && !revealedIndices.has(i)) candidates.push(i);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

module.exports = {
  WORDS,
  WORD_CATEGORIES,
  getRandomWord,
  getThreeChoices,
  getWordChoices,
  getWordHint,
  checkGuess,
  editDistance,
  getLetterFeedback,
  getNextRevealIndex,
};
