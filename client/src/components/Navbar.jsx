// client/src/components/Navbar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={styles.nav}>
      {/* Logo — always goes home */}
      <button className={styles.logo} onClick={() => navigate("/")}>
        d_SketchRelay
      </button>

      {/* Navigation links */}
      <div className={styles.links}>
        <button
          className={`${styles.link} ${path === "/" ? styles.active : ""}`}
          onClick={() => navigate("/")}
        >
          Home
        </button>
        {user && (
          <button
            className={`${styles.link} ${path === "/lobby" ? styles.active : ""}`}
            onClick={() => navigate("/lobby")}
          >
            Lobby
          </button>
        )}
      </div>

      {/* User section */}
      <div className={styles.userSection}>
        {user ? (
          <>
            <div className={styles.userInfo} onClick={() => navigate("/lobby")}>
              <Avatar username={user.username} size={28} />
              <span className={styles.username}>{user.username}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.loginBtn}
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
            <button
              className={styles.registerBtn}
              onClick={() => navigate("/register")}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
