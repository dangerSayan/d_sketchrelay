import { useEffect, useState, useRef } from "react";
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

  // Intersection Observer for scroll animations
  const observerRef = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = document.querySelectorAll(`.${styles.revealOnScroll}`);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
      {/* Background Elements */}
      <div className={styles.gridBg}></div>
      <div className={styles.scanlines}></div>
      <div className={styles.vignette}></div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1
            className={`${styles.revealOnScroll} ${styles.heroTitle}`}
            style={{ transitionDelay: "100ms" }}
          >
            THE DRAWING GAME
            <br />
            <span className={styles.heroAccent} data-text="EVERYONE WINS AT">
              EVERYONE WINS AT
            </span>
          </h1>
          <p
            className={`${styles.revealOnScroll} ${styles.heroDesc}`}
            style={{ transitionDelay: "200ms" }}
          >
            Draw words, guess what your friends are drawing, and compete for the
            top spot. Real-time, multiplayer, instant fun — no account required
            to watch.
          </p>
          <div
            className={`${styles.revealOnScroll} ${styles.heroBtns}`}
            style={{ transitionDelay: "300ms" }}
          >
            <button className={styles.ctaBtn} onClick={handlePlay}>
              <span className={styles.btnGlitch}></span>
              {user ? "GO TO LOBBY" : "PLAY NOW — IT'S FREE"}
            </button>
            {!user && (
              <button
                className={styles.secondaryBtn}
                onClick={() => navigate("/login")}
              >
                LOG IN
              </button>
            )}
          </div>
          <p
            className={`${styles.revealOnScroll} ${styles.heroMeta}`}
            style={{ transitionDelay: "400ms" }}
          >
            [JOIN_ROOMS_INSTANTLY] [NO_DOWNLOAD] [WORKS_ON_MOBILE]
          </p>
        </div>

        {/* Animated word preview */}
        <div
          className={`${styles.revealOnScroll} ${styles.heroRight}`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className={styles.previewCard}>
            <div className={styles.cardHeader}>
              <span>PREVIEW_MODE</span>
              <div className={styles.dots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className={styles.previewCanvas}>
              <DrawingPreview wordIdx={wordIdx} />
            </div>
            <div className={styles.previewHint}>
              <span className={styles.previewUnderscores}>
                {revealed ? PREVIEW_WORDS[wordIdx] : PREVIEW_HINTS[wordIdx]}
              </span>
              <span className={styles.previewLetterCount}>
                {PREVIEW_WORDS[wordIdx].length} CHARS
              </span>
            </div>
            <div className={styles.scanlineBar}></div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className={styles.features}>
        <h2 className={`${styles.revealOnScroll} ${styles.sectionTitle}`}>
          &lt; POWER_UPS /&gt;
        </h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, index) => (
            <div
              key={f.title}
              className={`${styles.revealOnScroll} ${styles.featureCard}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
              <div className={styles.cardDecoLine}></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className={styles.howItWorks}>
        <h2 className={`${styles.revealOnScroll} ${styles.sectionTitle}`}>
          MISSION BRIEFING
        </h2>
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
          ].map((s, i) => (
            <div
              key={s.n}
              className={`${styles.revealOnScroll} ${styles.step}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
              {i < 3 && <div className={styles.stepConnector}></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={`${styles.revealOnScroll} ${styles.ctaContent}`}>
          <h2 className={styles.ctaBannerTitle}>READY TO DRAW?</h2>
          <p className={styles.ctaBannerDesc}>
            Jump into a game right now. No setup. No download. Pure fun.
          </p>
          <button className={styles.ctaBtn} onClick={handlePlay}>
            {user ? "BACK TO LOBBY" : "GET STARTED FOR FREE"}
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>d_SketchRelay — A Skribbl-inspired multiplayer drawing game</span>
        <span>Developed by danger_Sayan</span>
        <span className={styles.footerDeco}>
          01001000 01000101 01001100 01001100 01001111
        </span>
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
    className={styles.drawingSvg}
  >
    <ellipse
      cx="110"
      cy="90"
      rx="55"
      ry="45"
      stroke="#00f3ff"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
    <ellipse
      cx="65"
      cy="75"
      rx="25"
      ry="20"
      stroke="#00f3ff"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M55 95 Q40 120 45 140"
      stroke="#00f3ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <circle cx="58" cy="68" r="3" fill="#bc13fe" />
    <path
      d="M80 115 L75 140 M95 118 L93 143 M115 115 L113 140 M130 112 L132 137"
      stroke="#00f3ff"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>,
  // volcano
  <svg
    key="volcano"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.drawingSvg}
  >
    <path
      d="M30 150 L85 60 L100 75 L115 55 L170 150 Z"
      stroke="#00f3ff"
      strokeWidth="2.5"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M85 60 Q90 30 100 25 Q110 30 115 55"
      stroke="#f97316"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M95 35 Q88 20 82 10"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M105 32 Q112 18 118 8"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>,
  // spaghetti
  <svg
    key="spaghetti"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.drawingSvg}
  >
    <ellipse
      cx="100"
      cy="110"
      rx="70"
      ry="30"
      stroke="#00f3ff"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M50 110 Q80 70 100 90 Q120 110 150 75"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M55 105 Q75 65 105 85 Q125 100 155 68"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M60 115 Q90 75 110 95 Q130 115 155 80"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
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
    className={styles.drawingSvg}
  >
    <circle
      cx="100"
      cy="55"
      r="30"
      stroke="#00f3ff"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
    <rect
      x="70"
      y="80"
      width="60"
      height="55"
      rx="20"
      stroke="#00f3ff"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
    <rect
      x="82"
      y="42"
      width="36"
      height="24"
      rx="8"
      stroke="#a5f3fc"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M55 95 L40 105 M55 110 L40 120"
      stroke="#00f3ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M145 95 L160 105 M145 110 L160 120"
      stroke="#00f3ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M80 135 L75 155 M120 135 L125 155"
      stroke="#00f3ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>,
  // rainbow
  <svg
    key="rainbow"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.drawingSvg}
  >
    <path
      d="M20 140 Q100 10 180 140"
      stroke="#ef4444"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M32 140 Q100 28 168 140"
      stroke="#f97316"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M44 140 Q100 46 156 140"
      stroke="#eab308"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M56 140 Q100 64 144 140"
      stroke="#22c55e"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M68 140 Q100 82 132 140"
      stroke="#3b82f6"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M80 140 Q100 100 120 140"
      stroke="#8b5cf6"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  </svg>,
];

const DrawingPreview = ({ wordIdx }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll("path, circle, rect, ellipse");

    paths.forEach((path) => {
      const length = path.getTotalLength();
      // Reset
      path.style.transition = "none";
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;

      // Force reflow
      path.getBoundingClientRect();

      // Animate
      path.style.transition =
        "stroke-dashoffset 2s ease-in-out, fill 0.5s ease 1.5s";
      path.style.strokeDashoffset = "0";

      // Handle fills separately if needed (for circles in elephant)
      if (path.tagName === "circle") {
        path.style.opacity = "0";
        path.style.transition = "opacity 0.5s ease 1.5s";
        setTimeout(() => (path.style.opacity = "0.8"), 1500);
      }
    });
  }, [wordIdx]);

  return (
    <div
      ref={svgRef}
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
};

export default Landing;
