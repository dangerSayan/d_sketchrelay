// client/src/components/Scoreboard.jsx
import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import Avatar from "./Avatar";
import styles from "./Scoreboard.module.css";

const Scoreboard = () => {
  const { gameState } = useContext(GameContext);
  const list =
    gameState.scores.length > 0
      ? gameState.scores
      : [...gameState.players]
          .filter((p) => !p.isSpectator)
          .sort((a, b) => b.score - a.score);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Scores</h3>
      {list.map((p, i) => (
        <div
          key={p.userId || p._id}
          className={`${styles.row} ${i === 0 ? styles.first : ""}`}
        >
          <span className={styles.rank}>{i === 0 ? "🥇" : `#${i + 1}`}</span>
          <Avatar username={p.username} avatar={p.avatar} size={22} />
          <span className={styles.name}>{p.username}</span>
          <span className={styles.score}>{p.score ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

export default Scoreboard;
