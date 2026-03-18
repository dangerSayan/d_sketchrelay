import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { authAPI } from "../api/index";
import Avatar from "../components/Avatar";
import { AVATAR_PRESETS } from "../utils/avatar";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // State for Tabs
  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'security'

  // Form States
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || "");
    setSelectedAvatar(user.avatar || "");
  }, [user]);

  if (!user) {
    return null;
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setSaving(true);

    try {
      const res = await authAPI.updateMe({
        username: username.trim(),
        avatar: selectedAvatar,
      });
      updateUser(res.data.user);
      setMessage("Identity updated successfully.");
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("All security fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    // Password Regex (At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "Password too weak. Use 8+ chars with mix of UPPERCASE, lowercase, numbers & symbols.",
      );
      return;
    }

    setChangingPassword(true);
    try {
      const res = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordMessage(res.data.message || "Security credentials updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      // Clear message after 3 seconds
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Current password is incorrect.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDefaultAvatar = () => {
    setSelectedAvatar("");
  };

  return (
    <div className={styles.page}>
      {/* Background Grid Effect */}
      <div className={styles.bgGrid}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.glitch} data-text="PLAYER PROFILE">
              PLAYER PROFILE
            </span>
          </h1>
          <div className={styles.userPreview}>
            <Avatar
              username={username || "GUEST"}
              avatar={selectedAvatar}
              size={48}
            />
            <div className={styles.userMeta}>
              <span className={styles.status}>
                ID: {user.username?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "identity" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("identity")}
          >
            <span className={styles.tabIcon}>👤</span> IDENTITY
          </button>
          <button
            className={`${styles.tab} ${activeTab === "security" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <span className={styles.tabIcon}>🔒</span> SECURITY
          </button>
        </div>

        {/* ── TAB CONTENT: IDENTITY ───────────────────────────────────────────────────── */}
        {activeTab === "identity" && (
          <div className={styles.contentPanel}>
            <form onSubmit={handleSaveProfile}>
              <div className={styles.formGroup}>
                <label className={styles.label}>USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={15}
                  className={styles.input}
                  placeholder="Enter display name..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>EMAIL ADDRESS (LOCKED)</label>
                <div className={styles.lockedInputWrapper}>
                  <input
                    type="text"
                    readOnly
                    value={user.email}
                    className={`${styles.input} ${styles.readOnly}`}
                  />
                  <span className={styles.lockIcon}>🔒</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>AVATAR PRESET</label>
                <div className={styles.avatarGrid}>
                  <button
                    type="button"
                    onClick={handleDefaultAvatar}
                    className={`${styles.presetItem} ${!selectedAvatar ? styles.activePreset : ""}`}
                    title="Auto-generated Color"
                  >
                    <Avatar username={username} avatar={""} size={48} />
                    <span>AUTO</span>
                  </button>
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.id)}
                      className={`${styles.presetItem} ${selectedAvatar === preset.id ? styles.activePreset : ""}`}
                      title={preset.label}
                    >
                      <Avatar
                        username={username}
                        avatar={preset.id}
                        size={48}
                      />
                      <span>{preset.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "UPLOADING..." : "SAVE IDENTITY"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB CONTENT: SECURITY ───────────────────────────────────────────────────── */}
        {activeTab === "security" && (
          <div className={styles.contentPanel}>
            <form onSubmit={handleChangePassword}>
              <p className={styles.securityInfo}>
                Update your access credentials. <br />
                <span className={styles.warnText}>
                  /!\\ Current password is required to make changes.
                </span>
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  className={`${styles.input} ${passwordError ? styles.inputError : ""}`}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>NEW PASSWORD</label>
                <input
                  type="password"
                  className={`${styles.input} ${passwordError ? styles.inputError : ""}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••••••"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  className={`${styles.input} ${passwordError ? styles.inputError : ""}`}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="•••••••••••"
                />
              </div>

              {passwordError && <p className={styles.error}>{passwordError}</p>}
              {passwordMessage && (
                <p className={styles.success}>{passwordMessage}</p>
              )}

              <button
                type="submit"
                className={styles.securityBtn}
                disabled={changingPassword}
              >
                {changingPassword ? "UPDATING..." : "UPDATE CREDENTIALS"}
              </button>
            </form>
          </div>
        )}

        {/* Footer / Global Actions */}
        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => navigate("/lobby")}>
            ← BACK TO LOBBY
          </button>
          <button className={styles.logoutBtn} onClick={logout}>
            LOG_OUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
