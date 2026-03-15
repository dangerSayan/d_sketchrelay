import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext"; // ADD
import useAuth from "./hooks/useAuth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import GameRoom from "./pages/GameRoom";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      path="/lobby"
      element={
        <ProtectedRoute>
          <Lobby />
        </ProtectedRoute>
      }
    />
    <Route
      path="/room/:code"
      element={
        <ProtectedRoute>
          <GameRoom />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          {" "}
          {/* ADD — wraps everything below AuthProvider */}
          <AppRoutes />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
