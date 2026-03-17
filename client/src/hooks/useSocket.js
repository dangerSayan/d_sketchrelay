// client/src/hooks/useSocket.js
import { useEffect, useContext, useRef } from "react";
import socket from "../socket/socket";
import { GameContext } from "../context/GameContext";
import { sounds } from "../utils/sounds";

let msgCounter = 0;
const nextId = () => ++msgCounter;

const useSocket = (roomCode, user) => {
  const { dispatch } = useContext(GameContext);
  const choiceTimerRef = useRef(null);

  // THE ROOT CAUSE FIX:
  // useEffect with [roomCode, user] re-fires whenever `user` changes reference.
  // AuthContext calls setUser() after getMe() resolves, which creates a new
  // object even if the data is identical — triggering disconnect + reconnect,
  // causing the host to miss the player-joined broadcast.
  //
  // Solution: depend only on stable primitives (roomCode, user._id string).
  // Store user data in a ref so the effect body can read latest values
  // without the effect re-running when the user object re-renders.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Use stable primitives as dependencies — these never change for a given session
  const userId = (user?._id || user?.id)?.toString();
  const username = user?.username;

  useEffect(() => {
    if (!roomCode || !userId) return;

    const doJoin = () => {
      socket.emit("join-room", {
        roomCode,
        user: { id: userId, username },
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.connect();
      socket.once("connect", doJoin);
    }

    socket.on("player-joined", ({ players, host, message }) => {
      dispatch({ type: "UPDATE_PLAYERS", payload: players });
      if (host) dispatch({ type: "UPDATE_HOST", payload: { host } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, type: "system", id: nextId() },
      });
      sounds.playerJoin();
    });

    socket.on("spectator-joined", ({ players, host, message }) => {
      dispatch({ type: "UPDATE_PLAYERS", payload: players });
      if (host) dispatch({ type: "UPDATE_HOST", payload: { host } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, type: "system", id: nextId() },
      });
    });

    socket.on("player-left", ({ username: leftUser, players, host }) => {
      if (players) dispatch({ type: "UPDATE_PLAYERS", payload: players });
      if (host) dispatch({ type: "UPDATE_HOST", payload: { host } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `${leftUser} left the room`,
          type: "system",
          id: nextId(),
        },
      });
      sounds.playerLeave();
    });

    socket.on(
      "host-changed",
      ({ newHostId, newHostUsername, players, host }) => {
        dispatch({ type: "UPDATE_PLAYERS", payload: players });
        dispatch({ type: "HOST_CHANGED", payload: { newHostId } });
        if (host) dispatch({ type: "UPDATE_HOST", payload: { host } });
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            text: `${newHostUsername} is now the host`,
            type: "system",
            id: nextId(),
          },
        });
      },
    );

    socket.on("game-started", ({ players, rounds, host }) => {
      dispatch({ type: "GAME_STARTED", payload: { players, rounds, host } });
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: "Game is starting!", type: "system", id: nextId() },
      });
    });

    socket.on("choosing-word", (data) => {
      dispatch({ type: "CHOOSING_WORD", payload: data });
      if (choiceTimerRef.current) clearInterval(choiceTimerRef.current);
      choiceTimerRef.current = setInterval(() => {
        dispatch({ type: "CHOICE_TICK" });
      }, 1000);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `${data.drawer.username} is choosing a word...`,
          type: "system",
          id: nextId(),
        },
      });
    });

    socket.on("word-choices", ({ choices, choiceTime }) => {
      dispatch({ type: "WORD_CHOICES", payload: { choices, choiceTime } });
    });

    socket.on("new-turn", (data) => {
      if (choiceTimerRef.current) {
        clearInterval(choiceTimerRef.current);
        choiceTimerRef.current = null;
      }
      dispatch({ type: "NEW_TURN", payload: data });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: `Round ${data.round}/${data.maxRounds} — ${data.drawer.username} is drawing!`,
          type: "system",
          id: nextId(),
        },
      });
      sounds.newRound();
    });

    socket.on("your-word", ({ word }) => {
      dispatch({ type: "YOUR_WORD", payload: { word } });
      sounds.wordChosen();
    });

    socket.on("timer-tick", ({ timeLeft }) => {
      dispatch({ type: "TIMER_TICK", payload: { timeLeft } });
      if (timeLeft <= 10 && timeLeft > 0) sounds.tick(timeLeft <= 5);
    });

    socket.on("hint-update", ({ wordHint }) => {
      dispatch({ type: "HINT_UPDATE", payload: { wordHint } });
    });

    socket.on(
      "correct-guess",
      ({ username: gUser, points, scores, guessedCount, totalGuessers }) => {
        dispatch({
          type: "CORRECT_GUESS",
          payload: { scores, guessedCount, totalGuessers },
        });
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            text: `${gUser} guessed correctly! +${points} pts`,
            type: "correct",
            id: nextId(),
          },
        });
        sounds.correctGuess();
      },
    );

    socket.on("chat-message", ({ username: sender, message }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: message, sender, type: "guess", id: nextId() },
      });
    });

    socket.on("close-guess", ({ message, level }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          text: message,
          type: "close",
          closeLevel: level,
          id: nextId(),
        },
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
      if (choiceTimerRef.current) {
        clearInterval(choiceTimerRef.current);
        choiceTimerRef.current = null;
      }
      if (data.isSpectator) dispatch({ type: "SET_SPECTATOR" });
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

    socket.on("reaction", ({ username: reactUser, emoji }) => {
      const id = nextId();
      dispatch({
        type: "ADD_REACTION",
        payload: { id, username: reactUser, emoji },
      });
      setTimeout(
        () => dispatch({ type: "REMOVE_REACTION", payload: id }),
        2500,
      );
    });

    socket.on("error", ({ message }) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { text: `Error: ${message}`, type: "system", id: nextId() },
      });
    });

    return () => {
      if (choiceTimerRef.current) clearInterval(choiceTimerRef.current);
      socket.off("connect", doJoin);
      socket.off("player-joined");
      socket.off("spectator-joined");
      socket.off("player-left");
      socket.off("host-changed");
      socket.off("game-started");
      socket.off("choosing-word");
      socket.off("word-choices");
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
      socket.off("reaction");
      socket.off("error");
      socket.disconnect();
    };

    // CRITICAL: depend on stable primitives, NOT the user object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, userId, username]);

  return socket;
};

export default useSocket;
