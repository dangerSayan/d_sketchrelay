// client/src/components/Avatar.jsx
import { getAvatarColor, getInitials, findAvatarPreset } from "../utils/avatar";

// size: pixel size of the circle
const Avatar = ({ username = "", size = 32, avatar = "" }) => {
  const preset = findAvatarPreset(avatar);

  let background;
  let content;

  if (preset) {
    background = preset.color;
    content = preset.icon;
  } else if (avatar && avatar.startsWith("#")) {
    background = avatar;
    content = getInitials(username);
  } else if (avatar) {
    // custom emoji avatar or string fallback
    background = getAvatarColor(username);
    content = avatar;
  } else {
    background = getAvatarColor(username);
    content = getInitials(username);
  }

  // Username fallback if empty
  if (!username && !content) {
    content = "?";
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.5,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "0.02em",
      }}
    >
      {content}
    </div>
  );
};

export default Avatar;
