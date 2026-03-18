// client/src/api/index.js
import axios from "axios";

// Create a custom Axios instance with our backend URL baked in.
// Every call made through 'api' automatically goes to port 5000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ── INTERCEPTOR ─────────────────────────────────────────────────────────────
// An interceptor is a function that runs on EVERY request before it's sent.
// This one automatically attaches the JWT token to every request.
// Without this, you'd have to manually add the Authorization header every time.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("skribbl_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; // always return config, or the request won't be sent
});

// ── AUTH API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  // data = { username, email, password }
  // returns { token, user, message }

  login: (data) => api.post("/api/auth/login", data),
  // data = { email, password }
  // returns { token, user, message }

  getMe: () => api.get("/api/auth/me"),
  // no body needed — token is attached by interceptor
  // returns { user }

  updateMe: (data) => api.put("/api/auth/me", data),
  // data = { username?, avatar? }
  // returns { user, message }

  changePassword: (data) => api.put("/api/auth/me/password", data),
  // data = { currentPassword, newPassword, confirmNewPassword }
  // returns { message }
};

// ── ROOM API ──────────────────────────────────────────────────────────────────
export const roomAPI = {
  create: (data) => api.post("/api/rooms", data),
  // data = { maxPlayers, rounds, drawTime }
  // returns { room }

  join: (code) => api.post(`/api/rooms/${code}/join`),
  // returns { room }

  getPublic: () => api.get("/api/rooms/public"),
  // returns { rooms[] }

  getOne: (code) => api.get(`/api/rooms/${code}`),
  // returns { room }
};

export default api;
