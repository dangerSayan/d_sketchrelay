// client/src/components/PlayerList.jsx
import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import styles from "./PlayerList.module.css";

const PlayerList = ({ hostId }) => {
  const { gameState } = useContext(GameContext);
  const { user } = useAuth();

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Players</h3>
      {gameState.players.map((p) => {
        const pid =
          (p.userId?._id || p.userId)?.toString() || p._id?.toString();
        const isDrawer = gameState.currentDrawer?.id?.toString() === pid;
        const isHost = pid === hostId;
        const isYou = pid === user?._id?.toString();

        return (
          <div
            key={pid}
            className={`${styles.row} ${isDrawer ? styles.drawingRow : ""}`}
          >
            <div className={styles.left}>
              {/* Glowing pencil indicator for the current drawer */}
              {isDrawer && (
                <span className={styles.drawerIcon} title="Currently drawing">
                  ✏️
                </span>
              )}
              <span
                className={`${styles.name} ${isDrawer ? styles.drawerName : ""}`}
              >
                {p.username}
              </span>
              {isYou && (
                <span className={`${styles.tag} ${styles.tagYou}`}>you</span>
              )}
              {isHost && (
                <span className={`${styles.tag} ${styles.tagHost}`}>host</span>
              )}
            </div>
            <span className={styles.score}>{p.score ?? 0}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;
