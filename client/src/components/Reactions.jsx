// client/src/components/Reactions.jsx
// Shows floating emoji reactions that pop up on screen for 2.5 seconds.
// Positioned absolutely over the game layout.

import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import socket from "../socket/socket";
import styles from "./Reactions.module.css";

const EMOJIS = ["🔥", "😂", "👏", "😮"];

const Reactions = ({ roomCode }) => {
  const { gameState } = useContext(GameContext);

  const handleReact = (emoji) => {
    socket.emit("react", { roomCode, emoji });
  };

  return (
    <>
      {/* Floating reactions that appear when anyone reacts */}
      <div className={styles.floatingArea} aria-hidden="true">
        {gameState.reactions.map((r) => (
          <div key={r.id} className={styles.floatingReaction}>
            <span className={styles.emoji}>{r.emoji}</span>
            <span className={styles.reactionName}>{r.username}</span>
          </div>
        ))}
      </div>

      {/* Reaction buttons */}
      <div className={styles.buttons}>
        {EMOJIS.map((e) => (
          <button
            key={e}
            className={styles.btn}
            onClick={() => handleReact(e)}
            title={`React with ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </>
  );
};

export default Reactions;
