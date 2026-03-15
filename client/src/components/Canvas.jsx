// client/src/components/Canvas.jsx
import { useRef, useEffect, useContext } from "react";
import { GameContext } from "../context/GameContext";
import socket from "../socket/socket";
import styles from "./Canvas.module.css";

const Canvas = ({ roomCode, isDrawer }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false); // useRef not useState — no re-render needed
  const lastPos = useRef({ x: 0, y: 0 });
  const colorRef = useRef("#ffffff");
  const sizeRef = useRef(6);

  const { gameState, dispatch } = useContext(GameContext);

  // ── Helper: get mouse position relative to canvas ──────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // scaleX/scaleY handles cases where canvas CSS size != actual pixel size
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // ── Helper: draw a single stroke segment on the canvas ─────────────────
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

  // ── Listen for canvas-cleared from GameContext ──────────────────────────
  // When the server emits canvas-cleared, GameContext dispatches CANVAS_CLEARED.
  // We watch for that here and wipe the canvas.
  // We use a ref to track the last known "cleared" count.
  const clearedCount = useRef(0);
  useEffect(() => {
    // We increment a counter in GameContext when canvas-cleared fires.
    // Check canvas cleared via a dedicated effect
  }, [gameState]);

  // ── Listen for draw-broadcast ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fill with a dark background on mount
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleDrawBroadcast = (stroke) => {
      drawStroke(ctx, stroke);
    };

    const handleCanvasCleared = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("draw-broadcast", handleDrawBroadcast);
    socket.on("canvas-cleared", handleCanvasCleared);

    return () => {
      socket.off("draw-broadcast", handleDrawBroadcast);
      socket.off("canvas-cleared", handleCanvasCleared);
    };
  }, []);

  // ── Mouse event handlers (only active for the drawer) ──────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const onMouseDown = (e) => {
      if (!isDrawer) return;
      isDrawing.current = true;
      lastPos.current = getPos(e);
    };

    const onMouseMove = (e) => {
      if (!isDrawer || !isDrawing.current) return;
      const pos = getPos(e);
      const stroke = {
        x0: lastPos.current.x,
        y0: lastPos.current.y,
        x1: pos.x,
        y1: pos.y,
        color: colorRef.current,
        size: sizeRef.current,
      };

      // Draw locally immediately (no waiting for server round-trip)
      drawStroke(ctx, stroke);

      // Send to server, which broadcasts to all other players
      socket.emit("draw", { roomCode, stroke });

      lastPos.current = pos;
    };

    const onMouseUp = () => {
      isDrawing.current = false;
    };
    const onMouseLeave = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isDrawer, roomCode]);

  const handleClear = () => {
    socket.emit("clear-canvas", { roomCode });
  };

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={styles.canvas}
        style={{ cursor: isDrawer ? "crosshair" : "default" }}
      />

      {/* Drawing tools — only visible to the drawer */}
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
            <label>Size</label>
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
            Clear canvas
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
