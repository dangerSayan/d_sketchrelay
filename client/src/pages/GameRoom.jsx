import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import { roomAPI } from "../api/index";
import socket from "../socket/socket";
// Import the professional sound engine
import { sounds } from "../utils/sounds";

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
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const previousPlayers = useRef([]);

  // Ref to track previous status for sound triggers
  const prevStatusRef = useRef(gameState.status);

  const joinAsSpectator = location.state?.spectate === true;

  // ── SOUND FEEDBACK ───────────────────────────────────────────────────────
  // Replaced basic beep with professional sound engine

  const handleCopy = (text, type) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement("input");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }
    sounds.click(); // 🔔 Professional UI Click
    if (type === "link") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    }
  };

  const handleWhatsAppShare = () => {
    sounds.click();
    const link = `${window.location.origin}/room/${code}`;
    const text = `Join my room! Code: ${code} - ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ── GAME LOGIC ───────────────────────────────────────────────────────────
  useSocket(code, user);

  useEffect(() => {
    if (!code) return;
    roomAPI
      .getOne(code)
      .then((res) => dispatch({ type: "SET_ROOM", payload: res.data.room }))
      .catch(() => navigate("/lobby"));
  }, [code, dispatch, navigate]);

  useEffect(() => {
    if (!joinAsSpectator || !user || spectatorEmitted.current) return;
    const emit = () => {
      if (spectatorEmitted.current) return;
      spectatorEmitted.current = true;
      socket.emit("join-as-spectator", {
        roomCode: code,
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar || "",
        },
      });
    };
    if (socket.connected) emit();
    else socket.once("connect", emit);
    return () => socket.off("connect", emit);
  }, [joinAsSpectator, user, code]);

  // ── AUDIO EVENT LISTENER (The "Orchestrator") ─────────────────────────────
  useEffect(() => {
    const currentStatus = gameState.status;
    const previousStatus = prevStatusRef.current;

    // 1. Game Over / Winner Screen
    if (currentStatus === "finished" && previousStatus !== "finished") {
      sounds.gameOver();
    }

    // 2. Word Chosen (Transition from Choosing to Playing)
    if (currentStatus === "playing" && previousStatus === "choosing") {
      sounds.wordChosen();
    }

    // 3. New Round / Choosing Time (Transition to Choosing)
    if (currentStatus === "choosing" && previousStatus !== "choosing") {
      sounds.newRound();
    }

    // Update ref
    prevStatusRef.current = currentStatus;
  }, [gameState.status]);

  const currentUserId = (user?._id || user?.id)?.toString();
  const hostId = gameState.room?.host?.toString();
  const isHost = !!hostId && hostId === currentUserId;
  const isDrawer = gameState.currentDrawer?.id?.toString() === currentUserId;
  const isSpectator = gameState.isSpectator;

  const handleStartGame = () => {
    sounds.click();
    socket.emit("start-game", { roomCode: code });
  };

  const handleLeaveRoom = () => {
    sounds.click();
    dispatch({ type: "RESET" });
    navigate("/lobby");
  };

  const handleGoHome = () => {
    sounds.click();
    dispatch({ type: "RESET" });
    navigate("/");
  };

  // ── GAME OVER / WINNER SCREEN ────────────────────────────────────────────
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
          <h1 className={styles.gameOverTitle}>Game Over</h1>
          {winner && (
            <div className={styles.winnerBlock}>
              <Avatar
                username={winner.username}
                avatar={winner.avatar}
                size={52}
              />
              <div>
                <div className={styles.winnerName}>{winner.username}</div>
                <div className={styles.winnerScore}>{winner.score} pts</div>
              </div>
            </div>
          )}

          <div className={styles.finalScores}>
            {sorted.map((p, i) => {
              // Determine class based on rank
              let rankClass = "";
              if (i === 0) rankClass = styles.firstPlace;
              else if (i === 1) rankClass = styles.secondPlace;
              else if (i === 2) rankClass = styles.thirdPlace;

              return (
                <div
                  key={p.userId}
                  className={`${styles.finalRow} ${rankClass}`}
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
                  <Avatar username={p.username} avatar={p.avatar} size={26} />
                  <span className={styles.finalName}>{p.username}</span>
                  <span className={styles.finalPts}>{p.score} pts</span>
                </div>
              );
            })}
          </div>

          <div className={styles.gameOverActions}>
            {isHost && (
              <button
                className={styles.lobbyBtn}
                onClick={() => {
                  sounds.click();
                  socket.emit("restart-game", { roomCode: code });
                }}
              >
                🔁 Play Again
              </button>
            )}
            <button className={styles.lobbyBtn} onClick={handleLeaveRoom}>
              ← Back to Lobby
            </button>
            <button className={styles.homeBtn} onClick={handleGoHome}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (gameState.status === "waiting") {
    const activePlayers = gameState.players.filter((p) => !p.isSpectator);
    const roomLink = `${window.location.origin}/room/${code}`;

    return (
      <div className={styles.pageScroll}>
        <div className={styles.waitingCard}>
          <div className={styles.waitingTop}>
            <h1 className={styles.waitingTitle}>
              Room <span className={styles.code}>{code}</span>
            </h1>
            <MuteButton />
          </div>

          <div className={styles.shareRow}>
            <p className={styles.waitingHint}>
              [ Share this code with friends ]
            </p>

            <div className={styles.buttonGroup}>
              <button
                className={`${styles.copyBtn} ${styles.iconBtn}`}
                onClick={() => handleCopy(roomLink, "link")}
                title="Copy Link"
              >
                {copied ? "LINK COPIED ✓" : "🔗 Copy Link"}
              </button>

              <button
                className={`${styles.copyBtn} ${styles.iconBtn}`}
                onClick={() => handleCopy(code, "code")}
                title="Copy Code"
              >
                {codeCopied ? "CODE COPIED ✓" : "#️⃣ Copy Code"}
              </button>

              <button
                className={`${styles.copyBtn} ${styles.whatsappBtn} ${styles.iconBtn}`}
                onClick={handleWhatsAppShare}
                title="Share on WhatsApp"
              >
                📱 WhatsApp
              </button>

              <button
                className={`${styles.copyBtn} ${styles.qrBtn} ${styles.iconBtn}`}
                onClick={() => {
                  sounds.click();
                  setShowQR(!showQR);
                }}
                title="Show QR Code"
              >
                📷 QR Code
              </button>
            </div>
          </div>

          {showQR && (
            <div
              className={styles.qrModal}
              onClick={() => {
                sounds.click();
                setShowQR(false);
              }}
            >
              <div
                className={styles.qrContent}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomLink)}`}
                  alt="Room QR"
                  className={styles.qrImage}
                />
                <p className={styles.qrText}>Scan to Join</p>
                <button
                  className={styles.closeQrBtn}
                  onClick={() => {
                    sounds.click();
                    setShowQR(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <PlayerList hostId={hostId} />
          <div className={styles.waitingActions}>
            {isHost ? (
              <>
                <p className={styles.hostNote}>
                  {activePlayers.length < 2
                    ? "// Waiting for at least 1 more player..."
                    : `// ${activePlayers.length} players ready — execute?`}
                </p>
                <button
                  className={styles.startBtn}
                  onClick={handleStartGame}
                  disabled={activePlayers.length < 2}
                >
                  Start Game
                </button>
              </>
            ) : (
              <p className={styles.hostNote}>
                {isSpectator
                  ? "// Spectator mode active"
                  : "// Waiting for host to initialize..."}
              </p>
            )}
          </div>
          <div className={styles.waitingFooter}>
            <button className={styles.leaveBtn} onClick={handleLeaveRoom}>
              ← Leave Room
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
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
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
                ? "// Pick your word..."
                : `// ${gameState.currentDrawer?.username} is choosing...`}
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
