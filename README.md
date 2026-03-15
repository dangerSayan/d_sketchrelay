# d_SketchRelay

A real-time multiplayer drawing and guessing game built with the MERN stack and Socket.io. Players join rooms, take turns drawing a word while others race to guess it, and compete for the highest score.

---

## Live Demo

> Deploy instructions are in the [Deployment](#deployment) section below.

---

## Table of Contents

- [What the App Does](#what-the-app-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Game Flow](#game-flow)
- [Hint System](#hint-system)
- [Scoring System](#scoring-system)
- [API Reference](#api-reference)
- [Socket Events Reference](#socket-events-reference)
- [Environment Variables](#environment-variables)
- [Installation & Running Locally](#installation--running-locally)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)

---

## What the App Does

Players register or log in, then either create a room or join one using a 6-character code. The host configures settings (number of rounds, draw time, max players) and starts the game. Each round, one player is assigned as the drawer and receives a secret word. All other players see only underscores representing the word's letters and must type their guesses in the chat. The faster a player guesses correctly, the more points they earn. After all rounds complete, a final scoreboard shows the winner. Scores are saved to each user's profile in the database.

---

## Tech Stack

### Backend

| Technology      | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| Node.js         | JavaScript runtime — executes server-side JS outside the browser  |
| Express.js      | Web framework — handles HTTP routes, middleware, request/response |
| Socket.io       | WebSocket library — real-time bidirectional communication         |
| MongoDB (Atlas) | NoSQL cloud database — stores users, rooms, scores                |
| Mongoose        | ODM — defines schemas, validates data, provides query methods     |
| bcryptjs        | Password hashing — never stores plain-text passwords              |
| jsonwebtoken    | JWT generation and verification — stateless authentication        |
| dotenv          | Loads environment variables from `.env` into `process.env`        |
| cors            | Allows cross-origin requests from the React frontend              |

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
skribbl-clone/
│
├── server/
│   ├── config/
│   │   └── db.js                  # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js      # register, login, getMe handler functions
│   │   └── roomController.js      # createRoom, joinRoom, getRoom, getPublicRooms
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification — protect() function
│   ├── models/
│   │   ├── User.js                # Mongoose schema for users
│   │   └── Room.js                # Mongoose schema for rooms and embedded players
│   ├── routes/
│   │   ├── authRoutes.js          # Maps /api/auth/* URLs to authController
│   │   └── roomRoutes.js          # Maps /api/rooms/* URLs to roomController
│   ├── socket/
│   │   ├── socketHandler.js       # All Socket.io event handlers
│   │   └── gameManager.js         # In-memory game state, timers, scoring logic
│   ├── utils/
│   │   └── words.js               # Word list, hint generation, edit distance
│   ├── .env                       # Secrets — never commit this
│   └── index.js                   # Entry point — creates server, connects DB
│
└── client/
    └── src/
        ├── api/
        │   └── index.js           # All Axios HTTP call functions in one place
        ├── components/
        │   ├── Canvas.jsx          # HTML5 drawing canvas
        │   ├── Canvas.module.css
        │   ├── Chat.jsx            # Message feed + guess input
        │   ├── Chat.module.css
        │   ├── PlayerList.jsx      # Room player list with drawer highlight
        │   ├── PlayerList.module.css
        │   ├── Scoreboard.jsx      # Live score ranking
        │   ├── Scoreboard.module.css
        │   ├── Timer.jsx           # Countdown display
        │   └── Timer.module.css
        ├── context/
        │   ├── AuthContext.jsx     # Global auth state (user, token, login, logout)
        │   └── GameContext.jsx     # Global game state (players, scores, hint, timer)
        ├── hooks/
        │   ├── useAuth.js          # Shortcut to AuthContext
        │   └── useSocket.js        # Manages socket connection + all event listeners
        ├── pages/
        │   ├── Login.jsx           # Login form page
        │   ├── Register.jsx        # Registration form page
        │   ├── Lobby.jsx           # Create/join room page
        │   ├── GameRoom.jsx        # Main game page (assembles all components)
        │   └── Auth.module.css     # Shared styles for Login and Register
        ├── socket/
        │   └── socket.js          # Creates the socket.io-client instance
        ├── App.jsx                 # Root component — routing + context providers
        └── main.jsx               # ReactDOM entry point
```

---

## Architecture Overview

### How the layers connect

```
Browser (React + Socket.io-client)
        │
        │  HTTP (Axios)          — login, register, create/join room
        │  WebSocket (Socket.io) — drawing, guesses, game events
        ▼
Express Server (Node.js)
        │
        ├── REST routes (/api/auth, /api/rooms)
        │       └── Controllers → Mongoose → MongoDB Atlas
        │
        └── Socket.io handler
                └── gameManager (in-memory state)
                        └── MongoDB (persist final scores)
```

### Two kinds of state

**MongoDB (persistent)** stores things that survive a server restart: user accounts, room metadata (code, settings, player list), and final game scores.

**In-memory GameManager** (a JavaScript `Map`) stores the live game state during a match: the current word, the revealed hint, the countdown timer, who has guessed correctly, and current round scores. This state is fast to read and write, which matters because events like `draw` and `timer-tick` fire multiple times per second.

### Authentication flow

1. User submits the login form → React calls `POST /api/auth/login`
2. Express finds the user in MongoDB, compares the submitted password to the bcrypt hash
3. If correct, generates a JWT signed with `JWT_SECRET`, returns it with the user object
4. React stores the token in `localStorage` under the key `skribbl_token`
5. Every subsequent Axios request includes `Authorization: Bearer <token>` via an interceptor
6. The `protect` middleware on protected routes extracts, verifies, and decodes the JWT, then attaches `req.user` for the route handler to use

### Real-time communication

When a player enters a game room, `useSocket.js` calls `socket.connect()` and emits `join-room`. The server subscribes that socket to a Socket.io channel named after the room code (e.g. `UDUFTP`). From that point, `io.to('UDUFTP').emit(...)` reaches every connected player simultaneously.

Drawing is the highest-frequency flow: mouse movement emits one `draw` event per pixel moved. The server verifies the sender is the current drawer, then uses `socket.to(roomCode).emit('draw-broadcast', stroke)` — the `socket.to()` variant excludes the sender, since they already drew it locally.

---

## Game Flow

### Waiting room

1. Host creates a room via the Lobby → navigates to `/room/:code`
2. Other players join using the code → their names appear in the player list instantly via `player-joined` event
3. If a player leaves before the game starts, `player-left` fires, the player list updates, and if the leaver was the host, the next player becomes the new host (`host-changed` event)
4. Host clicks "Start game" → `start-game` emitted → server validates, sets room status to `playing`, creates in-memory game state, emits `game-started` to all

### Each turn

1. Server picks a random drawer (cycling through all players each round)
2. `new-turn` event broadcasts to everyone: drawer name, word hint (all underscores), time left, round number
3. `your-word` event sent privately to the drawer's socket only: the actual word
4. Countdown timer starts — `timer-tick` fires every second
5. Two timed letter reveals are scheduled: one at 40% elapsed time, one at 70% elapsed time
6. Drawer moves mouse → `draw` events → server broadcasts `draw-broadcast` to everyone else → strokes appear on all canvases simultaneously

### Guessing

- A player types a guess and submits → `send-guess` emitted
- Server calls `processGuess()` in gameManager:
  - **Correct**: emits `correct-guess` to everyone (name, points, updated scoreboard), awards time-proportional points + drawer bonus
  - **Wrong with correct-position letters**: adds those letter indices to a candidate pool; after a delay of 3–8 seconds, ONE random letter from the pool is silently revealed in the hint for everyone via `hint-update`
  - **Close (edit distance ≤ 2)**: privately emits `close-guess` only to the guesser
  - **Wrong**: broadcasts as `chat-message` to everyone
- If all guessers answer correctly, the turn ends early

### Turn end

- When time runs out or everyone guesses, `endTurn()` fires
- `turn-ended` emitted: reveals the actual word, sends final scores
- Canvas cleared for everyone
- After 4 seconds, next turn starts (or `game-over` if all rounds complete)

### Game over

- `game-over` emitted with final sorted scores
- MongoDB updated: each player's `totalScore` and `gamesPlayed` incremented
- All players see the winner screen with final standings
- "Back to lobby" resets game state and navigates back

---

## Hint System

The hint display shows underscores for unrevealed letters and the actual character for revealed ones. Example: for "elephant" → `_ _ _ _ _ _ _ _` initially.

### Timed reveals (automatic)

- First letter revealed when **40% of draw time** has elapsed
- Second letter revealed when **70% of draw time** has elapsed
- Maximum 2 automatic reveals per turn regardless of word length

### Guess-triggered reveals (from correct-position letters)

- When a wrong guess has one or more letters in the correct position, those indices go into a candidate pool
- After a delay of 3–8 seconds (longer when more time remains, to keep it competitive), ONE randomly chosen letter from the pool is revealed for everyone
- This reveal is silent — the chat message just shows the plain guess text
- The pool resets after each reveal, so rapid guessing doesn't instantly expose the whole word

### What the drawer sees

The drawer always sees their full word, not underscores. The hint display is bypassed for them.

### What the "close guess" notification shows

If your guess is within 2 edits (insertions, deletions, substitutions) of the real word, you privately receive an orange message: `"your guess" is very close!`. Only you see this. The drawer does not.

---

## Scoring System

Points are awarded per turn based on how quickly the guesser answers:

```
points = floor(50 + (timeLeft / drawTime) * 450)
```

- Minimum: 50 points (guessed at the last second)
- Maximum: 500 points (guessed instantly)

The drawer also earns a bonus equal to 20% of what the guesser earned, for every correct guess during their turn.

After the game, each player's earned points are added to their `totalScore` in MongoDB, and `gamesPlayed` increments by 1.

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

| Method | URL                     | Auth     | Body                                              | Returns       |
| ------ | ----------------------- | -------- | ------------------------------------------------- | ------------- |
| POST   | `/api/rooms`            | Required | `{ maxPlayers?, rounds?, drawTime?, isPrivate? }` | `{ room }`    |
| POST   | `/api/rooms/:code/join` | Required | —                                                 | `{ room }`    |
| GET    | `/api/rooms/public`     | Required | —                                                 | `{ rooms[] }` |
| GET    | `/api/rooms/:code`      | Required | —                                                 | `{ room }`    |

---

## Socket Events Reference

### Client → Server

| Event          | Payload                                            | Description                                  |
| -------------- | -------------------------------------------------- | -------------------------------------------- |
| `join-room`    | `{ roomCode, user: { id, username } }`             | Subscribe to a room channel                  |
| `start-game`   | `{ roomCode }`                                     | Host starts the game (validated server-side) |
| `draw`         | `{ roomCode, stroke: { x0,y0,x1,y1,color,size } }` | One line segment from the drawer             |
| `clear-canvas` | `{ roomCode }`                                     | Drawer wipes the canvas                      |
| `send-guess`   | `{ roomCode, guess, userId }`                      | Player submits a guess                       |

### Server → Client

| Event             | Payload                                                                         | Who receives it          |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------ |
| `player-joined`   | `{ players[], message }`                                                        | Everyone in room         |
| `player-left`     | `{ username, players[] }`                                                       | Everyone remaining       |
| `host-changed`    | `{ newHostId, newHostUsername, players[] }`                                     | Everyone remaining       |
| `game-started`    | `{ players[], rounds }`                                                         | Everyone                 |
| `new-turn`        | `{ drawer, wordHint, timeLeft, round, maxRounds, guessedCount, totalGuessers }` | Everyone                 |
| `your-word`       | `{ word }`                                                                      | Drawer only              |
| `draw-broadcast`  | `{ x0,y0,x1,y1,color,size }`                                                    | Everyone except drawer   |
| `canvas-cleared`  | —                                                                               | Everyone                 |
| `hint-update`     | `{ wordHint }`                                                                  | Everyone                 |
| `timer-tick`      | `{ timeLeft }`                                                                  | Everyone                 |
| `correct-guess`   | `{ username, points, drawerBonus, scores[], guessedCount, totalGuessers }`      | Everyone                 |
| `chat-message`    | `{ username, message, type }`                                                   | Everyone                 |
| `close-guess`     | `{ message }`                                                                   | Guesser only (private)   |
| `turn-ended`      | `{ word, scores[] }`                                                            | Everyone                 |
| `game-over`       | `{ finalScores[] }` or `{ reason }`                                             | Everyone                 |
| `game-state-sync` | `{ currentDrawer, wordHint, timeLeft, scores[], round, maxRounds }`             | Reconnecting player only |
| `error`           | `{ message }`                                                                   | Sender only              |

---

## Environment Variables

Create `server/.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/skribbl?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_string_here
```

Never commit this file. It is listed in `.gitignore`.

---

## Installation & Running Locally

**Prerequisites:** Node.js v18+, a free MongoDB Atlas account

```bash
# Clone the repository
git clone https://github.com/yourusername/skribbl-clone.git
cd skribbl-clone

# Install server dependencies
cd server
npm install

# Create your .env file (see Environment Variables section above)
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Install client dependencies
cd ../client
npm install
```

**Run in development (two terminals):**

```bash
# Terminal 1 — backend
cd server
npm run dev       # nodemon restarts on file save

# Terminal 2 — frontend
cd client
npm run dev       # Vite serves on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Deployment

### Backend — Render (free tier)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repository, set root directory to `server`
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add environment variables: `PORT`, `MONGO_URI`, `JWT_SECRET`
7. Note your deployed URL (e.g. `https://skribbl-server.onrender.com`)

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your repository, set root directory to `client`
3. Add environment variable: `VITE_API_URL=https://skribbl-server.onrender.com`
4. Update `client/src/api/index.js` and `client/src/socket/socket.js` to use `import.meta.env.VITE_API_URL` instead of `http://localhost:5000`

---

## Known Limitations

- The word bank is currently hardcoded in `server/utils/words.js`. A future improvement would be a custom word list per room.
- Mobile touch events are not implemented on the canvas — drawing only works with a mouse.
- There is no chat outside of guessing — all messages in the chat feed are either guesses, system notifications, or game events.
- If the server restarts mid-game, in-memory game state is lost. Players would need to create a new room.
