// client/src/utils/avatar.js
// ═══════════════════════════════════════════════════════════════════════════
// AVATAR SYSTEM — 3 independent choices combined into one string:
//   format: "icon::bgId::frameId"   e.g.  "🐉::bg_purple::neon_pink"
//
// Characters: 180+ emoji across 14 categories
// Backgrounds: 80+ gradient & radial presets
// Frames: 40+ neon & style ring presets
// Total combinations: 180 × 80 × 40 = 576,000+ unique avatars
// ═══════════════════════════════════════════════════════════════════════════

// ── CHARACTERS ───────────────────────────────────────────────────────────
export const AVATAR_CHARACTERS = [
  // ── WARRIORS (16) ─────────────────────────────────────────────────────
  { id: "⚔️", label: "Knight", category: "Warriors" },
  { id: "🗡️", label: "Samurai", category: "Warriors" },
  { id: "🥷", label: "Ninja", category: "Warriors" },
  { id: "🛡️", label: "Guardian", category: "Warriors" },
  { id: "🏹", label: "Archer", category: "Warriors" },
  { id: "🪓", label: "Berserker", category: "Warriors" },
  { id: "💣", label: "Demolisher", category: "Warriors" },
  { id: "⚒️", label: "Duelist", category: "Warriors" },
  { id: "🗺️", label: "Tactician", category: "Warriors" },
  { id: "🏴‍☠️", label: "Pirate", category: "Warriors" },
  { id: "⚙️", label: "Engineer", category: "Warriors" },
  { id: "🔱", label: "Warlord", category: "Warriors" },
  { id: "🛡", label: "Paladin", category: "Warriors" },
  { id: "🗼", label: "Sentinel", category: "Warriors" },
  { id: "🔰", label: "Rookie", category: "Warriors" },
  { id: "⚜️", label: "Commander", category: "Warriors" },

  // ── CYBER (16) ─────────────────────────────────────────────────────────
  { id: "🤖", label: "Android", category: "Cyber" },
  { id: "👾", label: "Alien", category: "Cyber" },
  { id: "🦾", label: "Cyborg", category: "Cyber" },
  { id: "🛸", label: "Abductor", category: "Cyber" },
  { id: "🛰️", label: "Satellite", category: "Cyber" },
  { id: "☄️", label: "Comet", category: "Cyber" },
  { id: "🔫", label: "Laser", category: "Cyber" },
  { id: "💻", label: "Hacker", category: "Cyber" },
  { id: "📡", label: "Broadcaster", category: "Cyber" },
  { id: "🔬", label: "Scientist", category: "Cyber" },
  { id: "🧬", label: "Gene-Splice", category: "Cyber" },
  { id: "⚛️", label: "Atom", category: "Cyber" },
  { id: "🖥️", label: "Mainframe", category: "Cyber" },
  { id: "🕹️", label: "Joystick", category: "Cyber" },
  { id: "📟", label: "Pager", category: "Cyber" },
  { id: "🔋", label: "Power Cell", category: "Cyber" },

  // ── MAGIC (16) ─────────────────────────────────────────────────────────
  { id: "🧙", label: "Wizard", category: "Magic" },
  { id: "🐉", label: "Dragon", category: "Magic" },
  { id: "🦄", label: "Unicorn", category: "Magic" },
  { id: "🔥", label: "Phoenix", category: "Magic" },
  { id: "🔮", label: "Oracle", category: "Magic" },
  { id: "⚡", label: "Thunderer", category: "Magic" },
  { id: "💀", label: "Necromancer", category: "Magic" },
  { id: "👻", label: "Specter", category: "Magic" },
  { id: "🧿", label: "Evil Eye", category: "Magic" },
  { id: "🌊", label: "Tide Caller", category: "Magic" },
  { id: "🍄", label: "Shaman", category: "Magic" },
  { id: "🌙", label: "Moonwalker", category: "Magic" },
  { id: "✨", label: "Enchanter", category: "Magic" },
  { id: "🌪️", label: "Tempest", category: "Magic" },
  { id: "🧊", label: "Frost Mage", category: "Magic" },
  { id: "☁️", label: "Storm Bringer", category: "Magic" },

  // ── ANIMALS (16) ───────────────────────────────────────────────────────
  { id: "🦊", label: "Fox", category: "Animals" },
  { id: "🐺", label: "Wolf", category: "Animals" },
  { id: "🦅", label: "Eagle", category: "Animals" },
  { id: "🦈", label: "Shark", category: "Animals" },
  { id: "🦁", label: "Lion", category: "Animals" },
  { id: "🐍", label: "Viper", category: "Animals" },
  { id: "🐼", label: "Panda", category: "Animals" },
  { id: "😸", label: "Cyber Cat", category: "Animals" },
  { id: "🦋", label: "Butterfly", category: "Animals" },
  { id: "🐯", label: "Tiger", category: "Animals" },
  { id: "🦉", label: "Owl", category: "Animals" },
  { id: "🦇", label: "Bat", category: "Animals" },
  { id: "🐊", label: "Croc", category: "Animals" },
  { id: "🦏", label: "Rhino", category: "Animals" },
  { id: "🦑", label: "Squid", category: "Animals" },
  { id: "🦂", label: "Scorpion", category: "Animals" },

  // ── SPACE (12) ─────────────────────────────────────────────────────────
  { id: "👨‍🚀", label: "Astronaut", category: "Space" },
  { id: "🪐", label: "Planet", category: "Space" },
  { id: "⭐", label: "Star", category: "Space" },
  { id: "🌀", label: "Black Hole", category: "Space" },
  { id: "💫", label: "Supernova", category: "Space" },
  { id: "🌌", label: "Galaxy", category: "Space" },
  { id: "🌠", label: "Meteor", category: "Space" },
  { id: "☀️", label: "Solar", category: "Space" },
  { id: "🌍", label: "Earth", category: "Space" },
  { id: "🔭", label: "Observer", category: "Space" },
  { id: "💥", label: "Explosion", category: "Space" },
  { id: "🛩️", label: "Spacecraft", category: "Space" },

  // ── ICONS (12) ─────────────────────────────────────────────────────────
  { id: "👑", label: "Crown", category: "Icons" },
  { id: "💎", label: "Gem", category: "Icons" },
  { id: "❄️", label: "Frost", category: "Icons" },
  { id: "☠️", label: "Skull", category: "Icons" },
  { id: "🎯", label: "Target", category: "Icons" },
  { id: "🏆", label: "Champion", category: "Icons" },
  { id: "🎧", label: "Gamer", category: "Icons" },
  { id: "🎭", label: "Phantom", category: "Icons" },
  { id: "👁️", label: "Watcher", category: "Icons" },
  { id: "✈️", label: "Pilot", category: "Icons" },
  { id: "🔒", label: "Vault", category: "Icons" },
  { id: "🎪", label: "Showman", category: "Icons" },

  // ── FUN (12) ───────────────────────────────────────────────────────────
  { id: "🍕", label: "Pizza", category: "Fun" },
  { id: "🌮", label: "Taco", category: "Fun" },
  { id: "🍜", label: "Ramen", category: "Fun" },
  { id: "🎮", label: "Controller", category: "Fun" },
  { id: "🎲", label: "Dice", category: "Fun" },
  { id: "🎨", label: "Artist", category: "Fun" },
  { id: "🎸", label: "Rockstar", category: "Fun" },
  { id: "🎤", label: "Singer", category: "Fun" },
  { id: "🏄", label: "Surfer", category: "Fun" },
  { id: "🧩", label: "Puzzle", category: "Fun" },
  { id: "🎩", label: "Magician", category: "Fun" },
  { id: "🃏", label: "Joker", category: "Fun" },

  // ── NATURE (12) ────────────────────────────────────────────────────────
  { id: "🌋", label: "Volcano", category: "Nature" },
  { id: "🌵", label: "Cactus", category: "Nature" },
  { id: "🍀", label: "Lucky", category: "Nature" },
  { id: "🌺", label: "Bloom", category: "Nature" },
  { id: "🌊", label: "Wave", category: "Nature" },
  { id: "🌈", label: "Rainbow", category: "Nature" },
  { id: "⛰️", label: "Mountain", category: "Nature" },
  { id: "🌿", label: "Druid", category: "Nature" },
  { id: "🍁", label: "Maple", category: "Nature" },
  { id: "🌸", label: "Sakura", category: "Nature" },
  { id: "🐚", label: "Shell", category: "Nature" },
  { id: "🌲", label: "Pine", category: "Nature" },

  // ── DARK (8) ───────────────────────────────────────────────────────────
  { id: "🕷️", label: "Spider", category: "Dark" },
  { id: "🕸️", label: "Web", category: "Dark" },
  { id: "🌑", label: "Dark Moon", category: "Dark" },
  { id: "⚰️", label: "Coffin", category: "Dark" },
  { id: "🧟", label: "Zombie", category: "Dark" },
  { id: "🧛", label: "Vampire", category: "Dark" },
  { id: "👺", label: "Demon", category: "Dark" },
  { id: "🦇", label: "Night Bat", category: "Dark" },

  // ── NEW: MUSIC (12) ────────────────────────────────────────────────────
  { id: "🎸", label: "Guitar", category: "Music" },
  { id: "🎹", label: "Keys", category: "Music" },
  { id: "🎺", label: "Brass", category: "Music" },
  { id: "🎻", label: "Strings", category: "Music" },
  { id: "🪕", label: "Banjo", category: "Music" },
  { id: "🥁", label: "Drums", category: "Music" },
  { id: "🪘", label: "Djembe", category: "Music" },
  { id: "🪇", label: "Xylo", category: "Music" },
  { id: "🎷", label: "Sax", category: "Music" },
  { id: "🪗", label: "Accord", category: "Music" },
  { id: "🎤", label: "Vocals", category: "Music" },
  { id: "🎧", label: "DJ", category: "Music" },

  // ── NEW: MYTHICAL (12) ─────────────────────────────────────────────────
  { id: "🧞", label: "Genie", category: "Mythical" },
  { id: "🧜", label: "Mermaid", category: "Mythical" },
  { id: "🧚", label: "Fairy", category: "Mythical" },
  { id: "🧛", label: "Vamp", category: "Mythical" },
  { id: "🧟", label: "Mummy", category: "Mythical" },
  { id: "👹", label: "Ogre", category: "Mythical" },
  { id: "👺", label: "Goblin", category: "Mythical" },
  { id: "🤡", label: "Jest", category: "Mythical" },
  { id: "💩", label: "Poop", category: "Mythical" },
  { id: "👽", label: "Martian", category: "Mythical" },
  { id: "🤠", label: "Cowboy", category: "Mythical" },
  { id: "🥴", label: "Woozy", category: "Mythical" },

  // ── NEW: TECH 2 (12) ───────────────────────────────────────────────────
  { id: "💾", label: "Floppy", category: "Tech" },
  { id: "💿", label: "Disc", category: "Tech" },
  { id: "📀", label: "DVD", category: "Tech" },
  { id: "🎥", label: "Cam", category: "Tech" },
  { id: "📷", label: "Photo", category: "Tech" },
  { id: "📸", label: "Flash", category: "Tech" },
  { id: "📹", label: "Video", category: "Tech" },
  { id: "📼", label: "Tape", category: "Tech" },
  { id: "🔍", label: "Zoom", category: "Tech" },
  { id: "🔎", label: "Search", category: "Tech" },
  { id: "🕯️", label: "Candle", category: "Tech" },
  { id: "💡", label: "Idea", category: "Tech" },

  // ── NEW: FACES (12) ────────────────────────────────────────────────────
  { id: "😎", label: "Cool", category: "Faces" },
  { id: "🥳", label: "Party", category: "Faces" },
  { id: "😡", label: "Rage", category: "Faces" },
  { id: "🥶", label: "Freeze", category: "Faces" },
  { id: "🤯", label: "Mind", category: "Faces" },
  { id: "🤠", label: "Yee", category: "Faces" },
  { id: "🥸", label: "Nerd", category: "Faces" },
  { id: "🤡", label: "Clown", category: "Faces" },
  { id: "👹", label: "Angry", category: "Faces" },
  { id: "👺", label: "Mad", category: "Faces" },
  { id: "👻", label: "Boo", category: "Faces" },
  { id: "👽", label: "Alien", category: "Faces" },

  // ── NEW: TRANSPORT (12) ────────────────────────────────────────────────
  { id: "🚗", label: "Car", category: "Transport" },
  { id: "🚕", label: "Taxi", category: "Transport" },
  { id: "🚙", label: "SUV", category: "Transport" },
  { id: "🚌", label: "Bus", category: "Transport" },
  { id: "🏎️", label: "Racer", category: "Transport" },
  { id: "🚓", label: "Police", category: "Transport" },
  { id: "🚑", label: "Ambu", category: "Transport" },
  { id: "🚒", label: "Fire", category: "Transport" },
  { id: "🚐", label: "Van", category: "Transport" },
  { id: "🛻", label: "Truck", category: "Transport" },
  { id: "🚚", label: "Haul", category: "Transport" },
  { id: "🚛", label: "Big Rig", category: "Transport" },
];

