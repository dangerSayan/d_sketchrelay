// client/src/context/GameContext.jsx
import { createContext, useReducer } from "react";

export const GameContext = createContext(null);

const initialState = {
  room: null,
  players: [],
  status: "waiting",
  currentDrawer: null,
  wordHint: "",
  yourWord: null,
  timeLeft: 0,
  round: 0,
  maxRounds: 3,
  scores: [],
  messages: [],
  turnWord: null,
  guessedCount: 0,
  totalGuessers: 0,
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case "SET_ROOM":
      return {
        ...state,
        room: action.payload,
        players: action.payload.players,
        status: action.payload.status,
      };

    case "UPDATE_PLAYERS":
      return { ...state, players: action.payload };

    // FIX: when host changes, update the room.host field so isHost re-evaluates
    case "HOST_CHANGED":
      return {
        ...state,
        room: state.room
          ? { ...state.room, host: action.payload.newHostId }
          : state.room,
      };

    case "GAME_STARTED":
      return {
        ...state,
        status: "playing",
        players: action.payload.players,
        maxRounds: action.payload.rounds,
      };

    case "NEW_TURN":
      return {
        ...state,
        currentDrawer: action.payload.drawer,
        wordHint: action.payload.wordHint,
        timeLeft: action.payload.timeLeft,
        round: action.payload.round,
        maxRounds: action.payload.maxRounds,
        yourWord: null,
        turnWord: null,
        guessedCount: action.payload.guessedCount ?? 0,
        totalGuessers: action.payload.totalGuessers ?? 0,
      };

    case "YOUR_WORD":
      return { ...state, yourWord: action.payload.word };

    case "TIMER_TICK":
      return { ...state, timeLeft: action.payload.timeLeft };

    case "HINT_UPDATE":
      return { ...state, wordHint: action.payload.wordHint };

    case "UPDATE_SCORES":
      return { ...state, scores: action.payload };

    case "CORRECT_GUESS":
      return {
        ...state,
        scores: action.payload.scores,
        guessedCount: action.payload.guessedCount,
        totalGuessers: action.payload.totalGuessers,
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload].slice(-100),
      };

    case "TURN_ENDED":
      return {
        ...state,
        turnWord: action.payload.word,
        scores: action.payload.scores,
      };

    case "GAME_OVER":
      return {
        ...state,
        status: "finished",
        scores: action.payload.finalScores || [],
      };

    case "CANVAS_CLEARED":
      return state;

    case "RESET":
      return initialState;

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ gameState, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};
