import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import styles from "./Timer.module.css";

const Timer = () => {
  const { gameState } = useContext(GameContext);
  const { timeLeft } = gameState;
  const isLow = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className={`${styles.timer} ${isLow ? styles.low : ""}`}>
      {timeLeft}
    </div>
  );
};

export default Timer;