export const CHARACTER_CATEGORIES = [
  "Warriors",
  "Cyber",
  "Magic",
  "Animals",
  "Space",
  "Icons",
  "Fun",
  "Nature",
  "Dark",
  "Music",
  "Mythical",
  "Tech",
  "Faces",
  "Transport",
];

// ── BACKGROUNDS ─────────────────────────────────────────────────────────────
export const AVATAR_BACKGROUNDS = [
  // ── COOL / BLUE (Existing) ───────────────────────────────────────────────
  {
    id: "bg_cyber",
    label: "Cyber Blue",
    value: "linear-gradient(135deg,#06b6d4,#6366f1)",
  },
  {
    id: "bg_ocean",
    label: "Deep Ocean",
    value: "linear-gradient(135deg,#3b82f6,#06b6d4)",
  },
  {
    id: "bg_arctic",
    label: "Arctic",
    value: "linear-gradient(135deg,#bae6fd,#3b82f6)",
  },
  {
    id: "bg_midnight",
    label: "Midnight",
    value: "linear-gradient(135deg,#0f172a,#1e3a8a)",
  },
  {
    id: "bg_sapphire",
    label: "Sapphire",
    value: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
  },
  {
    id: "bg_teal",
    label: "Teal Wave",
    value: "linear-gradient(135deg,#14b8a6,#3b82f6)",
  },
  {
    id: "bg_aqua",
    label: "Aqua Dream",
    value: "linear-gradient(135deg,#22d3ee,#a5f3fc)",
  },
  {
    id: "bg_storm",
    label: "Storm",
    value: "linear-gradient(135deg,#334155,#0ea5e9)",
  },

  // ── PURPLE / VIOLET (Existing) ───────────────────────────────────────────
  {
    id: "bg_void",
    label: "Void",
    value: "linear-gradient(135deg,#1e1b4b,#4c1d95)",
  },
  {
    id: "bg_nebula",
    label: "Nebula",
    value: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
  {
    id: "bg_violet",
    label: "Violet",
    value: "linear-gradient(135deg,#8b5cf6,#6366f1)",
  },
  {
    id: "bg_indigo",
    label: "Indigo Storm",
    value: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  },
  {
    id: "bg_phantom",
    label: "Phantom",
    value: "linear-gradient(135deg,#f43f5e,#a855f7)",
  },
  {
    id: "bg_aurora",
    label: "Aurora",
    value: "linear-gradient(135deg,#6366f1,#ec4899)",
  },
  {
    id: "bg_cosmos",
    label: "Cosmos",
    value: "linear-gradient(135deg,#0f172a,#7c3aed)",
  },
  {
    id: "bg_warp",
    label: "Warp Drive",
    value: "linear-gradient(135deg,#4c1d95,#00f3ff)",
  },

  // ── PINK / RED (Existing) ───────────────────────────────────────────────
  {
    id: "bg_rose",
    label: "Rose Slash",
    value: "linear-gradient(135deg,#ec4899,#f43f5e)",
  },
  {
    id: "bg_blood",
    label: "Blood Moon",
    value: "linear-gradient(135deg,#ef4444,#f97316)",
  },
  {
    id: "bg_crimson",
    label: "Crimson",
    value: "linear-gradient(135deg,#991b1b,#ef4444)",
  },
  {
    id: "bg_magma",
    label: "Magma",
    value: "linear-gradient(135deg,#7f1d1d,#dc2626)",
  },
  {
    id: "bg_cherry",
    label: "Cherry",
    value: "linear-gradient(135deg,#be185d,#f43f5e)",
  },
  {
    id: "bg_candy",
    label: "Candy",
    value: "linear-gradient(135deg,#f97316,#ec4899)",
  },

  // ── GREEN (Existing) ────────────────────────────────────────────────────
  {
    id: "bg_matrix",
    label: "Matrix",
    value: "linear-gradient(135deg,#052e16,#0aff0a)",
  },
  {
    id: "bg_forest",
    label: "Forest",
    value: "linear-gradient(135deg,#14532d,#22c55e)",
  },
  {
    id: "bg_venom",
    label: "Venom",
    value: "linear-gradient(135deg,#eab308,#22c55e)",
  },
  {
    id: "bg_jungle",
    label: "Jungle",
    value: "linear-gradient(135deg,#365314,#84cc16)",
  },
  {
    id: "bg_emerald",
    label: "Emerald",
    value: "linear-gradient(135deg,#064e3b,#34d399)",
  },
  {
    id: "bg_toxic",
    label: "Toxic",
    value: "linear-gradient(135deg,#4d7c0f,#ecfccb)",
  },

  // ── ORANGE / GOLD (Existing) ────────────────────────────────────────────
  {
    id: "bg_fire",
    label: "Inferno",
    value: "linear-gradient(135deg,#f97316,#eab308)",
  },
  {
    id: "bg_gold",
    label: "Gold Rush",
    value: "linear-gradient(135deg,#92400e,#fbbf24)",
  },
  {
    id: "bg_sunset",
    label: "Sunset",
    value: "linear-gradient(135deg,#0ea5e9,#f97316)",
  },
  {
    id: "bg_amber",
    label: "Amber",
    value: "linear-gradient(135deg,#b45309,#fde68a)",
  },
  {
    id: "bg_lava",
    label: "Lava",
    value: "linear-gradient(135deg,#431407,#f97316)",
  },

  // ── NEUTRAL / DARK (Existing) ───────────────────────────────────────────
  {
    id: "bg_dark",
    label: "Dark Mode",
    value: "linear-gradient(135deg,#0f172a,#1e293b)",
  },
  {
    id: "bg_obsidian",
    label: "Obsidian",
    value: "linear-gradient(135deg,#020617,#0f172a)",
  },
  {
    id: "bg_ash",
    label: "Ash",
    value: "linear-gradient(135deg,#1c1917,#57534e)",
  },
  {
    id: "bg_steel",
    label: "Steel",
    value: "linear-gradient(135deg,#334155,#94a3b8)",
  },

  // ── SPECIAL / MULTI (Existing) ───────────────────────────────────────────
  {
    id: "bg_rainbow",
    label: "Rainbow",
    value:
      "linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6)",
  },
  {
    id: "bg_neon_mix",
    label: "Neon Mix",
    value: "linear-gradient(135deg,#00f3ff,#bc13fe)",
  },
  {
    id: "bg_galaxy",
    label: "Galaxy",
    value: "linear-gradient(135deg,#0f172a,#7c3aed,#06b6d4)",
  },
  {
    id: "bg_retrowave",
    label: "Retrowave",
    value: "linear-gradient(135deg,#1a1a2e,#e94560,#0f3460)",
  },

  // ── NEW: HOLOGRAPHIC (IRIDESCENT) ───────────────────────────────────────
  {
    id: "bg_holo_1",
    label: "Holo Pink",
    value: "linear-gradient(45deg, #ff00cc, #333399)",
  },
  {
    id: "bg_holo_2",
    label: "Holo Cyan",
    value: "linear-gradient(45deg, #00f260, #0575e6)",
  },
  {
    id: "bg_holo_3",
    label: "Holo Gold",
    value: "linear-gradient(45deg, #f12711, #f5af19)",
  },
  {
    id: "bg_holo_4",
    label: "Holo Blue",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "bg_holo_5",
    label: "Holo Mint",
    value: "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
  },
  {
    id: "bg_holo_6",
    label: "Holo Steel",
    value: "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)",
  },

  // ── NEW: RADAR / PULSE (Radial) ─────────────────────────────────────────
  {
    id: "bg_radar_red",
    label: "Red Radar",
    value:
      "radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(15,23,42,1) 70%)",
  },
  {
    id: "bg_radar_green",
    label: "Green Radar",
    value:
      "radial-gradient(circle, rgba(34,197,94,0.8) 0%, rgba(15,23,42,1) 70%)",
  },
  {
    id: "bg_radar_blue",
    label: "Blue Radar",
    value:
      "radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(15,23,42,1) 70%)",
  },
  {
    id: "bg_eye",
    label: "Evil Eye",
    value: "radial-gradient(circle, #facc15 10%, #b91c1c 60%, #000 100%)",
  },
  {
    id: "bg_sun",
    label: "Solar Flare",
    value: "radial-gradient(circle, #fde047 0%, #ea580c 40%, #0f172a 80%)",
  },

  // ── NEW: DEEP SPACE & VOID ──────────────────────────────────────────────
  {
    id: "bg_deep_1",
    label: "Abyss",
    value: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)",
  },
  {
    id: "bg_deep_2",
    label: "Nebula Dark",
    value: "linear-gradient(to top, #09203f 0%, #537895 100%)",
  },
  {
    id: "bg_deep_3",
    label: "Dusk",
    value: "linear-gradient(to right, #243949 0%, #517fa4 100%)",
  },
  {
    id: "bg_deep_4",
    label: "Midnight City",
    value: "linear-gradient(to top, #232526, #414345)",
  },
  {
    id: "bg_deep_5",
    label: "Royal",
    value: "linear-gradient(to right, #141e30, #243b55)",
  },

  // ── NEW: RETRO & SYNTH ───────────────────────────────────────────────────
  {
    id: "bg_synth_1",
    label: "Vapor",
    value: "linear-gradient(to top, #30cfd0 0%, #330867 100%)",
  },
  {
    id: "bg_synth_2",
    label: "Sunset Vice",
    value: "linear-gradient(to right, #ff512f, #dd2476)",
  },
  {
    id: "bg_synth_3",
    label: "Plasma",
    value: "linear-gradient(to right, #f83600 0%, #f9d423 100%)",
  },
  {
    id: "bg_synth_4",
    label: "Electric",
    value: "linear-gradient(to right, #00c6ff, #0072ff)",
  },
  {
    id: "bg_synth_5",
    label: "Berry",
    value: "linear-gradient(to top, #8e2de2, #4a00e0)",
  },

  // ── NEW: BIOLAB / TOXIC ─────────────────────────────────────────────────
  {
    id: "bg_bio_1",
    label: "Acid Rain",
    value: "linear-gradient(to top, #0ba360 0%, #3cba92 100%)",
  },
  {
    id: "bg_bio_2",
    label: "Slime",
    value: "linear-gradient(135deg, #11998e, #38ef7d)",
  },
  {
    id: "bg_bio_3",
    label: "Swamp",
    value: "linear-gradient(to right, #134e5e, #71b280)",
  },
  {
    id: "bg_bio_4",
    label: "Vial",
    value: "linear-gradient(to top, #cc2b5e, #753a88)",
  },
  {
    id: "bg_bio_5",
    label: "Mystery",
    value: "linear-gradient(to top, #c471f5 0%, #fa71cd 100%)",
  },

  // ── NEW: TEXTURES & PATTERNS (Approximated with Gradients) ───────────────
  {
    id: "bg_pat_1",
    label: "Carbon",
    value: "linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 100%)",
  },
  {
    id: "bg_pat_2",
    label: "Titanium",
    value: "linear-gradient(to top, #d7d2cc 0%, #304352 100%)",
  },
  {
    id: "bg_pat_3",
    label: "Copper",
    value: "linear-gradient(to right, #b87333, #ffcf9e)",
  },
];

