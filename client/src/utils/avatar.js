// client/src/utils/avatar.js
// Generates a consistent color + initials avatar for any username.
// The same username always gets the same color — deterministic.

const AVATAR_COLORS = [
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

// Hash the username string to a number, pick a color from the palette
export const getAvatarColor = (username = "") => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Get 1-2 character initials from a username
export const getInitials = (username = "") => {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
};
