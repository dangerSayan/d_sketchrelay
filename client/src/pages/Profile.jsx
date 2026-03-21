import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { authAPI } from "../api/index";
import Avatar from "../components/Avatar";
import {
  AVATAR_CHARACTERS,
  AVATAR_BACKGROUNDS,
  AVATAR_FRAME_PRESETS,
  CHARACTER_CATEGORIES,
  buildAvatarString,
  parseAvatarString,
} from "../utils/avatar";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [username, setUsername] = useState("");

  // ── Avatar builder state ───────────────────────────────────────────────
  const [avatarStep, setAvatarStep] = useState("character"); // "character" | "background" | "frame"
  const [charFilter, setCharFilter] = useState("All");
  const [selIcon, setSelIcon] = useState("🐉");
  const [selBg, setSelBg] = useState("bg_indigo");
  const [selFrame, setSelFrame] = useState("neon_blue");

  // Current preview avatar string
  const previewAvatar = buildAvatarString(selIcon, selBg, selFrame);

  // ── Other state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("identity");
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

    // Parse existing avatar into parts
    const parsed = parseAvatarString(user.avatar || "");
    if (parsed.icon) setSelIcon(parsed.icon);
    if (parsed.bgId) setSelBg(parsed.bgId);
    if (parsed.frameId) setSelFrame(parsed.frameId);
  }, [user]);

  if (!user) return null;

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
        avatar: previewAvatar,
      });
      updateUser(res.data.user);
      setMessage("Identity updated successfully.");
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
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Current password is incorrect.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Characters filtered by category tab
  const charTabs = ["All", ...CHARACTER_CATEGORIES];
  const visibleChars =
    charFilter === "All"
      ? AVATAR_CHARACTERS
      : AVATAR_CHARACTERS.filter((c) => c.category === charFilter);

  return (
    <div className={styles.page}>
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
              avatar={previewAvatar}
              size={52}
            />
            <div className={styles.userMeta}>
              <span className={styles.status}>
                ID: {user.username?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Tabs */}
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

        {/* ── IDENTITY TAB ──────────────────────────────────────────────── */}
        {activeTab === "identity" && (
          <div className={styles.contentPanel}>
            <form onSubmit={handleSaveProfile}>
              {/* Username */}
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

              {/* Email (locked) */}
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

              {/* ── AVATAR BUILDER ──────────────────────────────────────── */}
              <div className={styles.formGroup}>
                <label className={styles.label}>AVATAR BUILDER</label>

                {/* Live preview + step indicator */}
                <div className={styles.avatarBuilderHeader}>
                  <Avatar
                    username={username}
                    avatar={previewAvatar}
                    size={64}
                  />
                  <div className={styles.stepIndicators}>
                    {["character", "background", "frame"].map((step, i) => (
                      <button
                        key={step}
                        type="button"
                        className={`${styles.stepBtn} ${avatarStep === step ? styles.stepBtnActive : ""}`}
                        onClick={() => setAvatarStep(step)}
                      >
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span className={styles.stepLabel}>
                          {step === "character"
                            ? "CHARACTER"
                            : step === "background"
                              ? "BACKGROUND"
                              : "FRAME"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── STEP 1: Character ─────────────────────────────────── */}
                {avatarStep === "character" && (
                  <div className={styles.builderPanel}>
                    <div className={styles.builderTabs}>
                      {charTabs.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`${styles.filterTab} ${charFilter === tab ? styles.filterTabActive : ""}`}
                          onClick={() => setCharFilter(tab)}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className={styles.charGrid}>
                      {visibleChars.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.charCell} ${selIcon === c.id ? styles.charCellSelected : ""}`}
                          onClick={() => setSelIcon(c.id)}
                          title={c.label}
                        >
                          <span className={styles.charEmoji}>{c.id}</span>
                          <span className={styles.charLabel}>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Background ───────────────────────────────── */}
                {avatarStep === "background" && (
                  <div className={styles.builderPanel}>
                    <div className={styles.bgGrid2}>
                      {AVATAR_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          className={`${styles.bgCell} ${selBg === bg.id ? styles.bgCellSelected : ""}`}
                          onClick={() => setSelBg(bg.id)}
                          title={bg.label}
                        >
                          <div
                            className={styles.bgSwatch}
                            style={{ background: bg.value }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>
                              {selIcon}
                            </span>
                          </div>
                          <span className={styles.bgLabel}>{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Frame ─────────────────────────────────────── */}
                {avatarStep === "frame" && (
                  <div className={styles.builderPanel}>
                    <div className={styles.frameGrid}>
                      {AVATAR_FRAME_PRESETS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`${styles.frameCell} ${selFrame === f.id ? styles.frameCellSelected : ""}`}
                          onClick={() => setSelFrame(f.id)}
                          title={f.label}
                        >
                          <div className={styles.framePreview}>
                            <div
                              className={styles.frameSwatch}
                              style={{
                                background:
                                  AVATAR_BACKGROUNDS.find((b) => b.id === selBg)
                                    ?.value || "#6366f1",
                                boxShadow: f.value,
                              }}
                            >
                              <span style={{ fontSize: "1.1rem" }}>
                                {selIcon}
                              </span>
                            </div>
                          </div>
                          <span className={styles.frameLabel}>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* ── END AVATAR BUILDER ────────────────────────────────── */}

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

        {/* ── SECURITY TAB (unchanged) ──────────────────────────────────── */}
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

        {/* Footer */}
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
