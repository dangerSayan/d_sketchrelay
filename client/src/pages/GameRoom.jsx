// client/src/pages/GameRoom.jsx
import { useContext, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import WordChoiceScreen from "../components/WordChoiceScreen";
import Reactions from "../components/Reactions";
import MuteButton from "../components/MuteButton";
import Confetti from "../components/Confetti";
import Avatar from "../components/Avatar";

import styles from "./GameRoom.module.css";

const GameRoom = () => {
  const { code } = useParams();
  const { user } = useAuth();
  const { gameState, dispatch } = useContext(GameContext);
  const navigate = useNavigate();
  const location = useLocation();
  const spectatorEmitted = useRef(false);

  const joinAsSpectator = location.state?.spectate === true;

  useSocket(code, user);

  useEffect(() => {
    if (!code) return;
    roomAPI
      .getOne(code)
      .then((res) => dispatch({ type: "SET_ROOM", payload: res.data.room }))
      .catch(() => navigate("/lobby"));
  }, [code]);

  useEffect(() => {
    if (!joinAsSpectator || !user || spectatorEmitted.current) return;
    const emit = () => {
      if (spectatorEmitted.current) return;
      spectatorEmitted.current = true;
      socket.emit("join-as-spectator", {
        roomCode: code,
        user: { id: user._id, username: user.username },
      });
    };
    if (socket.connected) emit();
    else socket.once("connect", emit);
    return () => socket.off("connect", emit);
  }, [joinAsSpectator, user, code]);

  const hostId = gameState.room?.host?.toString();
  const isHost = !!hostId && hostId === user?._id?.toString();
  const isDrawer =
    gameState.currentDrawer?.id?.toString() === user?._id?.toString();
  const isSpectator = gameState.isSpectator;

  const handleStartGame = () => socket.emit("start-game", { roomCode: code });

  const handleLeaveRoom = () => {
    dispatch({ type: "RESET" });
    navigate("/lobby");
  };

  const handleGoHome = () => {
    dispatch({ type: "RESET" });
    navigate("/");
  };

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  if (gameState.status === "finished") {
    const sorted = [...gameState.scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
      <div className={styles.pageScroll}>
        <div className={styles.gameOverCard}>
          <Confetti />
          <div className={styles.crownWrap}>
            <span className={styles.crown}>👑</span>
          </div>
          <h1 className={styles.gameOverTitle}>Game Over!</h1>
          {winner && (
            <div className={styles.winnerBlock}>
              <Avatar username={winner.username} size={52} />
              <div>
                <div className={styles.winnerName}>{winner.username}</div>
                <div className={styles.winnerScore}>{winner.score} pts</div>
              </div>
            </div>
          )}
          <div className={styles.finalScores}>
            {sorted.map((p, i) => (
              <div
                key={p.userId}
                className={`${styles.finalRow} ${i === 0 ? styles.firstPlace : ""}`}
              >
                <span className={styles.finalRank}>
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `#${i + 1}`}
                </span>
                <Avatar username={p.username} size={26} />
                <span className={styles.finalName}>{p.username}</span>
                <span className={styles.finalPts}>{p.score} pts</span>
              </div>
            ))}
          </div>
          <div className={styles.gameOverActions}>
            <button className={styles.lobbyBtn} onClick={handleLeaveRoom}>
              Back to lobby
            </button>
            <button className={styles.homeBtn} onClick={handleGoHome}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (gameState.status === "waiting") {
    const activePlayers = gameState.players.filter((p) => !p.isSpectator);

    return (
      <div className={styles.pageScroll}>
        <div className={styles.waitingCard}>
          <div className={styles.waitingTop}>
            <h1 className={styles.waitingTitle}>
              Room <span className={styles.code}>{code}</span>
            </h1>
            <MuteButton />
          </div>
          <p className={styles.waitingHint}>Share this code with friends</p>

          <PlayerList hostId={hostId} />

          <div className={styles.waitingActions}>
            {isHost ? (
              <>
                <p className={styles.hostNote}>
                  {activePlayers.length < 2
                    ? "Waiting for at least 1 more player..."
                    : `${activePlayers.length} players ready — let's go!`}
                </p>
                <button
                  className={styles.startBtn}
                  onClick={handleStartGame}
                  disabled={activePlayers.length < 2}
                >
                  Start game
                </button>
              </>
            ) : (
              <p className={styles.hostNote}>
                {isSpectator
                  ? "You are watching as a spectator"
                  : "Waiting for the host to start..."}
              </p>
            )}
          </div>

          <div className={styles.waitingFooter}>
            <button className={styles.leaveBtn} onClick={handleLeaveRoom}>
              ← Leave room
            </button>
            <button className={styles.homeBtn2} onClick={handleGoHome}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING / CHOOSING ────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Top bar — room nav + word hint + timer */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          {/* Leave / Home buttons */}
          <button
            className={styles.navBtn}
            onClick={handleLeaveRoom}
            title="Leave room"
          >
            ← Lobby
          </button>
          <button
            className={styles.navBtnHome}
            onClick={handleGoHome}
            title="Go home"
          >
            🏠
          </button>
          <span className={styles.divider} />
          <span className={styles.roundInfo}>
            Round {gameState.round}/{gameState.maxRounds}
          </span>
          {gameState.totalGuessers > 0 && (
            <span className={styles.guessedBadge}>
              {gameState.guessedCount}/{gameState.totalGuessers} guessed
            </span>
          )}
          {isSpectator && (
            <span className={styles.spectatorBadge}>watching</span>
          )}
        </div>

        <div className={styles.wordArea}>
          {gameState.status === "choosing" ? (
            <span className={styles.choosingText}>
              {isDrawer
                ? "Pick your word..."
                : `${gameState.currentDrawer?.username} is choosing...`}
            </span>
          ) : isDrawer && gameState.yourWord ? (
            <span className={styles.yourWord}>
              Draw: <strong>{gameState.yourWord}</strong>
            </span>
          ) : (
            <span className={styles.hint}>{gameState.wordHint}</span>
          )}
        </div>

        <div className={styles.topRight}>
          <Timer />
          <MuteButton />
        </div>
      </header>

      {gameState.turnWord && (
        <div className={styles.turnEndBanner}>
          The word was: <strong>{gameState.turnWord}</strong>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <PlayerList hostId={hostId} />
          <Scoreboard />
        </div>

        <div className={styles.canvasArea}>
          {gameState.status === "choosing" && (
            <WordChoiceScreen roomCode={code} isDrawer={isDrawer} />
          )}
          <Canvas
            roomCode={code}
            isDrawer={isDrawer && gameState.status === "playing"}
          />
          {!isSpectator && (
            <div className={styles.reactionsRow}>
              <Reactions roomCode={code} />
            </div>
          )}
        </div>

        <div className={styles.chatArea}>
          <Chat roomCode={code} isDrawer={isDrawer} isSpectator={isSpectator} />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
