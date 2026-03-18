import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/index";
import useAuth from "../hooks/useAuth";
import styles from "./Auth.module.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      return setError("Please fill in all fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return setError(
        "Password must be at least 8 chars and include uppercase, lowercase, number, special char",
      );
    }

    setLoading(true);
    try {
      const res = await authAPI.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      login(res.data.user, res.data.token);
      navigate("/lobby");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background Effects */}
      <div className={styles.gridBg}></div>
      <div className={styles.scanlines}></div>
      <div className={styles.vignette}></div>

      <div className={styles.card}>
        <h1 className={styles.title}>
          <span className={styles.glitch} data-text="d_Sketch">
            d_Sketch
          </span>

          <span className={styles.glitch} data-text="Relay">
            Relay
          </span>

          <span className={styles.cursor}>_</span>
        </h1>
        <p className={styles.subtitle}>&lt; NEW_REGISTRATION /&gt;</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">USERNAME</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="enter_alias"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">EMAIL_ID</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@net.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">PASSWORD_KEY</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min_8_chars, upper/lower/number/symbol"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">CONFIRM_PASSWORD</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="re-enter password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className={styles.error}>[ERROR] {error}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "CREATING_ID..." : "REGISTER_OPERATOR"}
          </button>
        </form>

        <p className={styles.switch}>
          EXISTING_ID? <Link to="/login">LOGIN</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
