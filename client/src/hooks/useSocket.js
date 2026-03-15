// client/src/hooks/useSocket.js
import { useEffect, useContext } from "react";
import socket from "../socket/socket";
import { GameContext } from "../context/GameContext";

let msgCounter = 0;
const nextId = () => ++msgCounter;

const useSocket = (roomCode, user) => {
  const { dispatch } = useContext(GameContext);

  useEffect(() => {
    if (!roomCode || !user) return;

    socket.connect();
    socket.emit("join-room", {
      roomCode,
      user: { id: user._id, username: user.username },
    });

    socket.on("player-joined", ({ players, message }) => {
      dispatch({ type: "UPDATE_PLAYERS", payload: players });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, type: "system", id: nextId() },
      });
    });

    // FIX: server now sends updated players array on disconnect
    // so the waiting room player list updates immediately
    socket.on("player-left", ({ username, players }) => {
      if (players) {
        dispatch({ type: "UPDATE_PLAYERS", payload: players });
      }
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `${username} left the room`,
          type: "system",
          id: nextId(),
        },
      });
    });

    // FIX: handle host transfer when original host leaves waiting room
    socket.on("host-changed", ({ newHostId, newHostUsername, players }) => {
      dispatch({ type: "UPDATE_PLAYERS", payload: players });
      dispatch({ type: "HOST_CHANGED", payload: { newHostId } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `${newHostUsername} is now the host`,
          type: "system",
          id: nextId(),
        },
      });
    });

    socket.on("game-started", ({ players, rounds }) => {
      dispatch({ type: "GAME_STARTED", payload: { players, rounds } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: "Game is starting!", type: "system", id: nextId() },
      });
    });

    socket.on("new-turn", (data) => {
      dispatch({ type: "NEW_TURN", payload: data });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `Round ${data.round}/${data.maxRounds} — ${data.drawer.username} is drawing!`,
          type: "system",
          id: nextId(),
        },
      });
    });

    socket.on("your-word", ({ word }) => {
      dispatch({ type: "YOUR_WORD", payload: { word } });
    });

    socket.on("timer-tick", ({ timeLeft }) => {
      dispatch({ type: "TIMER_TICK", payload: { timeLeft } });
    });

    socket.on("hint-update", ({ wordHint }) => {
      dispatch({ type: "HINT_UPDATE", payload: { wordHint } });
    });

    socket.on(
      "correct-guess",
      ({ username, points, scores, guessedCount, totalGuessers }) => {
        dispatch({
          type: "CORRECT_GUESS",
          payload: { scores, guessedCount, totalGuessers },
        });
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            text: `${username} guessed correctly! +${points} pts`,
            type: "correct",
            id: nextId(),
          },
        });
      },
    );

    socket.on("chat-message", ({ username, message }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: message,
          sender: username,
          type: "guess",
          id: nextId(),
        },
      });
    });

    // Private hint — only visible to the guesser
    socket.on("close-guess", ({ message }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, type: "close", id: nextId() },
      });
    });

    socket.on("turn-ended", ({ word, scores }) => {
      dispatch({ type: "TURN_ENDED", payload: { word, scores } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `The word was: ${word}`,
          type: "reveal",
          id: nextId(),
        },
      });
    });

    socket.on("canvas-cleared", () => {
      dispatch({ type: "CANVAS_CLEARED" });
    });

    socket.on("game-over", (data) => {
      dispatch({ type: "GAME_OVER", payload: data });
    });

    socket.on("game-state-sync", (data) => {
      dispatch({
        type: "NEW_TURN",
        payload: {
          drawer: data.currentDrawer,
          wordHint: data.wordHint,
          timeLeft: data.timeLeft,
          round: data.round,
          maxRounds: data.maxRounds,
          guessedCount: data.guessedCount ?? 0,
          totalGuessers: data.totalGuessers ?? 0,
        },
      });
      dispatch({ type: "UPDATE_SCORES", payload: data.scores });
    });

    socket.on("error", ({ message }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: `Error: ${message}`, type: "system", id: nextId() },
      });
    });

    return () => {
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("host-changed");
      socket.off("game-started");
      socket.off("new-turn");
      socket.off("your-word");
      socket.off("timer-tick");
      socket.off("hint-update");
      socket.off("correct-guess");
      socket.off("chat-message");
      socket.off("close-guess");
      socket.off("turn-ended");
      socket.off("canvas-cleared");
      socket.off("game-over");
      socket.off("game-state-sync");
      socket.off("error");
      socket.disconnect();
    };
  }, [roomCode, user]);

  return socket;
};

export default useSocket;
