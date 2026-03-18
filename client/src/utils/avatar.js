// client/src/utils/avatar.js
// Generates a consistent color + initials avatar for any username.
// The same username always gets the same color — deterministic.

export const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
];

export const AVATAR_PRESETS = [
  { id: "dragon", label: "Dragon", icon: "🐉", color: "#8b5cf6" },
  { id: "wizard", label: "Wizard", icon: "🧙", color: "#6366f1" },
  { id: "knight", label: "Knight", icon: "⚔️", color: "#ec4899" },
  { id: "rogue", label: "Rogue", icon: "🗡️", color: "#f97316" },
  { id: "ranger", label: "Ranger", icon: "🏹", color: "#22c55e" },
  { id: "ninja", label: "Ninja", icon: "🥷", color: "#14b8a6" },
  { id: "star", label: "Star", icon: "⭐", color: "#ef4444" },
  { id: "robot", label: "Robot", icon: "🤖", color: "#a855f7" },
  { id: "pilot", label: "Pilot", icon: "✈️", color: "#3b82f6" },
  { id: "captain", label: "Captain", icon: "🛡️", color: "#eab308" },
];

// Hash the username string to a number, pick a color from the palette
export const getAvatarColor = (username = "") => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const findAvatarPreset = (idOrIcon) => {
  if (!idOrIcon) return null;
  return (
    AVATAR_PRESETS.find((preset) => preset.id === idOrIcon) ||
    AVATAR_PRESETS.find((preset) => preset.icon === idOrIcon)
  );
};

// Get 1-2 character initials from a username
export const getInitials = (username = "") => {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
};
