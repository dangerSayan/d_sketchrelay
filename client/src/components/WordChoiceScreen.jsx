// client/src/components/WordChoiceScreen.jsx
// Shown to the drawer during the 15-second word-choice phase.
// Shows 3 word buttons to pick from.
// Everyone else sees a waiting message with the same countdown.

import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import socket from "../socket/socket";
import styles from "./WordChoiceScreen.module.css";

const WordChoiceScreen = ({ roomCode, isDrawer }) => {
  const { gameState } = useContext(GameContext);
  const { currentDrawer, wordChoices, choiceTimeLeft } = gameState;

  const handlePick = (word) => {
    socket.emit("pick-word", { roomCode, word });
  };

  if (isDrawer && wordChoices) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <p className={styles.prompt}>Choose a word to draw</p>
          <div className={styles.timer}>{choiceTimeLeft}s</div>
          <div className={styles.choices}>
            {wordChoices.map((word) => (
              <button
                key={word}
                className={styles.choiceBtn}
                onClick={() => handlePick(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            Pick fast — it auto-selects in {choiceTimeLeft} seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <p className={styles.prompt}>
          <strong>{currentDrawer?.username}</strong> is choosing a word...
        </p>
        <div className={styles.timer}>{choiceTimeLeft}s</div>
        <div className={styles.dots}>
          <span className={styles.dot} style={{ animationDelay: "0s" }} />
          <span className={styles.dot} style={{ animationDelay: "0.2s" }} />
          <span className={styles.dot} style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

export default WordChoiceScreen;
