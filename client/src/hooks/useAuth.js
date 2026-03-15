// client/src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);

  // If someone calls useAuth() outside of AuthProvider, context is null.
  // This error message helps you find the bug immediately.
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};

export default useAuth;
