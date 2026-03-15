// client/src/components/PlayerList.jsx
import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
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
        const isSpectator = p.isSpectator;

        return (
          <div
            key={pid}
            className={`${styles.row} ${isDrawer ? styles.drawingRow : ""}`}
          >
            <div className={styles.left}>
              <Avatar username={p.username} size={28} />
              {isDrawer && (
                <span className={styles.pencil} title="Drawing">
                  ✏️
                </span>
              )}
              <span
                className={`${styles.name} ${isDrawer ? styles.drawerName : ""} ${isSpectator ? styles.spectatorName : ""}`}
              >
                {p.username}
              </span>
              {isYou && (
                <span className={`${styles.tag} ${styles.tagYou}`}>you</span>
              )}
              {isHost && !isSpectator && (
                <span className={`${styles.tag} ${styles.tagHost}`}>host</span>
              )}
              {isSpectator && (
                <span className={`${styles.tag} ${styles.tagSpec}`}>
                  watching
                </span>
              )}
            </div>
            {!isSpectator && (
              <span className={styles.score}>{p.score ?? 0}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;
