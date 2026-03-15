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
  wordChoices: null,
  choiceTimeLeft: 15,
  timeLeft: 0,
  round: 0,
  maxRounds: 3,
  scores: [],
  messages: [],
  turnWord: null,
  guessedCount: 0,
  totalGuessers: 0,
  reactions: [],
  isSpectator: false,
  canvasClearCount: 0,
};

const gameReducer = (state, action) => {
  switch (action.type) {
    // FIX: SET_ROOM only stores room metadata (host, settings, code).
    // It must NEVER overwrite players or status because those arrive via
    // socket events (player-joined, game-started) which are more up-to-date
    // than the HTTP response. The race condition was:
    //   1. socket player-joined fires → players: [A, B]   ✓
    //   2. HTTP getOne resolves  → SET_ROOM overwrites players: [A]  ✗
    // Now SET_ROOM only touches room metadata, never players/status.
    // Players start empty and get populated exclusively by socket events.
    case "SET_ROOM":
      return {
        ...state,
        room: action.payload,
        // Only set players/status from HTTP if we have NO socket data yet
        // (i.e. players array is still empty). If socket already gave us
        // players, don't overwrite them.
        players:
          state.players.length > 0
            ? state.players
            : action.payload.players || [],
        status:
          state.status !== "waiting"
            ? state.status
            : action.payload.status || "waiting",
      };

    case "UPDATE_PLAYERS":
      return { ...state, players: action.payload };

    case "UPDATE_HOST":
      return {
        ...state,
        room: state.room
          ? { ...state.room, host: action.payload.host }
          : { host: action.payload.host },
      };

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
        room:
          state.room && action.payload.host
            ? { ...state.room, host: action.payload.host }
            : state.room,
      };

    case "CHOOSING_WORD":
      return {
        ...state,
        status: "choosing",
        currentDrawer: action.payload.drawer,
        round: action.payload.round,
        maxRounds: action.payload.maxRounds,
        choiceTimeLeft: action.payload.choiceTime,
        wordChoices: null,
        yourWord: null,
        turnWord: null,
      };

    case "WORD_CHOICES":
      return {
        ...state,
        wordChoices: action.payload.choices,
        choiceTimeLeft: action.payload.choiceTime,
      };

    case "CHOICE_TICK":
      return {
        ...state,
        choiceTimeLeft: Math.max(0, state.choiceTimeLeft - 1),
      };

    case "NEW_TURN":
      return {
        ...state,
        status: "playing",
        currentDrawer: action.payload.drawer,
        wordHint: action.payload.wordHint,
        timeLeft: action.payload.timeLeft,
        round: action.payload.round,
        maxRounds: action.payload.maxRounds,
        yourWord: null,
        turnWord: null,
        wordChoices: null,
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
      return { ...state, canvasClearCount: (state.canvasClearCount || 0) + 1 };

    case "SET_SPECTATOR":
      return { ...state, isSpectator: true };

    case "ADD_REACTION":
      return {
        ...state,
        reactions: [...state.reactions, action.payload].slice(-10),
      };

    case "REMOVE_REACTION":
      return {
        ...state,
        reactions: state.reactions.filter((r) => r.id !== action.payload),
      };

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
