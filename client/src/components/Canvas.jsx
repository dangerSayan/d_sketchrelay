// client/src/components/Canvas.jsx
import { useRef, useEffect, useContext } from "react";
import { GameContext } from "../context/GameContext";
import socket from "../socket/socket";
import styles from "./Canvas.module.css";

const Canvas = ({ roomCode, isDrawer }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const colorRef = useRef("#ffffff");
  const sizeRef = useRef(6);
  const ctxRef = useRef(null); // stable ref to the canvas context

  const { gameState } = useContext(GameContext);

  // ── One-time setup: get context, fill background, wire socket listeners ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleDraw = (stroke) => drawStroke(ctx, stroke);

    socket.on("draw-broadcast", handleDraw);

    return () => {
      socket.off("draw-broadcast", handleDraw);
    };
  }, []);

  // ── BUG FIX #4: watch canvasClearCount from GameContext ──────────────────
  // Previously Canvas cleared itself by listening to 'canvas-cleared' directly
  // on the socket inside a useEffect. But that useEffect also depended on
  // `isDrawer` which caused the listener to re-register, sometimes missing
  // the clear event or firing twice.
  //
  // Now the canonical flow is:
  //   socket event → useSocket dispatch CANVAS_CLEARED
  //   → GameContext increments canvasClearCount
  //   → this useEffect detects the change and wipes the canvas
  //
  // This is reliable regardless of isDrawer changes or effect re-runs.
  useEffect(() => {
    if (!gameState.canvasClearCount) return; // 0 or undefined = initial state
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [gameState.canvasClearCount]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const source = e.touches ? e.touches[0] : e;
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = (ctx, { x0, y0, x1, y1, color, size }) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  // ── Mouse + Touch event listeners ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    const startDrawing = (e) => {
      if (!isDrawer) return;
      if (e.cancelable) e.preventDefault();
      isDrawing.current = true;
      lastPos.current = getPos(e);
    };

    const draw = (e) => {
      if (!isDrawer || !isDrawing.current) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      const stroke = {
        x0: lastPos.current.x,
        y0: lastPos.current.y,
        x1: pos.x,
        y1: pos.y,
        color: colorRef.current,
        size: sizeRef.current,
      };
      drawStroke(ctx, stroke);
      socket.emit("draw", { roomCode, stroke });
      lastPos.current = pos;
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
      canvas.removeEventListener("touchcancel", stopDrawing);
    };
  }, [isDrawer, roomCode]);

  const handleClear = () => socket.emit("clear-canvas", { roomCode });

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={styles.canvas}
        style={{
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: isDrawer ? "none" : "auto",
        }}
      />
      {isDrawer && (
        <div className={styles.tools}>
          <div className={styles.colors}>
            {[
              "#ffffff",
              "#ef4444",
              "#f97316",
              "#eab308",
              "#22c55e",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
              "#000000",
              "#6b7280",
              "#a16207",
              "#0e7490",
              "#be185d",
              "#15803d",
            ].map((c) => (
              <button
                key={c}
                className={styles.colorBtn}
                style={{ background: c }}
                onClick={() => {
                  colorRef.current = c;
                }}
                title={c}
              />
            ))}
          </div>
          <div className={styles.sizeRow}>
            <span className={styles.sizeLabel}>Size</span>
            <input
              type="range"
              min="2"
              max="40"
              defaultValue="6"
              onChange={(e) => {
                sizeRef.current = Number(e.target.value);
              }}
            />
          </div>
          <button onClick={handleClear} className={styles.clearBtn}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
