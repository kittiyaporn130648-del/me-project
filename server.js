const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

let game = {
  number: Math.floor(Math.random() * 100) + 1,
  attempts: 0,
  startTime: null,
  userId: null
};

// เริ่มเกม
app.post("/start", (req, res) => {
  const { name } = req.body;

  db.run("INSERT INTO users (name) VALUES (?)", [name], function () {
    game = {
      number: Math.floor(Math.random() * 100) + 1,
      attempts: 0,
      startTime: Date.now(),
      userId: this.lastID
    };

    res.json({ message: "game started" });
  });
});

// ทายเลข
app.post("/guess", (req, res) => {
  if (!game.userId) {
    return res.status(400).json({ error: "start game first" });
  }

  const { guess } = req.body;
  game.attempts++;

  let result = "";
  let hint = "";

  if (guess < game.number) {
    result = "low";
  } else if (guess > game.number) {
    result = "high";
  } else {
    result = "correct";
  }

  // hint
  let diff = Math.abs(guess - game.number);
  if (diff <= 5) hint = "🔥 ใกล้มาก!";
  else if (diff <= 15) hint = "🙂 ใกล้แล้ว";
  else hint = "❄️ ไกลอยู่";

  // save history
  db.run("INSERT INTO game_history (user_id, guess, result) VALUES (?, ?, ?)",
    [game.userId, guess, result]);

  // ชนะ

if (result === "correct") {

  let timeUsed = Math.floor((Date.now() - game.startTime) / 1000);

  db.run(
    "INSERT INTO scores (user_id, attempts, time_used) VALUES (?, ?, ?)",
    [game.userId, game.attempts, timeUsed]
  );
}

  res.json({ result, hint, attempts: game.attempts });
});

// leaderboard
app.get("/leaderboard", (req, res) => {
  db.all(`
    SELECT users.name, scores.attempts, scores.time_used
    FROM scores
    JOIN users ON users.id = scores.user_id
    ORDER BY attempts ASC
    LIMIT 10
  `, (err, rows) => {
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});