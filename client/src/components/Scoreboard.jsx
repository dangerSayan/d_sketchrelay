import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import styles from "./Scoreboard.module.css";

const Scoreboard = () => {
  const { gameState } = useContext(GameContext);

  // Use scores if available, otherwise fall back to players list
  const list =
    gameState.scores.length > 0
      ? gameState.scores
      : [...gameState.players].sort((a, b) => b.score - a.score);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Scores</h3>
      {list.map((p, i) => (
        <div key={p.userId || p._id} className={styles.row}>
          <span className={styles.rank}>#{i + 1}</span>
          <span className={styles.name}>{p.username}</span>
          <span className={styles.score}>{p.score ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

export default Scoreboard;
