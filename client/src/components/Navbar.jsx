import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const path = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleNav = (to) => {
    navigate(to);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        {/* Logo — always goes home */}
        <button className={styles.logo} onClick={() => handleNav("/")}>
          <span className={styles.glitchText} data-text="d_SketchRelay">
            d_SketchRelay
          </span>
          <span className={styles.cursor}>_</span>
        </button>

        {/* Desktop Navigation Links */}
        <div className={styles.links}>
          <button
            className={`${styles.link} ${path === "/" ? styles.active : ""}`}
            onClick={() => handleNav("/")}
          >
            HOME
          </button>
          {user && (
            <button
              className={`${styles.link} ${
                path === "/lobby" ? styles.active : ""
              }`}
              onClick={() => handleNav("/lobby")}
            >
              LOBBY
            </button>
          )}
        </div>

        {/* Desktop User Section */}
        <div className={styles.userSection}>
          {user ? (
            <>
              <div
                className={styles.userInfo}
                onClick={() => handleNav("/lobby")}
              >
                <div className={styles.avatarGlow}>
                  <Avatar username={user.username} size={28} />
                </div>
                <span className={styles.username}>{user.username}</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                LOG_OUT
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.loginBtn}
                onClick={() => handleNav("/login")}
              >
                LOG_IN
              </button>
              <button
                className={styles.registerBtn}
                onClick={() => handleNav("/register")}
              >
                SIGN_UP
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        className={`${styles.mobileMenu} ${
          isMobileMenuOpen ? styles.mobileMenuOpen : ""
        }`}
      >
        <div className={styles.mobileContent}>
          <div className={styles.mobileLinks}>
            <button
              className={`${styles.mobileLink} ${
                path === "/" ? styles.active : ""
              }`}
              onClick={() => handleNav("/")}
            >
              &gt; HOME
            </button>
            {user && (
              <button
                className={`${styles.mobileLink} ${
                  path === "/lobby" ? styles.active : ""
                }`}
                onClick={() => handleNav("/lobby")}
              >
                &gt; LOBBY
              </button>
            )}
          </div>

          <div className={styles.mobileAuth}>
            {user ? (
              <>
                <div className={styles.mobileUserDisplay}>
                  <Avatar username={user.username} size={40} />
                  <span>{user.username}</span>
                </div>
                <button
                  className={styles.mobileLogoutBtn}
                  onClick={handleLogout}
                >
                  [ LOG_OUT ]
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.mobileBtn}
                  onClick={() => handleNav("/login")}
                >
                  LOG IN
                </button>
                <button
                  className={`${styles.mobileBtn} ${styles.mobileBtnPrimary}`}
                  onClick={() => handleNav("/register")}
                >
                  SIGN UP
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
