// client/src/components/Chat.jsx
import { useState, useContext, useRef, useEffect } from "react";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import socket from "../socket/socket";
import styles from "./Chat.module.css";

const Chat = ({ roomCode, isDrawer, isSpectator }) => {
  const { gameState } = useContext(GameContext);
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const feedRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUp = useRef(false);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 60;
  };

  // Auto-scroll to bottom unless user manually scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isDrawer || isSpectator) return;
    socket.emit("send-guess", {
      roomCode,
      guess: input.trim(),
      userId: user._id,
    });
    setInput("");
    userScrolledUp.current = false;
  };

  const getClass = (type, closeLevel) => {
    if (type === "correct") return styles.msgCorrect;
    if (type === "reveal") return styles.msgReveal;
    if (type === "system") return styles.msgSystem;
    if (type === "close") {
      if (closeLevel === 1) return styles.msgExtremelyClose;
      if (closeLevel === 2) return styles.msgVeryClose;
      return styles.msgClose;
    }
    return styles.msgGuess;
  };

  const inputDisabled = isDrawer || isSpectator;

  return (
    <div className={styles.wrapper}>
      {/* Scrollable message feed — fixed height via CSS */}
      <div className={styles.feed} ref={feedRef} onScroll={handleScroll}>
        {gameState.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.msg} ${getClass(msg.type, msg.closeLevel)} ${msg.type === "correct" ? styles.flash : ""}`}
          >
            {msg.sender && (
              <span className={styles.sender}>{msg.sender}: </span>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isSpectator
              ? "Spectators cannot guess"
              : isDrawer
                ? "You are drawing..."
                : gameState.status === "playing"
                  ? "Type your guess..."
                  : "Chat..."
          }
          className={styles.input}
          autoComplete="off"
          disabled={inputDisabled}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={inputDisabled}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
