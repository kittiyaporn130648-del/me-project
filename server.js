// Number Guessing Game Cloud Server
// Node.js + Express + SQLite3

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Database Setup
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'game.db')
  : 'game.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize Database Schema
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      wins INTEGER DEFAULT 0,
      total_attempts INTEGER DEFAULT 0,
      best_attempts INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      secret_number INTEGER NOT NULL,
      guesses TEXT NOT NULL,
      attempts INTEGER NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_name) REFERENCES players(name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      secret_number INTEGER NOT NULL,
      players TEXT NOT NULL,
      winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Game State Storage (in-memory)
const activeSessions = {};

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== API Endpoints ====================

// 1. Create New Game Session
app.post('/api/new-game', (req, res) => {
  const sessionId = generateSessionId();
  const secretNumber = Math.floor(Math.random() * 100) + 1;

  activeSessions[sessionId] = {
    secret_number: secretNumber,
    players: {},
    created_at: new Date()
  };

  // Store in database
  db.run(
    'INSERT INTO game_sessions (session_id, secret_number, players) VALUES (?, ?, ?)',
    [sessionId, secretNumber, JSON.stringify({})],
    (err) => {
      if (err) console.error('DB Error:', err);
    }
  );

  res.json({
    success: true,
    session_id: sessionId,
    message: 'เกมใหม่สร้างสำเร็จ!'
  });
});

// 2. Get Current Game Status
app.get('/api/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบเกม'
    });
  }

  res.json({
    success: true,
    session_id: sessionId,
    players: session.players
  });
});

// 3. Make a Guess
app.post('/api/guess', (req, res) => {
  const { sessionId, playerName, guess } = req.body;

  // Validation
  if (!sessionId || !playerName || guess === undefined) {
    return res.status(400).json({
      success: false,
      error: 'ข้อมูลไม่ครบถ้วน'
    });
  }

  const guessNum = parseInt(guess);

  // Check range
  if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาใส่เลข 1 - 100'
    });
  }

  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบเกม'
    });
  }

  // Check if player already won
  if (session.winner) {
    return res.status(400).json({
      success: false,
      error: 'เกมจบแล้ว! ผู้ชนะคือ: ' + session.winner
    });
  }

  // Initialize player if needed
  if (!session.players[playerName]) {
    session.players[playerName] = {
      guesses: [],
      attempts: 0,
      result: null
    };
  }

  const player = session.players[playerName];
  const secretNumber = session.secret_number;

  player.guesses.push(guessNum);
  player.attempts++;

  let result = null;
  let message = '';

  if (guessNum === secretNumber) {
    result = 'WIN';
    message = `✅ ${playerName} ทายถูก! เลขที่ถูกต้องคือ ${secretNumber} (ทายไป ${player.attempts} ครั้ง)`;
    session.winner = playerName;

    // Update player stats in database
    updatePlayerStats(playerName, player.attempts);
  } else if (guessNum > secretNumber) {
    result = 'HIGH';
    message = `🔽 ${playerName}: ${guessNum} สูงเกินไป (ครั้งที่ ${player.attempts})`;
  } else {
    result = 'LOW';
    message = `🔼 ${playerName}: ${guessNum} ต่ำเกินไป (ครั้งที่ ${player.attempts})`;
  }

  // Store game data in database
  db.run(
    'INSERT INTO games (player_name, secret_number, guesses, attempts, result) VALUES (?, ?, ?, ?, ?)',
    [playerName, secretNumber, JSON.stringify(player.guesses), player.attempts, result],
    (err) => {
      if (err) console.error('DB Error:', err);
    }
  );

  res.json({
    success: true,
    result: result,
    message: message,
    attempts: player.attempts,
    winner: session.winner || null,
    all_guesses: player.guesses
  });
});

// 4. Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
  db.all(
    'SELECT name, wins, total_attempts, best_attempts FROM players ORDER BY wins DESC, best_attempts ASC, total_attempts ASC LIMIT 10',
    (err, rows) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({
        success: true,
        leaderboard: rows || []
      });
    }
  );
});

// 5. Get Game History
app.get('/api/history', (req, res) => {
  db.all(
    'SELECT player_name, secret_number, attempts, result, created_at FROM games ORDER BY created_at DESC LIMIT 20',
    (err, rows) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      res.json({
        success: true,
        history: rows || []
      });
    }
  );
});

// 6. Get Player Statistics
app.get('/api/player/:name', (req, res) => {
  const { name } = req.params;

  db.get(
    'SELECT * FROM players WHERE name = ?',
    [name],
    (err, player) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!player) {
        return res.status(404).json({
          success: false,
          error: 'ไม่พบข้อมูลผู้เล่น'
        });
      }

      res.json({
        success: true,
        player: player
      });
    }
  );
});

// Helper Function: Update Player Stats
function updatePlayerStats(playerName, attempts) {
  db.run(
    'SELECT * FROM players WHERE name = ?',
    [playerName],
    (err, row) => {
      if (err) {
        console.error('DB Error:', err);
        return;
      }

      if (!row) {
        // New player
        db.run(
          'INSERT INTO players (name, wins, total_attempts, best_attempts) VALUES (?, ?, ?, ?)',
          [playerName, 1, attempts, attempts],
          (err) => {
            if (err) console.error('DB Error:', err);
          }
        );
      } else {
        // Existing player
        const newBestAttempts = row.best_attempts ? Math.min(row.best_attempts, attempts) : attempts;
        db.run(
          'UPDATE players SET wins = wins + 1, total_attempts = total_attempts + ?, best_attempts = ? WHERE name = ?',
          [attempts, newBestAttempts, playerName],
          (err) => {
            if (err) console.error('DB Error:', err);
          }
        );
      }
    }
  );
}

// 7. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running ✓',
    timestamp: new Date()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎮 Number Guessing Game Cloud Server  ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}        ║
║  Database: game.db                     ║
║  Status: ✓ Running                     ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
