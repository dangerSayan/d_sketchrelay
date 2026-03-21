// client/src/components/Avatar.jsx
import { resolveAvatar } from "../utils/avatar";

// size: pixel diameter of the circle
// showFrame: render the neon ring (default true)
const Avatar = ({
  username = "",
  size = 32,
  avatar = "",
  showFrame = true,
}) => {
  const { icon, background, frame, isEmoji } = resolveAvatar(avatar, username);

  const fontSize = isEmoji ? size * 0.52 : size * 0.38;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: isEmoji ? 400 : 800,
        fontSize,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: isEmoji ? "0" : "0.03em",
        boxShadow: showFrame ? frame : undefined,
        lineHeight: 1,
        fontFamily: isEmoji ? "inherit" : "'Orbitron', sans-serif",
        textShadow: isEmoji ? "none" : "0 1px 3px rgba(0,0,0,0.6)",
        transition: "box-shadow 0.2s",
      }}
      title={username}
    >
      {icon}
    </div>
  );
};

export default Avatar;