// ── FRAMES ─────────────────────────────────────────────────────────────────
export const AVATAR_FRAME_PRESETS = [
  // ── EXISTING BASIC NEONS ─────────────────────────────────────────────────
  { id: "none", label: "None", value: "0 0 0 2px rgba(255,255,255,0.08)" },
  {
    id: "neon_blue",
    label: "Cyber Blue",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #00f3ff, 0 0 14px rgba(0,243,255,0.65)",
  },
  {
    id: "neon_pink",
    label: "Hot Pink",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #bc13fe, 0 0 14px rgba(188,19,254,0.65)",
  },
  {
    id: "neon_green",
    label: "Matrix",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #0aff0a, 0 0 14px rgba(10,255,10,0.55)",
  },
  {
    id: "neon_gold",
    label: "Gold",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #eab308, 0 0 14px rgba(234,179,8,0.65)",
  },
  {
    id: "neon_red",
    label: "Danger",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #ef4444, 0 0 14px rgba(239,68,68,0.65)",
  },
  {
    id: "neon_cyan",
    label: "Ice",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #06b6d4, 0 0 14px rgba(6,182,212,0.65)",
  },
  {
    id: "neon_orange",
    label: "Inferno",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #f97316, 0 0 14px rgba(249,115,22,0.65)",
  },
  {
    id: "neon_violet",
    label: "Void",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #8b5cf6, 0 0 14px rgba(139,92,246,0.65)",
  },
  {
    id: "neon_white",
    label: "Ghost",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #f1f5f9, 0 0 14px rgba(241,245,249,0.5)",
  },
  {
    id: "neon_lime",
    label: "Acid",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #a3e635, 0 0 14px rgba(163,230,53,0.55)",
  },
  {
    id: "neon_rose",
    label: "Rose",
    value:
      "0 0 0 2px #050510, 0 0 0 3.5px #fb7185, 0 0 14px rgba(251,113,133,0.6)",
  },

  // ── EXISTING DOUBLE & SPECIAL ────────────────────────────────────────────
  {
    id: "double_blue",
    label: "Double Cyber",
    value:
      "0 0 0 1px #050510, 0 0 0 3px #00f3ff, 0 0 0 5px #050510, 0 0 0 7px rgba(0,243,255,0.4), 0 0 16px rgba(0,243,255,0.3)",
  },
  {
    id: "double_gold",
    label: "Double Gold",
    value:
      "0 0 0 1px #050510, 0 0 0 3px #eab308, 0 0 0 5px #050510, 0 0 0 7px rgba(234,179,8,0.4), 0 0 16px rgba(234,179,8,0.3)",
  },
  {
    id: "rainbow",
    label: "Rainbow",
    value:
      "0 0 0 2px #050510, 0 0 0 4px #00f3ff, 0 0 8px rgba(0,243,255,0.4), 0 0 14px rgba(188,19,254,0.35), 0 0 22px rgba(10,255,10,0.25)",
  },

  // ── NEW: THICK BARS ───────────────────────────────────────────────────────
  {
    id: "thick_white",
    label: "Thick White",
    value: "0 0 0 2px #000, 0 0 0 6px #fff, 0 0 0 8px #000",
  },
  {
    id: "thick_black",
    label: "Thick Black",
    value: "0 0 0 2px #fff, 0 0 0 6px #000, 0 0 0 8px #fff",
  },
  {
    id: "thick_purple",
    label: "Thick Purple",
    value: "0 0 0 2px #000, 0 0 0 6px #8b5cf6, 0 0 15px rgba(139,92,246,0.5)",
  },
  {
    id: "thick_green",
    label: "Thick Green",
    value: "0 0 0 2px #000, 0 0 0 6px #22c55e, 0 0 15px rgba(34,197,94,0.5)",
  },

  // ── NEW: DASHED / SPLIT (Simulated with gaps) ────────────────────────────
  {
    id: "dashed_cyan",
    label: "Dash Cyan",
    value:
      "0 0 0 2px #000, 0 0 0 4px #06b6d4, 0 0 0 6px transparent, 0 0 0 8px #06b6d4, 0 0 0 10px #000",
  },
  {
    id: "dashed_red",
    label: "Dash Red",
    value:
      "0 0 0 2px #000, 0 0 0 4px #ef4444, 0 0 0 6px transparent, 0 0 0 8px #ef4444, 0 0 0 10px #000",
  },
  {
    id: "dotted_yellow",
    label: "Dot Yellow",
    value:
      "0 0 0 2px #000, 0 0 0 3px #eab308, 0 0 0 4px transparent, 0 0 0 6px #eab308, 0 0 0 7px transparent, 0 0 0 9px #eab308, 0 0 0 11px #000",
  },

  // ── NEW: GLITCH / OFFSET ──────────────────────────────────────────────────
  {
    id: "glitch_1",
    label: "Glitch Red",
    value:
      "-2px 0 0 2px #000, 2px 0 0 2px #000, 0 0 0 4px #ef4444, 0 0 15px rgba(239,68,68,0.6)",
  },
  {
    id: "glitch_2",
    label: "Glitch Blue",
    value:
      "-2px 2px 0 2px #000, 2px -2px 0 2px #000, 0 0 0 4px #3b82f6, 0 0 15px rgba(59,130,246,0.6)",
  },
  {
    id: "glitch_3",
    label: "RGB Split",
    value:
      "-3px 0 0 2px #000, 3px 0 0 2px #000, 0 0 0 4px #fff, 0 0 0 6px #ef4444, 0 0 0 8px #00f3ff",
  },

  // ── NEW: SOFT GLOWS (No hard border) ─────────────────────────────────────
  {
    id: "glow_white",
    label: "Soft Glow",
    value: "0 0 10px 2px rgba(255,255,255,0.3)",
  },
  {
    id: "glow_pink",
    label: "Pink Aura",
    value: "0 0 15px 2px rgba(236,72,153,0.4)",
  },
  {
    id: "glow_orange",
    label: "Fire Aura",
    value: "0 0 20px 2px rgba(249,115,22,0.5)",
  },

  // ── NEW: COMPLEX LAYERED ─────────────────────────────────────────────────
  {
    id: "tech_blue",
    label: "Tech Blue",
    value:
      "0 0 0 1px #050510, 0 0 0 2px #00f3ff, 0 4px 0 2px #050510, 0 4px 0 3px #00f3ff",
  },
  {
    id: "tech_pink",
    label: "Tech Pink",
    value:
      "0 0 0 1px #050510, 0 0 0 2px #ec4899, 0 4px 0 2px #050510, 0 4px 0 3px #ec4899",
  },
  {
    id: "corner_brackets",
    label: "Brackets",
    value:
      "0 0 0 2px #000, -4px -4px 0 0 #00f3ff, 4px 4px 0 0 #00f3ff, 4px -4px 0 0 #bc13fe, -4px 4px 0 0 #bc13fe",
  },
  {
    id: "crosshair",
    label: "Crosshair",
    value:
      "0 0 0 1px #000, 0 0 0 2px #ef4444, 0 -8px 0 0 #ef4444, 0 8px 0 0 #ef4444, -8px 0 0 0 #ef4444, 8px 0 0 0 #ef4444",
  },
];

