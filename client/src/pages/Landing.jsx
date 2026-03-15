// client/src/pages/Landing.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import styles from "./Landing.module.css";

const PREVIEW_WORDS = [
  "elephant",
  "volcano",
  "spaghetti",
  "astronaut",
  "rainbow",
];
const PREVIEW_HINTS = [
  "_ _ _ _ _ _ _ _",
  "_ _ _ _ _ _ _",
  "_ _ _ _ _ _ _ _ _ _",
  "_ _ _ _ _ _ _ _ _ _",
  "_ _ _ _ _ _ _",
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
  }, []);

  // Cycle through word previews
  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), 1500);
    const nextTimer = setTimeout(() => {
      setRevealed(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % PREVIEW_WORDS.length);
      }, 400);
    }, 3000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(nextTimer);
    };
  }, [wordIdx]);

  const handlePlay = () => {
    if (user) navigate("/lobby");
    else navigate("/register");
  };

  const FEATURES = [
    {
      icon: "✏️",
      title: "Draw anything",
      desc: "Express yourself on a shared canvas with a full palette and brush control.",
    },
    {
      icon: "🔍",
      title: "Guess fast",
      desc: "Race to guess the word before time runs out. Closer guesses get hints.",
    },
    {
      icon: "🏆",
      title: "Compete and win",
      desc: "Score points for speed. Drawers earn bonuses when others guess correctly.",
    },
    {
      icon: "🌐",
      title: "Play anywhere",
      desc: "Fully mobile-ready. Works on any phone, tablet, or desktop.",
    },
    {
      icon: "🔒",
      title: "Private rooms",
      desc: "Create a private room with a code and invite only your friends.",
    },
    {
      icon: "🎨",
      title: "Word categories",
      desc: "Choose from Animals, Food, Places, Movies, and more — or make your own list.",
    },
  ];

  return (
    <div className={`${styles.page} ${loaded ? styles.loaded : ""}`}>
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>d_SketchRelay</div>
        <div className={styles.navActions}>
          {user ? (
            <button
              className={styles.navCta}
              onClick={() => navigate("/lobby")}
            >
              Go to lobby
            </button>
          ) : (
            <>
              <button
                className={styles.navLink}
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
              <button
                className={styles.navCta}
                onClick={() => navigate("/register")}
              >
                Sign up free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}>
            🎮 Free to play · No download needed
          </div>
          <h1 className={styles.heroTitle}>
            The drawing game
            <br />
            <span className={styles.heroAccent}>everyone wins at</span>
          </h1>
          <p className={styles.heroDesc}>
            Draw words, guess what your friends are drawing, and compete for the
            top spot. Real-time, multiplayer, instant fun — no account required
            to watch.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.ctaBtn} onClick={handlePlay}>
              {user ? "Go to lobby" : "Play now — it's free"}
            </button>
            {!user && (
              <button
                className={styles.secondaryBtn}
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            )}
          </div>
          <p className={styles.heroMeta}>
            Join rooms instantly · No download · Works on mobile
          </p>
        </div>

        {/* Animated word preview */}
        <div className={styles.heroRight}>
          <div className={styles.previewCard}>
            <div className={styles.previewCanvas}>
              <DrawingPreview wordIdx={wordIdx} />
            </div>
            <div className={styles.previewHint}>
              <span className={styles.previewUnderscores}>
                {revealed ? PREVIEW_WORDS[wordIdx] : PREVIEW_HINTS[wordIdx]}
              </span>
              <span className={styles.previewLetterCount}>
                {PREVIEW_WORDS[wordIdx].length} letters
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need to play</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {[
            {
              n: "1",
              title: "Create or join a room",
              desc: "Start a new room or enter a 6-character code from a friend.",
            },
            {
              n: "2",
              title: "Take turns drawing",
              desc: "Each player draws a secret word while others guess in chat.",
            },
            {
              n: "3",
              title: "Score points",
              desc: "Faster correct guesses = more points. Drawers earn bonuses too.",
            },
            {
              n: "4",
              title: "Win the round",
              desc: "After all rounds, the player with the most points wins.",
            },
          ].map((s) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready to draw?</h2>
        <p className={styles.ctaBannerDesc}>
          Jump into a game right now. No setup. No download. Pure fun.
        </p>
        <button className={styles.ctaBtn} onClick={handlePlay}>
          {user ? "Back to lobby" : "Get started for free"}
        </button>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>d_SketchRelay — A Skribbl-inspired multiplayer drawing game</span>
      </footer>
    </div>
  );
};

// Animated canvas preview — draws simple SVG shapes that hint at each word
const DRAWINGS = [
  // elephant
  <svg
    key="elephant"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse
      cx="110"
      cy="90"
      rx="55"
      ry="45"
      stroke="#818cf8"
      strokeWidth="2.5"
    />
    <ellipse
      cx="65"
      cy="75"
      rx="25"
      ry="20"
      stroke="#818cf8"
      strokeWidth="2.5"
    />
    <path
      d="M55 95 Q40 120 45 140"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="58" cy="68" r="3" fill="#818cf8" />
    <path
      d="M80 115 L75 140 M95 118 L93 143 M115 115 L113 140 M130 112 L132 137"
      stroke="#818cf8"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>,
  // volcano
  <svg
    key="volcano"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M30 150 L85 60 L100 75 L115 55 L170 150 Z"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M85 60 Q90 30 100 25 Q110 30 115 55"
      stroke="#f97316"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M95 35 Q88 20 82 10"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M105 32 Q112 18 118 8"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>,
  // spaghetti
  <svg
    key="spaghetti"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse
      cx="100"
      cy="110"
      rx="70"
      ry="30"
      stroke="#818cf8"
      strokeWidth="2.5"
    />
    <path
      d="M50 110 Q80 70 100 90 Q120 110 150 75"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M55 105 Q75 65 105 85 Q125 100 155 68"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M60 115 Q90 75 110 95 Q130 115 155 80"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="75" cy="88" r="6" fill="#ef4444" opacity="0.8" />
    <circle cx="130" cy="82" r="5" fill="#ef4444" opacity="0.8" />
  </svg>,
  // astronaut
  <svg
    key="astronaut"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="55" r="30" stroke="#818cf8" strokeWidth="2.5" />
    <rect
      x="70"
      y="80"
      width="60"
      height="55"
      rx="20"
      stroke="#818cf8"
      strokeWidth="2.5"
    />
    <rect
      x="82"
      y="42"
      width="36"
      height="24"
      rx="8"
      stroke="#a5f3fc"
      strokeWidth="2"
    />
    <path
      d="M55 95 L40 105 M55 110 L40 120"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M145 95 L160 105 M145 110 L160 120"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M80 135 L75 155 M120 135 L125 155"
      stroke="#818cf8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>,
  // rainbow
  <svg
    key="rainbow"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 140 Q100 10 180 140"
      stroke="#ef4444"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 140 Q100 28 168 140"
      stroke="#f97316"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M44 140 Q100 46 156 140"
      stroke="#eab308"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M56 140 Q100 64 144 140"
      stroke="#22c55e"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M68 140 Q100 82 132 140"
      stroke="#3b82f6"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M80 140 Q100 100 120 140"
      stroke="#8b5cf6"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
  </svg>,
];

const DrawingPreview = ({ wordIdx }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
    }}
  >
    {DRAWINGS[wordIdx % DRAWINGS.length]}
  </div>
);

export default Landing;
