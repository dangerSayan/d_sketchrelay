// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { authAPI } from "../api/index";

// Step 1: Create the context object.
// Think of this as the "shape" of the box. It starts empty.
// We export it so useAuth hook can subscribe to it.
export const AuthContext = createContext(null);

// Step 2: Create the Provider component.
// This is the actual box that holds the data.
// We wrap our entire app in this so every child can access it.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("skribbl_token"));
  const [loading, setLoading] = useState(true);
  // loading = true while we check if a stored token is still valid on page refresh

  // ── On app load: if there's a token in localStorage, verify it ──────────
  // Without this, every page refresh would log the user out.
  useEffect(() => {
    const savedToken = localStorage.getItem("skribbl_token");
    if (savedToken) {
      // Token exists — ask the server to validate it and give us the user
      authAPI
        .getMe()
        .then((res) => {
          setUser(res.data.user);
          setToken(savedToken);
        })
        .catch(() => {
          // Token was invalid or expired — clean up and force re-login
          localStorage.removeItem("skribbl_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // no token, nothing to verify
    }
  }, []); // empty array = run once when component mounts

  // ── login: called after a successful POST /api/auth/login ───────────────
  const login = (userData, userToken) => {
    localStorage.setItem("skribbl_token", userToken);
    setToken(userToken);
    setUser(userData);
  };

  // ── logout: clears everything and forces redirect to /login ─────────────
  const logout = () => {
    localStorage.removeItem("skribbl_token");
    setToken(null);
    setUser(null);
  };

  // The value object is what every consumer of this context receives.
  // Any component calling useAuth() gets all of these.
  const value = { user, token, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until we know if the user is logged in.
          Without this, protected pages flash for a moment before redirecting. */}
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
