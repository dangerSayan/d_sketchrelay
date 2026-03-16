import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roomAPI } from "../api/index";
import useAuth from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import styles from "./Lobby.module.css";

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "animals", label: "🐘 Animals" },
  { value: "food", label: "🍕 Food" },
  { value: "objects", label: "🎒 Objects" },
  { value: "actions", label: "🏊 Actions" },
  { value: "places", label: "🌋 Places" },
  { value: "movies", label: "🎬 Movies" },
];

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [publicRooms, setPublicRooms] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [category, setCategory] = useState("all");
  const [isPrivate, setIsPrivate] = useState(false);
  const [customWords, setCustomWords] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
    const fetchRooms = async () => {
      try {
        const res = await roomAPI.getPublic();
        setPublicRooms(res.data.rooms);
      } catch {
        /* non-critical */
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const parsedCustomWords =
        showCustom && customWords.trim()
          ? customWords
              .split(",")
              .map((w) => w.trim())
              .filter(Boolean)
          : [];

      const res = await roomAPI.create({
        maxPlayers,
        rounds,
        drawTime,
        isPrivate,
        category: showCustom ? "all" : category,
        customWords: parsedCustomWords,
      });
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError("");
    setJoining(true);
    try {
      const code = joinCode.trim().toUpperCase();
      await roomAPI.join(code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join room");
    } finally {
      setJoining(false);
    }
  };

  const handleJoinPublic = async (code) => {
    setError("");
    try {
      await roomAPI.join(code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join room");
    }
  };

  const handleSpectate = (code) => {
    navigate(`/room/${code}`, { state: { spectate: true } });
  };

  return (
    <div className={`${styles.page} ${loaded ? styles.loaded : ""}`}>
      {/* Background Effects */}
      <div className={styles.gridBg}></div>
      <div className={styles.scanlines}></div>
      <div className={styles.vignette}></div>

      <header className={styles.header}>
        <div className={styles.logoArea}>
          <h1 className={styles.logo}>
            <span className={styles.glitch} data-text="d_SketchRelay">
              d_SketchRelay
            </span>
            <span className={styles.cursor}>_</span>
          </h1>
          <span className={styles.tagline}>&lt; SYSTEM_LOBBY /&gt;</span>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.avatarGlow}>
            <Avatar username={user?.username} size={34} />
          </div>
          <div className={styles.userText}>
            OPERATOR: <strong>{user?.username}</strong>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            LOG_OUT
          </button>
        </div>
      </header>

      {error && <div className={styles.globalError}>[ERROR] {error}</div>}

      <div className={styles.grid}>
        {/* ── Create Room ──────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>INITIALIZE_ROOM</h2>
            <div className={styles.cardDecoLine}></div>
          </div>
          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.field}>
              <label>
                MAX_PLAYERS: <strong>{maxPlayers}</strong>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.field}>
              <label>
                ROUNDS: <strong>{rounds}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.field}>
              <label>
                DRAW_TIME: <strong>{drawTime}s</strong>
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="10"
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.field}>
              <label>CATEGORY_PROTOCOL</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowCustom(false);
                }}
                disabled={showCustom}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.toggleSwitch}></span>
                <span>ENCRYPT_CONNECTION (PRIVATE)</span>
              </label>
            </div>

            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showCustom}
                  onChange={(e) => setShowCustom(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.toggleSwitch}></span>
                <span>UPLOAD_CUSTOM_DATA</span>
              </label>
            </div>

            {showCustom && (
              <div className={styles.field}>
                <label>
                  WORD_DATA_STREAM{" "}
                  <span className={styles.hint}>(comma-separated, max 50)</span>
                </label>
                <textarea
                  className={styles.textarea}
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  placeholder="cat, rainbow, castle, dancing..."
                  rows={3}
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={creating}
            >
              {creating
                ? "BOOTING..."
                : `EXECUTE_${isPrivate ? "PRIVATE" : "PUBLIC"}_ROOM`}
            </button>
          </form>
        </div>

        {/* ── Join by Code ─────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>MANUAL_OVERRIDE</h2>
            <div className={styles.cardDecoLine}></div>
          </div>
          <p className={styles.joinDesc}>
            Enter a secure room code to establish connection.
          </p>
          <form onSubmit={handleJoin} className={styles.form}>
            <div className={styles.field}>
              <label>ACCESS_CODE</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="U-D-U-F-T-P"
                maxLength={6}
                className={styles.codeInput}
              />
            </div>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? "CONNECTING..." : "CONNECT"}
            </button>
          </form>
        </div>

        {/* ── Rooms List ───────────────────────────────────────── */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.roomsHeader}>
            <h2>SERVER_BROWSER</h2>
            <span className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              ONLINE
            </span>
          </div>

          {roomsLoading ? (
            <div className={styles.skeletons}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : publicRooms.length === 0 ? (
            <p className={styles.muted}>&lt; NO_ACTIVE_SERVERS /&gt;</p>
          ) : (
            <div className={styles.roomList}>
              {publicRooms.map((room) => {
                const activePlayers =
                  room.players?.filter((p) => !p.isSpectator) || [];
                const isFull = activePlayers.length >= room.maxPlayers;
                const inProgress = room.status !== "waiting";
                const isPrivateRoom = room.isPrivate;

                return (
                  <div
                    key={room._id}
                    className={`${styles.roomRow} ${isPrivateRoom ? styles.roomRowPrivate : ""}`}
                  >
                    <div className={styles.roomInfo}>
                      <div className={styles.roomTopRow}>
                        <span className={styles.roomCode}>[{room.code}]</span>

                        {/* Private / Public badge */}
                        {isPrivateRoom ? (
                          <span
                            className={`${styles.roomTypeBadge} ${styles.badgePrivate}`}
                          >
                            LOCKED
                          </span>
                        ) : (
                          <span
                            className={`${styles.roomTypeBadge} ${styles.badgePublic}`}
                          >
                            PUBLIC
                          </span>
                        )}

                        {inProgress && (
                          <span className={styles.inProgressBadge}>
                            IN_PROGRESS
                          </span>
                        )}
                      </div>
                      <span className={styles.roomMeta}>
                        {activePlayers.length}/{room.maxPlayers} USERS ·{" "}
                        {room.rounds} ROUNDS
                        {room.category &&
                          room.category !== "all" &&
                          ` · ${room.category.toUpperCase()}`}
                      </span>
                    </div>

                    <div className={styles.roomActions}>
                      {inProgress ? (
                        <button
                          onClick={() => handleSpectate(room.code)}
                          className={styles.spectateBtn}
                        >
                          SPECTATE
                        </button>
                      ) : isPrivateRoom ? (
                        <button className={styles.lockedBtn} disabled>
                          🔒 LOCKED
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinPublic(room.code)}
                          className={styles.joinBtn}
                          disabled={isFull}
                        >
                          {isFull ? "FULL" : "JOIN"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
