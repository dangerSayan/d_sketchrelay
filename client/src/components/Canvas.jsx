// client/src/components/Canvas.jsx
import { useRef, useEffect, useContext, useState, useCallback } from "react";
import { GameContext } from "../context/GameContext";
import socket from "../socket/socket";
import styles from "./Canvas.module.css";

// ── Constants ────────────────────────────────────────────────────────────
const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#1e293b",
  "#94a3b8",
  "#991b1b",
  "#9a3412",
  "#854d0e",
  "#365314",
  "#14532d",
  "#134e4a",
  "#1e3a8a",
  "#4c1d95",
  "#831843",
  "#881337",
  "#fca5a5",
  "#fed7aa",
  "#fef08a",
  "#bbf7d0",
  "#a5f3fc",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
];

const SIZE_PRESETS = [
  { label: "XS", value: 2 },
  { label: "S", value: 5 },
  { label: "M", value: 10 },
  { label: "L", value: 20 },
  { label: "XL", value: 35 },
];

const TOOLS = [
  { id: "pen", icon: "✏️", title: "Pen" },
  { id: "eraser", icon: "⬜", title: "Eraser" },
  { id: "line", icon: "╱", title: "Line" },
  { id: "rect", icon: "□", title: "Rectangle" },
  { id: "circle", icon: "○", title: "Circle/Ellipse" },
  { id: "fill", icon: "🪣", title: "Fill bucket" },
];

const W = 800;
const H = 550;

// ── Flood fill ───────────────────────────────────────────────────────────
function floodFill(ctx, sx, sy, fillHex) {
  const imgData = ctx.getImageData(0, 0, W, H);
  const d = imgData.data;
  const idx = (x, y) => (y * W + x) * 4;

  const sr = d[idx(sx, sy)],
    sg = d[idx(sx, sy) + 1];
  const sb = d[idx(sx, sy) + 2],
    sa = d[idx(sx, sy) + 3];

  // parse hex → rgb
  const hex = fillHex.replace("#", "");
  const fr = parseInt(hex.slice(0, 2), 16);
  const fg = parseInt(hex.slice(2, 4), 16);
  const fb = parseInt(hex.slice(4, 6), 16);

  if (sr === fr && sg === fg && sb === fb && sa === 255) return;

  const tol = 30;
  const match = (x, y) => {
    const i = idx(x, y);
    return (
      Math.abs(d[i] - sr) < tol &&
      Math.abs(d[i + 1] - sg) < tol &&
      Math.abs(d[i + 2] - sb) < tol &&
      Math.abs(d[i + 3] - sa) < tol
    );
  };

  const stack = [[sx, sy]];
  const visited = new Uint8Array(W * H);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= W || y < 0 || y >= H) continue;
    if (visited[y * W + x]) continue;
    if (!match(x, y)) continue;
    visited[y * W + x] = 1;
    const i = idx(x, y);
    d[i] = fr;
    d[i + 1] = fg;
    d[i + 2] = fb;
    d[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imgData, 0, 0);
}

