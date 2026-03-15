// client/src/components/Avatar.jsx
import { getAvatarColor, getInitials } from "../utils/avatar";

// size: pixel size of the circle
const Avatar = ({ username = "", size = 32 }) => {
  const color = getAvatarColor(username);
  const initials = getInitials(username);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
