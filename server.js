// Number Guessing Game Cloud Server
// Node.js + Express + SQLite3

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.static('public'));

// ================= DATABASE =================
const db = new Database(path.join(__dirname, 'game.db'));

// create tables
db.prepare(`
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  wins INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  best_attempts INTEGER
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT,
  secret_number INTEGER,
  guesses TEXT,
  attempts INTEGER,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  secret_number INTEGER,
  players TEXT,
  winner TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

// ================= GAME MEMORY =================
const activeSessions = {};

function generateSessionId() {
  return 'session_' + Date.now();
}

// ================= ROUTES =================

// health check
app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

// create game
app.post('/api/new-game', (req, res) => {
  const sessionId = generateSessionId();
  const secretNumber = Math.floor(Math.random() * 100) + 1;

  activeSessions[sessionId] = {
    secret_number: secretNumber,
    players: {},
    winner: null
  };

  db.prepare(`
    INSERT INTO game_sessions (session_id, secret_number, players)
    VALUES (?, ?, ?)
  `).run(sessionId, secretNumber, JSON.stringify({}));

  res.json({
    success: true,
    session_id: sessionId
  });
});

// guess
app.post('/api/guess', (req, res) => {
  const { sessionId, playerName, guess } = req.body;

  if (!sessionId || !playerName || guess === undefined) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
  }

  const session = activeSessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: 'ไม่พบเกม' });
  }

  if (session.winner) {
    return res.json({ message: 'เกมจบแล้ว', winner: session.winner });
  }

  const guessNum = parseInt(guess);

  if (!session.players[playerName]) {
    session.players[playerName] = { guesses: [], attempts: 0 };
  }

  const player = session.players[playerName];
  player.guesses.push(guessNum);
  player.attempts++;

  const secret = session.secret_number;

  let result;

  if (guessNum === secret) {
    result = 'WIN';
    session.winner = playerName;

    updatePlayerStats(playerName, player.attempts);
  } else if (guessNum > secret) {
    result = 'HIGH';
  } else {
    result = 'LOW';
  }

  db.prepare(`
    INSERT INTO games (player_name, secret_number, guesses, attempts, result)
    VALUES (?, ?, ?, ?, ?)
  `).run(playerName, secret, JSON.stringify(player.guesses), player.attempts, result);

  res.json({
    result,
    attempts: player.attempts,
    winner: session.winner || null
  });
});

// leaderboard
app.get('/api/leaderboard', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM players
    ORDER BY wins DESC, best_attempts ASC
    LIMIT 10
  `).all();

  res.json(rows);
});

// ================= HELPER =================
function updatePlayerStats(name, attempts) {
  const player = db.prepare('SELECT * FROM players WHERE name=?').get(name);

  if (!player) {
    db.prepare(`
      INSERT INTO players (name, wins, total_attempts, best_attempts)
      VALUES (?, ?, ?, ?)
    `).run(name, 1, attempts, attempts);
  } else {
    const best = player.best_attempts
      ? Math.min(player.best_attempts, attempts)
      : attempts;

    db.prepare(`
      UPDATE players
      SET wins = wins + 1,
          total_attempts = total_attempts + ?,
          best_attempts = ?
      WHERE name = ?
    `).run(attempts, best, name);
  }
}

// ================= START =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});