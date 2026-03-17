// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { authAPI } from "../api/index";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("skribbl_token"));
  const [loading, setLoading] = useState(true);

  const normalizeUser = (user) => {
    if (!user) return null;
    return {
      ...user,
      _id: user._id || user.id || null,
      id: user.id || user._id || null,
    };
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("skribbl_token");

    if (savedToken) {
      authAPI
        .getMe()
        .then((res) => {
          setUser(normalizeUser(res.data.user));
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem("skribbl_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem("skribbl_token", userToken);
    setToken(userToken);
    setUser(normalizeUser(userData));
  };

  const logout = () => {
    localStorage.removeItem("skribbl_token");
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
