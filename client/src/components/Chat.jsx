// client/src/components/Chat.jsx
import { useState, useContext, useRef, useEffect } from "react";
import { GameContext } from "../context/GameContext";
import useAuth from "../hooks/useAuth";
import socket from "../socket/socket";
import styles from "./Chat.module.css";

const Chat = ({ roomCode, isDrawer }) => {
  const { gameState } = useContext(GameContext);
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const feedRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolled = useRef(false);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    userScrolled.current = scrollHeight - scrollTop - clientHeight > 60;
  };

  useEffect(() => {
    if (!userScrolled.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isDrawer) return;
    socket.emit("send-guess", {
      roomCode,
      guess: input.trim(),
      userId: user._id,
    });
    setInput("");
    userScrolled.current = false;
  };

  const getMessageClass = (type) => {
    if (type === "correct") return styles.msgCorrect;
    if (type === "reveal") return styles.msgReveal;
    if (type === "system") return styles.msgSystem;
    if (type === "close") return styles.msgClose;
    return styles.msgGuess;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.feed} ref={feedRef} onScroll={handleScroll}>
        {gameState.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.msg} ${getMessageClass(msg.type)} ${msg.type === "correct" ? styles.flash : ""}`}
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
            isDrawer
              ? "You are drawing — no guessing!"
              : gameState.status === "playing"
                ? "Type your guess..."
                : "Chat..."
          }
          className={styles.input}
          autoComplete="off"
          disabled={isDrawer}
        />
        <button type="submit" className={styles.sendBtn} disabled={isDrawer}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
