// client/src/socket/socket.js
import { io } from "socket.io-client";

// autoConnect: false means the socket does NOT connect immediately on import.
// We connect manually when a player enters a game room, and disconnect
// when they leave. This prevents stale connections in the lobby.
const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
});

export default socket;
