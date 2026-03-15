// client/src/pages/Lobby.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roomAPI } from "../api/index";
import useAuth from "../hooks/useAuth";
import styles from "./Lobby.module.css";

const Lobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── State for the three panels ──────────────────────────────────────────
  const [publicRooms, setPublicRooms] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);

  // ── Loading and error states ─────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch public rooms on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomAPI.getPublic();
        setPublicRooms(res.data.rooms);
      } catch {
        // Non-critical — just show empty list
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, []); // empty array = run once on mount

  // ── Create a new room ────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await roomAPI.create({ maxPlayers, rounds, drawTime });
      // Navigate to the game room using the code the server generated
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  // ── Join an existing room by code ─────────────────────────────────────────
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

  // ── Join a public room by clicking it ────────────────────────────────────
  const handleJoinPublic = async (code) => {
    setError("");
    try {
      await roomAPI.join(code);
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join room");
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.logo}>Skribbl Clone</h1>
        <div className={styles.userInfo}>
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
        {/* ── Panel 1: Create Room ───────────────────────────────────── */}
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

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create room"}
            </button>
          </form>
        </div>

        {/* ── Panel 2: Join by Code ──────────────────────────────────── */}
        <div className={styles.card}>
          <h2>Join by code</h2>
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

        {/* ── Panel 3: Public Rooms ──────────────────────────────────── */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2>Open rooms</h2>
          {roomsLoading ? (
            <p className={styles.muted}>Loading rooms...</p>
          ) : publicRooms.length === 0 ? (
            <p className={styles.muted}>No open rooms right now. Create one!</p>
          ) : (
            <div className={styles.roomList}>
              {publicRooms.map((room) => (
                <div key={room._id} className={styles.roomRow}>
                  <div>
                    <span className={styles.roomCode}>{room.code}</span>
                    <span className={styles.roomMeta}>
                      {room.players.length}/{room.maxPlayers} players ·{" "}
                      {room.rounds} rounds
                    </span>
                  </div>
                  <button
                    onClick={() => handleJoinPublic(room.code)}
                    className={styles.joinBtn}
                    disabled={room.players.length >= room.maxPlayers}
                  >
                    {room.players.length >= room.maxPlayers ? "Full" : "Join"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
