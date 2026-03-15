// client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/index";
import useAuth from "../hooks/useAuth";
import styles from "./Auth.module.css";

const Login = () => {
  // Form field values — controlled inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [error, setError] = useState(""); // error message to display
  const [loading, setLoading] = useState(false); // disables button while waiting

  const { login } = useAuth(); // get the login function from context
  const navigate = useNavigate(); // programmatic navigation

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default browser form submission (page reload)
    setError(""); // clear any previous error
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      // res.data = { token, user, message }

      // Save to AuthContext (which also saves to localStorage)
      login(res.data.user, res.data.token);

      // Navigate to lobby
      navigate("/lobby");
    } catch (err) {
      // Axios puts server error responses in err.response.data
      // If the server is completely unreachable, err.response is undefined
      const msg =
        err.response?.data?.message || "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false); // always re-enable the button
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>d_d_SketchRelay</h1>
        <p className={styles.subtitle}>Sign in to play</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Only render error div when there's actually an error */}
          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.switch}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