// ── AVATAR_FRAMES kept for backward compat ────────────────────────────────
export const AVATAR_FRAMES = Object.fromEntries(
  AVATAR_FRAME_PRESETS.map((f) => [f.id, f.value]),
);

// ── Parse / Build the composite avatar string ─────────────────────────────
export const buildAvatarString = (icon, bgId, frameId) =>
  `${icon}::${bgId}::${frameId}`;

export const parseAvatarString = (avatarStr = "") => {
  if (!avatarStr) return { icon: "", bgId: "bg_cyber", frameId: "neon_blue" };
  if (avatarStr.includes("::")) {
    const [icon, bgId, frameId] = avatarStr.split("::");
    return { icon, bgId, frameId };
  }
  const legacy = LEGACY_PRESETS[avatarStr];
  if (legacy) return legacy;
  return { icon: avatarStr, bgId: "bg_cyber", frameId: "neon_blue" };
};

export const resolveAvatar = (avatarStr = "", username = "") => {
  const { icon, bgId, frameId } = parseAvatarString(avatarStr);
  const bgPreset = AVATAR_BACKGROUNDS.find((b) => b.id === bgId);
  const framePreset = AVATAR_FRAME_PRESETS.find((f) => f.id === frameId);
  return {
    icon: icon || getInitials(username),
    background: bgPreset?.value || getAvatarColor(username),
    frame: framePreset?.value || AVATAR_FRAMES.none,
    isEmoji: !!icon && icon.trim().length > 0,
  };
};