// ── Component ─────────────────────────────────────────────────────────────
const Canvas = ({ roomCode, isDrawer }) => {
  const mainRef = useRef(null); // permanent drawing canvas
  const previewRef = useRef(null); // shape-preview overlay (drawer only)
  const mainCtx = useRef(null);
  const previewCtx = useRef(null);

  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const colorRef = useRef("#000000");
  const sizeRef = useRef(5);
  const toolRef = useRef("pen");

  // Undo/redo stacks — ImageData snapshots
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // Remote cursor state
  const [remoteCursor, setRemoteCursor] = useState(null);
  const cursorHideRef = useRef(null);

  // React-controlled UI state
  const [activeTool, setActiveTool] = useState("pen");
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeSize, setActiveSize] = useState(5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const { gameState } = useContext(GameContext);

  // ── Cursor Logic Helper (MS Paint / Draw.io Style) ─────────────────────
  const getCursorStyle = (tool) => {
    // 1. Pencil: Classic Yellow Pencil with Black Tip (Hotspot at tip)
    const pencilCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22L0 32L8 30L28 10L22 4L6 22Z" fill="%23FACC15" stroke="black"/><path d="M8 30L28 10L26 8L6 28L8 30Z" fill="%2394A3B8" stroke="black"/><path d="M0 32L8 30L6 28L0 32Z" fill="%23FCA5A5" stroke="black"/></svg>') 0 32, auto`;

    // 2. Eraser: White Square with Border (Hotspot in center)
    const eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><rect x="1" y="1" width="22" height="22" fill="white" stroke="black"/></svg>') 12 12, auto`;

    // 3. Crosshair: Precise Plus Sign (Hotspot in center)
    const crosshairCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><line x1="12" y1="0" x2="12" y2="24"/><line x1="0" y1="12" x2="24" y2="12"/></svg>') 12 12, auto`;

    // 4. Fill Bucket: Paint Bucket Icon (Hotspot at spout tip)
    const fillCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="black" stroke-width="1.5"><path d="M4 10L8 30H24L28 10H4Z" fill="%233B82F6" stroke="black"/><path d="M4 10L6 4H26L28 10H4Z" fill="%23FACC15" stroke="black"/><path d="M12 18C12 18 14 22 16 22C18 22 20 18 20 18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>') 16 30, auto`;

    switch (tool) {
      case "pen":
        return pencilCursor;
      case "eraser":
        return eraserCursor;
      case "fill":
        return fillCursor;
      case "line":
      case "rect":
      case "circle":
        return crosshairCursor;
      default:
        return "default";
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setTool = (t) => {
    toolRef.current = t;
    setActiveTool(t);
  };
  const setColor = (c) => {
    colorRef.current = c;
    setActiveColor(c);
  };
  const setSize = (s) => {
    sizeRef.current = s;
    setActiveSize(s);
  };

  const fillBg = (ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  };

  // Snapshot current main canvas into undo stack
  const snapshot = useCallback(() => {
    const snap = mainCtx.current?.getImageData(0, 0, W, H);
    if (!snap) return;
    undoStack.current.push(snap);
    if (undoStack.current.length > 40) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Broadcast full canvas state to all other clients
  const broadcastState = useCallback(() => {
    const dataURL = mainRef.current?.toDataURL("image/png");
    if (dataURL) socket.emit("canvas-state", { roomCode, dataURL });
  }, [roomCode]);

  // ── Core stroke renderer (works for drawer and receivers) ────────────────
  const applyStroke = useCallback((ctx, stroke) => {
    const { x0, y0, x1, y1, color, size, tool } = stroke;
    ctx.save();
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#ffffff"; // paint white for eraser
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }, []);

  // ── Initialise canvases + socket listeners ────────────────────────────────
  useEffect(() => {
    const main = mainRef.current;
    const preview = previewRef.current;
    mainCtx.current = main.getContext("2d", { willReadFrequently: true });
    previewCtx.current = preview.getContext("2d");

    fillBg(mainCtx.current);

    // Save initial snapshot
    undoStack.current = [mainCtx.current.getImageData(0, 0, W, H)];
    redoStack.current = [];

    // ── Socket listeners for non-drawers ──
    const onStroke = (stroke) => applyStroke(mainCtx.current, stroke);

    // Receive full canvas state (after fill / undo / redo)
    const onCanvasState = ({ dataURL }) => {
      const img = new Image();
      img.onload = () => {
        mainCtx.current.clearRect(0, 0, W, H);
        mainCtx.current.drawImage(img, 0, 0);
      };
      img.src = dataURL;
    };

    // Receive shape previews in real time
    const onPreview = (data) => {
      const pc = previewCtx.current;
      pc.clearRect(0, 0, W, H);
      if (!data) return; // clear-only call
      const { x0, y0, x1, y1, color, size, tool } = data;
      pc.strokeStyle = color;
      pc.lineWidth = size;
      pc.lineCap = pc.lineJoin = "round";
      if (tool === "line") {
        pc.beginPath();
        pc.moveTo(x0, y0);
        pc.lineTo(x1, y1);
        pc.stroke();
      } else if (tool === "rect") {
        pc.strokeRect(x0, y0, x1 - x0, y1 - y0);
      } else if (tool === "circle") {
        const rx = Math.abs(x1 - x0) / 2,
          ry = Math.abs(y1 - y0) / 2;
        const cx = Math.min(x0, x1) + rx,
          cy = Math.min(y0, y1) + ry;
        pc.beginPath();
        pc.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        pc.stroke();
      }
    };

    // Remote cursor
    const onCursor = ({ x, y, username }) => {
      setRemoteCursor({ x, y, username });
      if (cursorHideRef.current) clearTimeout(cursorHideRef.current);
      cursorHideRef.current = setTimeout(() => setRemoteCursor(null), 3000);
    };

    socket.on("draw-broadcast", onStroke);
    socket.on("canvas-state-broadcast", onCanvasState);
    socket.on("shape-preview", onPreview);
    socket.on("cursor-update", onCursor);

    return () => {
      socket.off("draw-broadcast", onStroke);
      socket.off("canvas-state-broadcast", onCanvasState);
      socket.off("shape-preview", onPreview);
      socket.off("cursor-update", onCursor);
      if (cursorHideRef.current) clearTimeout(cursorHideRef.current);
    };
  }, [applyStroke]);

  // ── Canvas cleared from GameContext ──────────────────────────────────────
  useEffect(() => {
    if (!gameState.canvasClearCount) return;
    fillBg(mainCtx.current);
    previewCtx.current?.clearRect(0, 0, W, H);
    undoStack.current = [mainCtx.current.getImageData(0, 0, W, H)];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [gameState.canvasClearCount]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (undoStack.current.length <= 1) return;
    redoStack.current.push(undoStack.current.pop());
    const snap = undoStack.current[undoStack.current.length - 1];
    mainCtx.current.putImageData(snap, 0, 0);
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(true);
    broadcastState();
  }, [broadcastState]);

  // ── Redo ─────────────────────────────────────────────────────────────────
  const handleRedo = useCallback(() => {
    if (!redoStack.current.length) return;
    const snap = redoStack.current.pop();
    undoStack.current.push(snap);
    mainCtx.current.putImageData(snap, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    broadcastState();
  }, [broadcastState]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDrawer) return;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          handleUndo();
        }
        if (e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawer, handleUndo, handleRedo]);

  // ── Get canvas-relative position ──────────────────────────────────────────
  const getPos = (e) => {
    const rect = mainRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  // ── Mouse / Touch handlers ────────────────────────────────────────────────
  useEffect(() => {
    if (!isDrawer) return;

    const preview = previewRef.current;
    const ctx = mainCtx.current;

    const onStart = (e) => {
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      isDrawing.current = true;
      startPos.current = pos;
      lastPos.current = pos;

      if (toolRef.current === "fill") {
        snapshot();
        floodFill(ctx, Math.round(pos.x), Math.round(pos.y), colorRef.current);
        broadcastState();
        isDrawing.current = false;
      }
    };

    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);

      // Always emit cursor
      socket.emit("cursor-move", { roomCode, x: pos.x / W, y: pos.y / H });

      if (!isDrawing.current) return;

      if (toolRef.current === "pen" || toolRef.current === "eraser") {
        const stroke = {
          x0: lastPos.current.x,
          y0: lastPos.current.y,
          x1: pos.x,
          y1: pos.y,
          color: colorRef.current,
          size: sizeRef.current,
          tool: toolRef.current,
        };
        applyStroke(ctx, stroke);
        socket.emit("draw", { roomCode, stroke });
        lastPos.current = pos;
      } else {
        // Shape preview — draw on local preview canvas AND broadcast preview
        const pc = previewCtx.current;
        pc.clearRect(0, 0, W, H);
        const x0 = startPos.current.x,
          y0 = startPos.current.y;
        const x1 = pos.x,
          y1 = pos.y;
        pc.strokeStyle = colorRef.current;
        pc.lineWidth = sizeRef.current;
        pc.lineCap = pc.lineJoin = "round";

        if (toolRef.current === "line") {
          pc.beginPath();
          pc.moveTo(x0, y0);
          pc.lineTo(x1, y1);
          pc.stroke();
        } else if (toolRef.current === "rect") {
          pc.strokeRect(x0, y0, x1 - x0, y1 - y0);
        } else if (toolRef.current === "circle") {
          const rx = Math.abs(x1 - x0) / 2,
            ry = Math.abs(y1 - y0) / 2;
          const cx = Math.min(x0, x1) + rx,
            cy = Math.min(y0, y1) + ry;
          pc.beginPath();
          pc.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          pc.stroke();
        }

        // Broadcast live preview to others
        socket.emit("shape-preview", {
          roomCode,
          preview: {
            x0,
            y0,
            x1,
            y1,
            color: colorRef.current,
            size: sizeRef.current,
            tool: toolRef.current,
          },
        });
      }
    };

    const onEnd = (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      if (toolRef.current === "pen" || toolRef.current === "eraser") {
        snapshot();
        return;
      }

      const pos = (() => {
        if (e.changedTouches) {
          const t = e.changedTouches[0];
          const r = mainRef.current.getBoundingClientRect();
          return {
            x: (t.clientX - r.left) * (W / r.width),
            y: (t.clientY - r.top) * (H / r.height),
          };
        }
        return getPos(e);
      })();

      const x0 = startPos.current.x,
        y0 = startPos.current.y;
      const x1 = pos.x,
        y1 = pos.y;

      // Clear preview
      previewCtx.current.clearRect(0, 0, W, H);
      // Tell others to clear their preview too
      socket.emit("shape-preview", { roomCode, preview: null });

      // Commit shape to main canvas and emit as strokes
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = sizeRef.current;
      ctx.lineCap = ctx.lineJoin = "round";

      const emit = (ax, ay, bx, by) => {
        const stroke = {
          x0: ax,
          y0: ay,
          x1: bx,
          y1: by,
          color: colorRef.current,
          size: sizeRef.current,
          tool: "pen",
        };
        applyStroke(ctx, stroke);
        socket.emit("draw", { roomCode, stroke });
      };

      if (toolRef.current === "line") {
        emit(x0, y0, x1, y1);
      } else if (toolRef.current === "rect") {
        emit(x0, y0, x1, y0);
        emit(x1, y0, x1, y1);
        emit(x1, y1, x0, y1);
        emit(x0, y1, x0, y0);
      } else if (toolRef.current === "circle") {
        const rx = Math.abs(x1 - x0) / 2,
          ry = Math.abs(y1 - y0) / 2;
        const cx = Math.min(x0, x1) + rx,
          cy = Math.min(y0, y1) + ry;
        const steps = 64;
        for (let i = 0; i < steps; i++) {
          const a0 = (i / steps) * Math.PI * 2,
            a1 = ((i + 1) / steps) * Math.PI * 2;
          emit(
            cx + Math.cos(a0) * rx,
            cy + Math.sin(a0) * ry,
            cx + Math.cos(a1) * rx,
            cy + Math.sin(a1) * ry,
          );
        }
      }

      snapshot();
    };

    const onLeave = () => {
      if (isDrawing.current) {
        onEnd({ type: "mouseleave", changedTouches: null });
      }
      // Emit null cursor to hide it on others' screens
      socket.emit("cursor-move", { roomCode, x: -1, y: -1 });
    };

    preview.addEventListener("mousedown", onStart);
    preview.addEventListener("mousemove", onMove);
    preview.addEventListener("mouseup", onEnd);
    preview.addEventListener("mouseleave", onLeave);
    preview.addEventListener("touchstart", onStart, { passive: false });
    preview.addEventListener("touchmove", onMove, { passive: false });
    preview.addEventListener("touchend", onEnd);
    preview.addEventListener("touchcancel", () => {
      isDrawing.current = false;
    });

    return () => {
      preview.removeEventListener("mousedown", onStart);
      preview.removeEventListener("mousemove", onMove);
      preview.removeEventListener("mouseup", onEnd);
      preview.removeEventListener("mouseleave", onLeave);
      preview.removeEventListener("touchstart", onStart);
      preview.removeEventListener("touchmove", onMove);
      preview.removeEventListener("touchend", onEnd);
    };
  }, [isDrawer, roomCode, snapshot, broadcastState, applyStroke]);

  const handleClear = () => socket.emit("clear-canvas", { roomCode });

  // ── Convert normalised cursor coords to CSS % ─────────────────────────────
  const cursorStyle =
    remoteCursor && remoteCursor.x >= 0
      ? { left: `${remoteCursor.x * 100}%`, top: `${remoteCursor.y * 100}%` }
      : null;

  return (
    <div className={styles.wrapper}>
      {/* ── Left toolbar (drawer only) ─────────────────────────────────── */}
      {isDrawer && (
        <div className={styles.toolbar}>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Tools</span>
            <div className={styles.toolGrid}>
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.toolBtn} ${activeTool === t.id ? styles.toolBtnActive : ""}`}
                  onClick={() => setTool(t.id)}
                  title={t.title}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Size</span>
            <div className={styles.sizePresets}>
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`${styles.sizeBtn} ${activeSize === p.value ? styles.sizeBtnActive : ""}`}
                  onClick={() => setSize(p.value)}
                  title={`${p.value}px`}
                >
                  <span
                    className={styles.sizeDot}
                    style={{
                      width: Math.max(3, Math.min(p.value, 18)),
                      height: Math.max(3, Math.min(p.value, 18)),
                    }}
                  />
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={activeSize}
              className={styles.sizeSlider}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span className={styles.sizeValue}>{activeSize}px</span>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Colour</span>
            <div className={styles.palette}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`${styles.colorBtn} ${activeColor === c ? styles.colorBtnActive : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
            <div className={styles.colorBottom}>
              <div
                className={styles.currentColor}
                style={{ background: activeColor }}
              />
              <label className={styles.pickerWrap} title="Custom colour">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setColor(e.target.value)}
                  className={styles.colorPicker}
                />
                <span className={styles.pickerLabel}>Custom</span>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Actions</span>
            <div className={styles.actionRow}>
              <button
                className={`${styles.actionBtn} ${!canUndo ? styles.disabled : ""}`}
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                ↩ Undo
              </button>
              <button
                className={`${styles.actionBtn} ${!canRedo ? styles.disabled : ""}`}
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                ↪ Redo
              </button>
            </div>
            <button className={styles.clearBtn} onClick={handleClear}>
              🗑 Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Canvas area ────────────────────────────────────────────────── */}
      <div
        className={`${styles.canvasWrap} ${isDrawer ? styles.canvasWrapDrawer : ""}`}
      >
        {/* Layer 1 — permanent drawings */}
        <canvas
          ref={mainRef}
          width={W}
          height={H}
          className={styles.canvasMain}
        />

        {/* Layer 2 — shape previews (visible to everyone) */}
        <canvas
          ref={previewRef}
          width={W}
          height={H}
          className={styles.canvasPreview}
          style={{
            pointerEvents: isDrawer ? "auto" : "none",
            touchAction: isDrawer ? "none" : "auto",
            cursor: isDrawer ? getCursorStyle(activeTool) : "default",
          }}
        />

        {/* Layer 3 — remote cursor dot (non-drawers see this) */}
        {!isDrawer && cursorStyle && (
          <div className={styles.remoteCursor} style={cursorStyle}>
            <div className={styles.cursorDot} />
            {remoteCursor.username && (
              <span className={styles.cursorLabel}>
                {remoteCursor.username}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
