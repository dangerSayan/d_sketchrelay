// server/utils/words.js

const WORD_CATEGORIES = {
  animals: [
    "cat",
    "dog",
    "elephant",
    "penguin",
    "giraffe",
    "rabbit",
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
    "parrot",
    "turtle",
    "owl",
    "fox",
    "panda",
    "koala",
    "sloth",
    "hedgehog",
    "whale",
    "seahorse",
    "starfish",
    "lobster",
    "raccoon",
    "squirrel",
    "peacock",
    "penguin",
    "parrot",
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
    "ice cream",
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
    "sandwich",
    "cupcake",
    "hot dog",
    "banana",
    "strawberry",
    "smoothie",
    "popcorn",
    "french fries",
    "popsicle",
    "donut",
  ],
  objects: [
    "umbrella",
    "telescope",
    "backpack",
    "helicopter",
    "submarine",
    "microscope",
    "skateboard",
    "accordion",
    "parachute",
    "boomerang",
    "compass",
    "anchor",
    "trophy",
    "hourglass",
    "abacus",
    "magnifying glass",
    "safe",
    "lighthouse",
    "camera",
    "basketball",
    "guitar",
    "piano",
    "violin",
    "bicycle",
    "robot",
    "castle",
    "rainbow",
    "train",
    "rocket",
  ],
  actions: [
    "swimming",
    "juggling",
    "sleeping",
    "dancing",
    "climbing",
    "jumping",
    "skipping",
    "running",
    "walking",
    "painting",
    "cooking",
    "baking",
    "drawing",
    "singing",
    "laughing",
    "sneezing",
    "yawning",
    "whistling",
    "flying",
    "riding a bike",
    "snowboarding",
    "skiing",
    "surfing",
    "gardening",
    "fishing",
    "reading",
    "typing",
    "phone call",
    "playing guitar",
    "playing soccer",
  ],
  places: [
    "park",
    "beach",
    "school",
    "space station",
    "volcano",
    "castle",
    "igloo",
    "rainforest",
    "aquarium",
    "farm",
    "canyon",
    "lighthouse",
    "mountain",
    "desert",
    "treehouse",
    "library",
    "stadium",
    "zoo",
    "playground",
    "museum",
    "cave",
    "island",
    "waterfall",
    "jungle",
    "farmhouse",
    "barn",
    "city street",
    "fairground",
    "airport",
  ],
  movies: [
    "superhero",
    "dragon",
    "spaceship",
    "robot",
    "wizard",
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
    "portal",
    "teleportation",
    "fairy tale",
    "space adventure",
    "jungle quest",
    "underwater",
    "carnival",
    "time travel",
    "supervillain",
    "talking animal",
    "mystery",
    "comedy",
    "detective",
    "musical",
  ],
  characters: [
    "pirate",
    "princess",
    "genie",
    "knight",
    "alien",
    "robot",
    "vampire",
    "skeleton",
    "cowboy",
    "fairy",
    "monster",
    "ninja",
    "detective",
    "superhero",
    "dragon",
    "mermaid",
    "wizard",
    "chef",
    "astronaut",
    "zookeeper",
    "mime",
    "robot",
    "ghost",
    "clown",
    "sports star",
    "teacher",
    "scientist",
    "painter",
    "dancer",
    " farmer",
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