// ── Legacy preset map ─────────────────────────────────────────────────────
const LEGACY_PRESETS = {
  dragon: { icon: "🐉", bgId: "bg_nebula", frameId: "neon_pink" },
  wizard: { icon: "🧙", bgId: "bg_violet", frameId: "neon_violet" },
  knight: { icon: "⚔️", bgId: "bg_ocean", frameId: "neon_blue" },
  rogue: { icon: "🗡️", bgId: "bg_fire", frameId: "neon_orange" },
  ranger: { icon: "🏹", bgId: "bg_forest", frameId: "neon_green" },
  ninja: { icon: "🥷", bgId: "bg_dark", frameId: "none" },
  star: { icon: "⭐", bgId: "bg_fire", frameId: "neon_gold" },
  robot: { icon: "🤖", bgId: "bg_cyber", frameId: "neon_cyan" },
  pilot: { icon: "✈️", bgId: "bg_ocean", frameId: "neon_blue" },
  captain: { icon: "🛡️", bgId: "bg_fire", frameId: "neon_gold" },
  samurai: { icon: "🗡️", bgId: "bg_blood", frameId: "neon_red" },
  guardian: { icon: "🛡️", bgId: "bg_fire", frameId: "neon_gold" },
  berserker: { icon: "🪓", bgId: "bg_fire", frameId: "neon_orange" },
  bomb: { icon: "💣", bgId: "bg_dark", frameId: "none" },
  duelist: { icon: "⚒️", bgId: "bg_violet", frameId: "neon_violet" },
  alien: { icon: "👾", bgId: "bg_forest", frameId: "neon_green" },
  cyborg: { icon: "🦾", bgId: "bg_ocean", frameId: "neon_blue" },
  ufo: { icon: "🛸", bgId: "bg_nebula", frameId: "neon_pink" },
  satellite: { icon: "🛰️", bgId: "bg_ocean", frameId: "neon_blue" },
  comet: { id: "☄️", label: "Comet", category: "Cyber" },
  laser: { id: "🔫", label: "Laser", category: "Cyber" },
  hacker: { icon: "💻", bgId: "bg_matrix", frameId: "neon_green" },
  unicorn: { icon: "🦄", bgId: "bg_rose", frameId: "neon_pink" },
  phoenix: { icon: "🔥", bgId: "bg_fire", frameId: "neon_orange" },
  crystal: { icon: "🔮", bgId: "bg_violet", frameId: "neon_violet" },
  thunder: { icon: "⚡", bgId: "bg_fire", frameId: "neon_gold" },
  skull: { icon: "💀", bgId: "bg_dark", frameId: "none" },
  ghost: { icon: "👻", bgId: "bg_dark", frameId: "none" },
  fox: { icon: "🦊", bgId: "bg_fire", frameId: "neon_orange" },
  wolf: { icon: "🐺", bgId: "bg_dark", frameId: "none" },
  eagle: { icon: "🦅", bgId: "bg_ocean", frameId: "neon_blue" },
  shark: { icon: "🦈", bgId: "bg_cyber", frameId: "neon_cyan" },
  lion: { icon: "🦁", bgId: "bg_fire", frameId: "neon_gold" },
  viper: { icon: "🐍", bgId: "bg_forest", frameId: "neon_green" },
  panda: { icon: "🐼", bgId: "bg_dark", frameId: "none" },
  cybercat: { icon: "😸", bgId: "bg_nebula", frameId: "neon_pink" },
  astronaut: { icon: "👨‍🚀", bgId: "bg_ocean", frameId: "neon_blue" },
  planet: { icon: "🪐", bgId: "bg_violet", frameId: "neon_violet" },
  moon: { icon: "🌙", bgId: "bg_cyber", frameId: "neon_cyan" },
  blackhole: { icon: "🌀", bgId: "bg_void", frameId: "neon_violet" },
  supernova: { icon: "💫", bgId: "bg_fire", frameId: "neon_orange" },
  galaxy: { icon: "🌌", bgId: "bg_cosmos", frameId: "neon_blue" },
  meteor: { icon: "🌠", bgId: "bg_ocean", frameId: "neon_blue" },
  crown: { icon: "👑", bgId: "bg_gold", frameId: "neon_gold" },
  gem: { icon: "💎", bgId: "bg_cyber", frameId: "neon_cyan" },
  fire: { icon: "🔥", bgId: "bg_blood", frameId: "neon_red" },
  ice: { icon: "❄️", bgId: "bg_arctic", frameId: "neon_cyan" },
  poison: { icon: "☠️", bgId: "bg_forest", frameId: "neon_green" },
  target: { icon: "🎯", bgId: "bg_blood", frameId: "neon_red" },
  trophy: { icon: "🏆", bgId: "bg_gold", frameId: "neon_gold" },
  headset: { icon: "🎧", bgId: "bg_violet", frameId: "neon_violet" },
  joystick: { icon: "🕹️", bgId: "bg_forest", frameId: "neon_green" },
  mask: { icon: "🎭", bgId: "bg_nebula", frameId: "neon_pink" },
  eye: { icon: "👁️", bgId: "bg_cyber", frameId: "neon_blue" },
};

// ── Deterministic gradient fallback ──────────────────────────────────────
export const AVATAR_COLORS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#f97316,#eab308)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#ef4444,#f97316)",
  "linear-gradient(135deg,#14b8a6,#3b82f6)",
  "linear-gradient(135deg,#8b5cf6,#6366f1)",
  "linear-gradient(135deg,#eab308,#22c55e)",
];

export const getAvatarColor = (username = "") => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getInitials = (username = "") => {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase() || "?";
};

// Kept for any code that still imports these
export const findAvatarPreset = () => null;
export const AVATAR_PRESETS = [];
export const AVATAR_CATEGORIES = CHARACTER_CATEGORIES;
