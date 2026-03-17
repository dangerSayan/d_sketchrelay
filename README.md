# d_SketchRelay

A real-time multiplayer drawing and guessing game inspired by Skribbl, built with the MERN stack and Socket.io. Players join rooms, take turns drawing a secret word, and compete on speed and accuracy. This README is a full developer reference: architecture, game flow, APIs, sockets, deployment, and customization.

Live Demo: https://d-sketchrelay.vercel.app

---

## Table of Contents

- [What the App Does](#what-the-app-does)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Game Flow](#game-flow)
- [Socket Events](#socket-events)
- [Word Bank + Hint Logic](#word-bank--hint-logic)
- [Security](#security)
- [Local Setup](#local-setup)
- [Run Locally](#run-locally)
- [Deployment](#deployment)
- [Known Bugs & Limitations](#known-bugs--limitations)
- [Changelog (recent)](#changelog-recent)

---

## What the App Does

`d_SketchRelay` is a competitive multiplayer drawing game with:

1. Room creation/joining (public/private with code)
2. Host controls (rounds, draw time, player limits, category, custom words)
3. Real-time drawing broadcast via Socket.io
4. Live text guessing with hint reveal logic
5. Scoreboard and final ranking; stored in user profile
6. Responsive UI for desktop/mobile

Players take turns drawing for defined `drawTime`, others guess via chat. Points depend on guess time and drawer gets bonus points for successful guessers. The game runs for `rounds` and terminates with winner summary + confetti.

---

## Features

### Core Gameplay

- Multi-room, multi-player with host role and spectator mode
- Custom word categories (Animals, Food, Objects, Actions, Places, Movies, Characters)
- Drawer picks 1 of 3 word options, 15s auto-pick fallback
- Round-based gameplay, custom round and player limits
- In-game guessing and feedback + adaptive hint reveals

### Drawing & Interaction

- HTML5 Canvas painting with mouse + touch support
- Brush sizes + palette colors + eraser + clear
- Replayable strokes via server sync
- Sound effects via Web Audio API (no files)
- Reaction emojis with animation

### UI/UX

- Animated landing page + onboarding steps
- Lobby room list and filters + live updates
- Player list with status, host badge, spectator label
- Sticky top bar with status and guessed count
- Confetti + winner animation
- Mobile-first responsiveness

### Performance

- `willReadFrequently` context for canvas snapshots (undo/redo)
- CSS optimizations and dynamic min-heights
- Debounced network operations and room updates

### Security & Data

- JWT auth with 7-day expiry
- Bcrypt password storage
- Validation in HTTP + sockets
- MongoDB persistence for profiles and scores

---

## Tech Stack

### Server

- Node.js (v18+)
- Express
- Socket.io
- MongoDB + Mongoose
- bcryptjs, jsonwebtoken, dotenv, cors

### Client

- React 18 + Vite
- React Router Dom
- Socket.io-client
- Axios
- CSS Modules

---

## Project Structure

```
server/
  index.js
  config/db.js
  controllers/
    authController.js
    roomController.js
  middleware/authMiddleware.js
  models/User.js
  models/Room.js
  routes/authRoutes.js
  routes/roomRoutes.js
  socket/gameManager.js
  socket/socketHandler.js
  utils/words.js
  test-socket.js

client/
  src/
    App.jsx
    main.jsx
    api/index.js
    socket/socket.js
    context/AuthContext.jsx
    context/GameContext.jsx
    hooks/useAuth.js
    hooks/useSocket.js
    pages/Landing.jsx
    pages/Lobby.jsx
    pages/GameRoom.jsx
    pages/Login.jsx
    pages/Register.jsx
    components/Canvas.jsx
    components/Chat.jsx
    components/PlayerList.jsx
    components/Scoreboard.jsx
    components/Timer.jsx
    components/WordChoiceScreen.jsx
    components/Confetti.jsx
    components/MutetButton.jsx
    components/Avatar.jsx
    components/Reactions.jsx
    styles/*.module.css
```

---

## Architecture

### 1. Authentication

- Frontend stores JWT in `localStorage`
- Axios requests include `Authorization: Bearer <token>`
- `protect` middleware on server verifies token
- `AuthContext` manages current user state and refresh on load

### 2. HTTP vs WebSocket flow

- HTTP (`/api/auth`, `/api/rooms`) for initial room fetch, create/join, user data.
- Socket.io for live events: draw strokes, guesses, timing, scores, chat.

### 3. Game state & synchronization

- `gameManager` keeps room state in memory. Fields:
  - status (`waiting`, `choosing`, `playing`, `finished`)
  - current draw word, word hint indices, round, score
  - timer, guessed list, player list.
- Socket events are authoritative each step (`start-game`, `pick-word`, `draw`, etc.)
- If reconnecting, each client receives `game-state-sync` for full state.

---

## Game Flow

### Waiting Room

1. Host creates/join room.
2. Players join via code.
3. Player list updates in real-time.
4. Host starts game when `activePlayers >= 2`.

### Word choice phase

- Server picks 3 choices from category.
- Drawer receives `word-choices`; others see `choosing-word` overlay.
- 15s countdown; auto-select once it hits 0.

### Drawing phase

- `new-turn` broadcast:
  - selected word hint (blanks)
  - drawer name
  - timer, round info
- Drawer draws with `brush`/`eraser`; app emits `draw` events.
- Server re-broadcasts as `draw-broadcast` to others.

### Guessing + hints

- Guess submitted via `send-guess`.
- Correct answers: `correct-guess` with points.
- Close guesses (edit distance 1-3) get in-game private feedback.
- Timed reveals at 65% and 85% draw time.
- Wrong but partially correct positions queue 1 extra reveal.
- Max 3 reveals per turn.

### Turn + game end

- Turn ends on timer 0 or all guessers guessed.
- Next turn OR `game-over` when rounds complete.
- `game-over` shows final leaderboard, confetti, crown.
- Server persists scores to MongoDB.

---

## Socket Events

### Client → Server

- `join-room` `{ roomCode, user }`
- `join-as-spectator` `{ roomCode, user }`
- `start-game` `{ roomCode }`
- `pick-word` `{ roomCode, word }`
- `draw` `{ roomCode, stroke }`
- `clear-canvas` `{ roomCode }`
- `send-guess` `{ roomCode, guess, userId }`
- `react` `{ roomCode, emoji }`

### Server → Client

- `player-joined`, `player-left`, `host-changed`
- `game-started`, `choosing-word`, `word-choices`, `new-turn`, `your-word`
- `draw-broadcast`, `canvas-cleared`
- `hint-update`, `timer-tick`
- `correct-guess`, `close-guess`, `turn-ended`, `game-over`
- `game-state-sync`, `reaction`, `error`

---

## Word Bank + Hint Logic

File: `server/utils/words.js`

- `WORD_CATEGORIES` with categories and word lists.
- added easy, drawable terms + variety enough for long sessions.
- `WORDS` flat list for `all` category.
- `getRandomWord(category, customWords)` with override.
- `getThreeChoices(category, customWords)` random unique set.
- `getWordHint(word, revealedIndices)` returns underscore hint with 3-space spacing on word breaks.
- `checkGuess(guess, word)` safe equal.
- `editDistance(a,b)` Levenshtein distance for "close guess" hint.
- `getNextRevealIndex(word, revealedIndices)` incremental reveal.

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT in Authorization header, 7d expiration
- All protected routes and socket events are validated
- Input validations on register, login, room creation, invites

---

## Local Setup

1. `git clone https://github.com/yourname/d_SketchRelay.git`
2. `cd d_SketchRelay`
3. Setup `.env` in `server/`:
   - `PORT=5000`
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
4. `cd server && npm install`
5. `cd ../client && npm install`

---

## Run Locally

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open http://localhost:5173

---

## Deployment

### Backend (Render)

- Create Web Service → root `server`.
- Build: `npm install`, Start: `node index.js`.
- Env vars: `MONGO_URI`, `JWT_SECRET`, `PORT`.

### Frontend (Vercel)

- Create project -> root `client`.
- Env var: `VITE_API_URL=https://your-render-url`.
- Use `vercel.json` rewrite to `/index.html`.

### CORS on server

- include `http://localhost:5173`, `https://your-vercel-url`.

---

## Known Bugs & Limitations

- In-memory game state lost if server restarts in active room.
- Render free-tier cold-start delay (15 min inactivity)
- No persistent guessing chat across sessions (in-game only)
- `overscroll-behavior` flagged on old iOS browsers (compat warnings only)

---

## Changelog (recent)

- Fixed mobile canvas/chat overlap and made scroll stable.
- Added `willReadFrequently` on canvas context.
- Restored host start behavior, sync UI, and word list enrichment.
- Added robust README + professional docs.

---

## Contributions

1. Fork 🔀
2. Branch `feature/your-feature`
3. Implement
4. Commit with meaningful message
5. PR + screenshots / short description

---

## License

MIT

## Features

### Gameplay

- **Real-time multiplayer** — every stroke, guess, and score update is instant via WebSocket
- **3 word choices** — drawer picks one of 3 options before each turn; auto-selects if they don't choose in time
- **Word categories** — All, Animals, Food, Objects, Actions, Places, Movies
- **Custom word lists** — host can type their own comma-separated words; server uses them for the whole game
- **Spectator mode** — join a game already in progress and watch without playing
- **Public & private rooms** — public rooms appear in the lobby list; private rooms are join-by-code only but still visible in the list with a lock icon and disabled Join button

### Hint system

- Underscores represent unrevealed letters (`_ _ _ _ _ _ _ _`)
- Multi-word phrases show a clear gap between each word's underscores
- 2 timed reveals per turn: first at 65% elapsed, second at 85% elapsed
- Wrong guesses with correct-position letters silently queue a delayed reveal (one letter, after 5–12 seconds)
- Hard cap of 3 total revealed letters per turn
- "Close guess" private notifications with graduated intensity: close / very close / extremely close

### Drawing tools

- Full colour palette (14 colours)
- Variable brush size slider
- Clear canvas button
- Touch support — fully drawable on mobile

### UI / UX

- Landing page with animated word preview, features section, how-it-works steps
- Persistent sticky navbar with Home and Lobby links
- Leave Room and Back to Home buttons everywhere
- Player avatars with deterministic colour-coded initials
- Live "X/Y guessed" counter in the top bar
- Reaction emojis (🔥 😂 👏 😮) with floating animations
- Winner crown drop animation + canvas confetti on game over
- Mute/unmute button — state persists in localStorage
- Programmatic sound effects via Web Audio API (no audio files)
- Animated lobby with live room list refresh every 5 seconds
- Skeleton loading placeholders
- Smooth fade-in page transitions
- Fully responsive — works on mobile, tablet, and desktop

### Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT authentication — 7-day expiry, verified on every protected request
- Server-side validation on every socket event (only drawer can draw, only host can start, etc.)

---

## Tech Stack

### Backend

| Technology    | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| Node.js       | JavaScript runtime — executes server-side JS outside the browser  |
| Express.js    | Web framework — handles HTTP routes, middleware, request/response |
| Socket.io     | WebSocket library — real-time bidirectional communication         |
| MongoDB Atlas | NoSQL cloud database — stores users, rooms, final scores          |
| Mongoose      | ODM — defines schemas, validates data, provides query methods     |
| bcryptjs      | Password hashing — never stores plain-text passwords              |
| jsonwebtoken  | JWT generation and verification — stateless authentication        |
| dotenv        | Loads environment variables from `.env` into `process.env`        |
| cors          | Allows cross-origin requests from the React frontend              |

### Frontend

| Technology       | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| React 18         | UI library — component-based, reactive rendering               |
| Vite             | Build tool — fast dev server and production bundler            |
| React Router DOM | Client-side routing — multiple pages without full page reloads |
| Axios            | HTTP client — makes API calls to the Express backend           |
| Socket.io-client | Browser-side WebSocket — connects to the Socket.io server      |
| CSS Modules      | Scoped styles — each component gets its own `.module.css` file |

---

## Project Structure

```
sketchrelay/
│
├── server/
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js          # register, login, getMe
│   │   └── roomController.js          # createRoom, joinRoom, getRoom, getAllRooms
│   ├── middleware/
│   │   └── authMiddleware.js          # JWT verification — protect()
│   ├── models/
│   │   ├── User.js                    # User schema (username, email, password, scores)
│   │   └── Room.js                    # Room schema (code, host, players, settings, category)
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth/*
│   │   └── roomRoutes.js              # /api/rooms/*
│   ├── socket/
│   │   ├── socketHandler.js           # All Socket.io event handlers
│   │   └── gameManager.js             # In-memory game state, timers, hint logic, scoring
│   ├── utils/
│   │   └── words.js                   # Word bank (6 categories), hint generation, edit distance
│   ├── .env                           # Secrets — never commit
│   └── index.js                       # Entry point
│
└── client/
    └── src/
        ├── api/
        │   └── index.js               # Axios instance + all HTTP call functions
        ├── components/
        │   ├── Avatar.jsx              # Colour-coded initials avatar
        │   ├── Canvas.jsx              # HTML5 drawing canvas (mouse + touch)
        │   ├── Chat.jsx                # Fixed-height scrollable message feed + input
        │   ├── Confetti.jsx            # Canvas confetti animation
        │   ├── MuteButton.jsx          # Toggle sound on/off
        │   ├── Navbar.jsx              # Sticky top navigation bar
        │   ├── PlayerList.jsx          # Player roster with drawer highlight and spectator badge
        │   ├── Reactions.jsx           # Emoji reaction buttons + floating animations
        │   ├── Scoreboard.jsx          # Live score ranking with avatars
        │   ├── Timer.jsx               # Countdown display (goes red at 10s)
        │   └── WordChoiceScreen.jsx    # 3-word choice overlay for the drawer
        ├── context/
        │   ├── AuthContext.jsx         # Global auth state (user, token, login, logout)
        │   └── GameContext.jsx         # Global game state (players, hints, scores, status)
        ├── hooks/
        │   ├── useAuth.js              # Shortcut to AuthContext
        │   └── useSocket.js            # Socket connection lifecycle + all event listeners
        ├── pages/
        │   ├── Landing.jsx             # Public landing page at /
        │   ├── Login.jsx               # Login form
        │   ├── Register.jsx            # Registration form
        │   ├── Lobby.jsx               # Create/join room, public room browser
        │   └── GameRoom.jsx            # Main game page (waiting / playing / finished views)
        ├── socket/
        │   └── socket.js              # Socket.io-client instance (autoConnect: false)
        ├── utils/
        │   ├── avatar.js              # Deterministic colour from username
        │   └── sounds.js              # Web Audio API sound manager
        └── App.jsx                    # Routing + context providers
```

---

## Architecture Overview

### How the layers connect

```
Browser (React + Socket.io-client)
        │
        │  HTTP (Axios)           login, register, create/join room, load room metadata
        │  WebSocket (Socket.io)  drawing, guesses, scores, hints, reactions
        ▼
Express + Socket.io Server (Node.js on Render)
        │
        ├── REST routes (/api/auth, /api/rooms)
        │       └── Controllers → Mongoose → MongoDB Atlas
        │
        └── Socket.io event handlers
                └── GameManager (in-memory Map)
                        └── MongoDB (persist final scores on game-over)
```

### Two kinds of state

**MongoDB (persistent)** stores user accounts, room metadata (code, host, player list, settings), and final game scores. It survives server restarts.

**In-memory GameManager** stores everything that changes during an active game: the current word, the revealed hint indices, the countdown timer, who has guessed correctly, and live scores. It is a plain JavaScript `Map` — no database latency.

### Authentication flow

1. User submits login form → `POST /api/auth/login`
2. Server finds user, runs `bcrypt.compare()` on the password
3. If correct, signs a JWT with `JWT_SECRET` (7-day expiry) and returns it
4. Client stores the token in `localStorage` as `skribbl_token`
5. Every Axios request injects `Authorization: Bearer <token>` via an interceptor
6. The `protect` middleware verifies the token and attaches `req.user` before any protected route handler runs

### Real-time flow

When a player enters `/room/:code`, `useSocket.js` waits for the WebSocket handshake to complete, then emits `join-room`. The server adds the player to the Socket.io channel for that room code. From that point, `io.to(roomCode).emit(...)` reaches all connected players simultaneously without any manual tracking.

---

## Game Flow

### Waiting room

1. Host creates a room in the Lobby → navigates to `/room/:code`
2. Other players enter the same code → `join-room` socket event → server adds them → broadcasts `player-joined` with the updated player list to everyone
3. All clients immediately see the updated list without any refresh
4. If a player leaves, `player-left` fires with the updated list; if the host leaves, the next player becomes host via `host-changed`
5. Host clicks **Start game** → `start-game` emitted → server validates (≥2 active players, status is `waiting`) → sets status to `playing` → emits `game-started` to all

### Word choice phase

1. Server calls `prepareTurn()` — picks 3 random words from the selected category
2. Emits `choosing-word` to everyone (so non-drawers see the animated waiting screen)
3. Emits `word-choices` privately to the drawer's socket only — the 3 options
4. Drawer has 15 seconds to pick; if they don't, the first option is auto-selected
5. Drawer clicks a word → `pick-word` emitted → `beginTurn()` called

### Drawing turn

1. Canvas cleared for everyone before the new turn starts
2. `new-turn` broadcast: drawer name, underscored hint, time left, round number
3. `your-word` sent privately to the drawer
4. Countdown timer starts; `timer-tick` fires every second
5. Two timed letter reveals scheduled: one when 65% of time has elapsed, one at 85%
6. Drawer moves mouse / touches screen → `draw` events → server broadcasts `draw-broadcast` to all other players

### Guessing

- Player submits a guess → `send-guess` → `gameManager.processGuess()`
- **Correct:** `correct-guess` broadcast with points, drawer bonus, updated scores, guessed count
- **Wrong with correct-position letters:** candidates queued; after 5–12s delay, one letter silently revealed for everyone via `hint-update` (max 3 total reveals per turn)
- **Close (edit distance 1–3):** private `close-guess` to guesser only — "extremely close", "very close", or "close"
- **Wrong:** `chat-message` broadcast as plain text

### Turn end

- Timer reaches 0 or all guessers guess correctly → `endTurn()`
- `turn-ended` broadcast with the actual word and scores
- Canvas cleared
- 4-second pause → next turn starts (or `game-over` if all rounds complete)

### Game over

- `game-over` emitted with sorted final scores
- MongoDB: `totalScore` and `gamesPlayed` incremented for each player
- Players see the winner screen: crown animation, confetti, medal rankings
- "Back to lobby" resets game state and navigates to `/lobby`

---

## Hint System

| Event                  | When                                              | What happens                                               |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Timed reveal 1         | 65% of draw time elapsed                          | One random unrevealed letter shown                         |
| Timed reveal 2         | 85% of draw time elapsed                          | One more random unrevealed letter                          |
| Guess-triggered reveal | After a wrong guess with correct-position letters | One letter from the candidate pool shown after 5–12s delay |
| Hard cap               | Any time                                          | No more than 3 total letters revealed per turn             |

Multi-word phrases (e.g. "time machine") display as two separate groups of underscores with a visible gap between them, so players know how many words to expect.

The drawer always sees the full word. Only guessers see underscores.

### Close guess notifications (private, guesser only)

| Edit distance | Message shown                   |
| ------------- | ------------------------------- |
| 1             | `"[guess]" is extremely close!` |
| 2             | `"[guess]" is very close!`      |
| 3             | `"[guess]" is close!`           |

---

## Scoring System

```
points = floor(50 + (timeLeft / drawTime) × 450)
```

- Minimum: **50 points** (guessed with 1 second left)
- Maximum: **500 points** (guessed immediately)
- Drawer earns a **bonus of 20% of each guesser's points** for every correct guess during their turn

Final scores are saved to MongoDB after the game ends.

---

## API Reference

All routes require `Content-Type: application/json`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | URL                  | Auth     | Body                            | Returns           |
| ------ | -------------------- | -------- | ------------------------------- | ----------------- |
| POST   | `/api/auth/register` | None     | `{ username, email, password }` | `{ token, user }` |
| POST   | `/api/auth/login`    | None     | `{ email, password }`           | `{ token, user }` |
| GET    | `/api/auth/me`       | Required | —                               | `{ user }`        |

### Rooms

| Method | URL                     | Auth     | Body                                                                       | Returns                                               |
| ------ | ----------------------- | -------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| POST   | `/api/rooms`            | Required | `{ maxPlayers?, rounds?, drawTime?, isPrivate?, category?, customWords? }` | `{ room }`                                            |
| POST   | `/api/rooms/:code/join` | Required | —                                                                          | `{ room }`                                            |
| GET    | `/api/rooms/public`     | Required | —                                                                          | `{ rooms[] }` (all waiting rooms, public and private) |
| GET    | `/api/rooms/:code`      | Required | —                                                                          | `{ room }`                                            |

---

## Socket Events Reference

### Client → Server

| Event               | Payload                                            | Description                              |
| ------------------- | -------------------------------------------------- | ---------------------------------------- |
| `join-room`         | `{ roomCode, user: { id, username } }`             | Subscribe to a room channel              |
| `join-as-spectator` | `{ roomCode, user: { id, username } }`             | Join as a non-playing watcher            |
| `start-game`        | `{ roomCode }`                                     | Host starts the game                     |
| `pick-word`         | `{ roomCode, word }`                               | Drawer selects a word from the 3 choices |
| `draw`              | `{ roomCode, stroke: { x0,y0,x1,y1,color,size } }` | One line segment from the drawer         |
| `clear-canvas`      | `{ roomCode }`                                     | Drawer wipes the canvas                  |
| `send-guess`        | `{ roomCode, guess, userId }`                      | Player submits a guess                   |
| `react`             | `{ roomCode, emoji }`                              | Player sends an emoji reaction           |

### Server → Client

| Event              | Payload                                                                           | Who receives it          |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------ |
| `player-joined`    | `{ players[], host, message }`                                                    | Everyone in room         |
| `spectator-joined` | `{ players[], host, message }`                                                    | Everyone in room         |
| `player-left`      | `{ username, players[], host, isSpectator }`                                      | Everyone remaining       |
| `host-changed`     | `{ newHostId, newHostUsername, players[], host }`                                 | Everyone remaining       |
| `game-started`     | `{ players[], rounds, host }`                                                     | Everyone                 |
| `choosing-word`    | `{ drawer, choiceTime, round, maxRounds }`                                        | Everyone                 |
| `word-choices`     | `{ choices[], choiceTime }`                                                       | Drawer only              |
| `new-turn`         | `{ drawer, wordHint, timeLeft, round, maxRounds, guessedCount, totalGuessers }`   | Everyone                 |
| `your-word`        | `{ word }`                                                                        | Drawer only              |
| `draw-broadcast`   | `{ x0,y0,x1,y1,color,size }`                                                      | Everyone except drawer   |
| `canvas-cleared`   | —                                                                                 | Everyone                 |
| `hint-update`      | `{ wordHint }`                                                                    | Everyone                 |
| `timer-tick`       | `{ timeLeft }`                                                                    | Everyone                 |
| `correct-guess`    | `{ username, points, drawerBonus, scores[], guessedCount, totalGuessers }`        | Everyone                 |
| `chat-message`     | `{ username, message, type }`                                                     | Everyone                 |
| `close-guess`      | `{ message, level }`                                                              | Guesser only             |
| `turn-ended`       | `{ word, scores[] }`                                                              | Everyone                 |
| `game-over`        | `{ finalScores[] }` or `{ reason, finalScores[] }`                                | Everyone                 |
| `game-state-sync`  | `{ currentDrawer, wordHint, timeLeft, scores[], round, maxRounds, choosingWord }` | Reconnecting player only |
| `reaction`         | `{ username, emoji }`                                                             | Everyone                 |
| `error`            | `{ message }`                                                                     | Sender only              |

---

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sketchrelay?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_string_here
```

Never commit this file. Add `.env` to your `.gitignore`.

---

## Installation & Running Locally

**Prerequisites:** Node.js v18+, a MongoDB Atlas account (free tier)

```bash
# Clone the repository
git clone https://github.com/yourusername/sketchrelay.git
cd sketchrelay

# Install server dependencies
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET

# Install client dependencies
cd ../client
npm install
```

**Run locally (two terminals):**

```bash
# Terminal 1 — backend (auto-restarts on save)
cd server
npm run dev

# Terminal 2 — frontend (Vite dev server)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Deployment

The backend is deployed on **Render** (supports WebSockets). The frontend is deployed on **Vercel**.

### Step 1 — Update environment variables in client

`client/.env.production`:

```
VITE_API_URL=https://your-render-app.onrender.com
```

Update `client/src/api/index.js`:

```js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```

Update `client/src/socket/socket.js`:

```js
const socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });
```

### Step 2 — Add Vercel routing fix

Create `client/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Step 3 — Deploy backend on Render

1. [render.com](https://render.com) → New Web Service → connect your GitHub repo
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add environment variables: `PORT`, `MONGO_URI`, `JWT_SECRET`
6. Note your URL: `https://your-app.onrender.com`

### Step 4 — Update server CORS

In `server/index.js`:

```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-app.vercel.app", // your Vercel URL
];
```

### Step 5 — Deploy frontend on Vercel

1. [vercel.com](https://vercel.com) → New Project → connect your GitHub repo
2. Root directory: `client`
3. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com`
4. Deploy

### Step 6 — Push all changes

```bash
git add .
git commit -m "production config"
git push
```

Both platforms auto-redeploy on every push to `main`.

### Free tier note

Render's free tier spins down after 15 minutes of inactivity. The first request after that takes 30–60 seconds to wake up. Use [UptimeRobot](https://uptimerobot.com) (free) to ping your server URL every 14 minutes to keep it awake.

---

## Updating the Deployed App

For any code change — bug fix, new feature, word list update, styling:

```bash
git add .
git commit -m "describe your change"
git push
```

Render redeploys the backend in ~60 seconds. Vercel redeploys the frontend in ~30 seconds. No dashboard action needed.

**Exception:** if you add a new environment variable, you must add it manually in the Render or Vercel dashboard and trigger a manual redeploy once.

---

## Known Bug — Room Sync After First Login

**Symptom:** After logging in for the first time in a browser session and joining or creating a room, the host may not see other players' names and the Start Game button may not appear. Refreshing the page fixes it.

**Root cause (three interacting issues):**

1. `AuthContext` calls `authAPI.getMe()` on mount to verify the JWT. When it resolves, it calls `setUser(newObject)` — a new JavaScript object reference even if the data is the same. This causes `useSocket`'s `useEffect` dependency array to fire again, disconnecting and reconnecting the socket.

2. The `SET_ROOM` action in `GameContext` (triggered by `roomAPI.getOne()`) unconditionally replaces `room.host` with whatever came from the HTTP response, potentially overwriting the more recent host value delivered by socket events.

3. The `roomAPI.getOne()` HTTP call and the socket's `player-joined` event race to update state. If the HTTP response arrives after the socket event, it can overwrite the correct player list.

**Files to fix:**

- `client/src/hooks/useSocket.js` — use stable primitive dependencies (`userId`, `username` strings) instead of the `user` object, and use a ref-based stable callback to prevent duplicate socket connections
- `client/src/context/GameContext.jsx` — in the `SET_ROOM` case, preserve `state.room?.host` if it was already set by a socket event: `host: state.room?.host || action.payload.host`
- `client/src/pages/GameRoom.jsx` — add a 300ms delay before `roomAPI.getOne()` so socket events always arrive and populate state before the HTTP response can overwrite them

---

## Known Limitations

- If the Render server restarts mid-game, in-memory game state (current word, timer, scores) is lost. Players would need to create a new room.
- The free Render tier has cold-start latency of 30–60 seconds after 15 minutes of inactivity.
- There is no persistent chat outside of guessing — all messages are guesses, system notifications, or game events.
