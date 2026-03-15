// client/src/pages/GameRoom.jsx
import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import { roomAPI } from "../api/index";
import socket from "../socket/socket";

import Canvas from "../components/Canvas";
import Chat from "../components/Chat";
import Scoreboard from "../components/Scoreboard";
import Timer from "../components/Timer";
import PlayerList from "../components/PlayerList";

import styles from "./GameRoom.module.css";

const GameRoom = () => {
  const { code } = useParams();
  const { user } = useAuth();
  const { gameState, dispatch } = useContext(GameContext);
  const navigate = useNavigate();

  useSocket(code, user);

  useEffect(() => {
    roomAPI
      .getOne(code)
      .then((res) => dispatch({ type: "SET_ROOM", payload: res.data.room }))
      .catch(() => navigate("/lobby"));
  }, [code]);

  const isHost = gameState.room?.host?.toString() === user?._id?.toString();
  const isDrawer =
    gameState.currentDrawer?.id?.toString() === user?._id?.toString();
  const hostId = gameState.room?.host?.toString();

  const handleStartGame = () => {
    socket.emit("start-game", { roomCode: code });
  };

  // ── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (gameState.status === "finished") {
    const sorted = [...gameState.scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    return (
      <div className={styles.page}>
        <div className={styles.gameOverCard}>
          <h1 className={styles.gameOverTitle}>Game Over!</h1>
          {winner && (
            <p className={styles.winner}>
              Winner: <strong>{winner.username}</strong> — {winner.score} pts
            </p>
          )}
          <div className={styles.finalScores}>
            {sorted.map((p, i) => (
              <div key={p.userId} className={styles.finalRow}>
                <span>
                  #{i + 1} {p.username}
                </span>
                <span>{p.score} pts</span>
              </div>
            ))}
          </div>
          <button
            className={styles.lobbyBtn}
            onClick={() => {
              dispatch({ type: "RESET" });
              navigate("/lobby");
            }}
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (gameState.status === "waiting") {
    return (
      <div className={styles.page}>
        <div className={styles.waitingCard}>
          <h1 className={styles.waitingTitle}>
            Room <span className={styles.code}>{code}</span>
          </h1>
          <p className={styles.waitingHint}>Share this code with friends</p>
          <PlayerList hostId={hostId} />
          <div className={styles.waitingActions}>
            {isHost ? (
              <>
                <p className={styles.hostNote}>
                  {gameState.players.length < 2
                    ? "Waiting for at least 1 more player..."
                    : "Ready to start!"}
                </p>
                <button
                  className={styles.startBtn}
                  onClick={handleStartGame}
                  disabled={gameState.players.length < 2}
                >
                  Start game
                </button>
              </>
            ) : (
              <p className={styles.hostNote}>
                Waiting for the host to start the game...
              </p>
            )}
          </div>
          <button
            className={styles.leaveBtn}
            onClick={() => navigate("/lobby")}
          >
            Leave room
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING SCREEN ────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topBar}>
        {/* Left: round info + guessed counter */}
        <div className={styles.topLeft}>
          <span className={styles.roundInfo}>
            Round {gameState.round}/{gameState.maxRounds}
          </span>
          {/* Guessed counter — only meaningful during a live turn */}
          {gameState.totalGuessers > 0 && (
            <span className={styles.guessedBadge}>
              {gameState.guessedCount}/{gameState.totalGuessers} guessed
            </span>
          )}
        </div>

        {/* Centre: word hint or drawer's word */}
        <div className={styles.wordArea}>
          {isDrawer && gameState.yourWord ? (
            <span className={styles.yourWord}>
              Draw: <strong>{gameState.yourWord}</strong>
            </span>
          ) : (
            <span className={styles.hint}>{gameState.wordHint}</span>
          )}
        </div>

        {/* Right: timer */}
        <Timer />
      </header>

      {/* Turn ended banner */}
      {gameState.turnWord && (
        <div className={styles.turnEndBanner}>
          The word was: <strong>{gameState.turnWord}</strong>
        </div>
      )}

      {/* Main layout */}
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <PlayerList hostId={hostId} />
          <Scoreboard />
        </div>

        <div className={styles.canvasArea}>
          <Canvas roomCode={code} isDrawer={isDrawer} />
        </div>

        <div className={styles.chatArea}>
          <Chat roomCode={code} isDrawer={isDrawer} />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
