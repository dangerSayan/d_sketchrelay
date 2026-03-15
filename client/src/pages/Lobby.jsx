// client/src/pages/Lobby.jsx
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
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <h1 className={styles.logo}>d_SketchRelay</h1>
          <span className={styles.tagline}>Draw. Guess. Win.</span>
        </div>
        <div className={styles.userInfo}>
          <Avatar username={user?.username} size={34} />
          <span>
            Hey, <strong>{user?.username}</strong>
          </span>
          <button onClick={logout} className={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className={styles.globalError}>{error}</div>}

      <div className={styles.grid}>
        {/* ── Create Room ──────────────────────────────────────── */}
        <div className={styles.card}>
          <h2>Create a room</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.field}>
              <label>
                Max players: <strong>{maxPlayers}</strong>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>

            <div className={styles.field}>
              <label>
                Rounds: <strong>{rounds}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
            </div>

            <div className={styles.field}>
              <label>
                Draw time: <strong>{drawTime}s</strong>
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="10"
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
              />
            </div>

            <div className={styles.field}>
              <label>Word category</label>
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
                />
                🔒 Private room
              </label>
              <span className={styles.toggleHint}>
                {isPrivate ? "Joinable via code only" : "Visible in rooms list"}
              </span>
            </div>

            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showCustom}
                  onChange={(e) => setShowCustom(e.target.checked)}
                />
                Custom word list
              </label>
            </div>

            {showCustom && (
              <div className={styles.field}>
                <label>
                  Words{" "}
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
                ? "Creating..."
                : `Create ${isPrivate ? "private" : "public"} room`}
            </button>
          </form>
        </div>

        {/* ── Join by Code ─────────────────────────────────────── */}
        <div className={styles.card}>
          <h2>Join by code</h2>
          <p className={styles.joinDesc}>
            Enter a room code to join any room — including private ones shared
            with you.
          </p>
          <form onSubmit={handleJoin} className={styles.form}>
            <div className={styles.field}>
              <label>Room code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. UDUFTP"
                maxLength={6}
                className={styles.codeInput}
              />
            </div>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? "Joining..." : "Join room"}
            </button>
          </form>
        </div>

        {/* ── Rooms List ───────────────────────────────────────── */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.roomsHeader}>
            <h2>All rooms</h2>
            <span className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              live
            </span>
          </div>

          {roomsLoading ? (
            <div className={styles.skeletons}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : publicRooms.length === 0 ? (
            <p className={styles.muted}>No open rooms right now. Create one!</p>
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
                        <span className={styles.roomCode}>{room.code}</span>

                        {/* Private / Public badge */}
                        {isPrivateRoom ? (
                          <span
                            className={`${styles.roomTypeBadge} ${styles.badgePrivate}`}
                          >
                            🔒 Private
                          </span>
                        ) : (
                          <span
                            className={`${styles.roomTypeBadge} ${styles.badgePublic}`}
                          >
                            🌐 Public
                          </span>
                        )}

                        {inProgress && (
                          <span className={styles.inProgressBadge}>
                            In progress
                          </span>
                        )}
                      </div>
                      <span className={styles.roomMeta}>
                        {activePlayers.length}/{room.maxPlayers} players ·{" "}
                        {room.rounds} round{room.rounds !== 1 ? "s" : ""}
                        {room.category &&
                          room.category !== "all" &&
                          ` · ${room.category}`}
                      </span>
                    </div>

                    <div className={styles.roomActions}>
                      {inProgress ? (
                        <button
                          onClick={() => handleSpectate(room.code)}
                          className={styles.spectateBtn}
                        >
                          Watch
                        </button>
                      ) : isPrivateRoom ? (
                        // Private room — show locked button, tooltip explains why
                        <button
                          className={styles.lockedBtn}
                          disabled
                          title="Private room — use the room code to join"
                        >
                          🔒 Code only
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinPublic(room.code)}
                          className={styles.joinBtn}
                          disabled={isFull}
                        >
                          {isFull ? "Full" : "Join"}
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
