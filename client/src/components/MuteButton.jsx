// client/src/components/MuteButton.jsx
import { useState } from "react";
import { sounds } from "../utils/sounds";
import styles from "./MuteButton.module.css";

const MuteButton = () => {
  const [muted, setMuted] = useState(sounds.muted);

  const toggle = () => {
    const nowMuted = sounds.toggleMute();
    setMuted(nowMuted);
  };

  return (
    <button
      className={`${styles.btn} ${muted ? styles.muted : ""}`}
      onClick={toggle}
      title={muted ? "Unmute sounds" : "Mute sounds"}
      aria-label={muted ? "Unmute" : "Mute"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
};

export default MuteButton;
