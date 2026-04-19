async function start() {
  let name = document.getElementById("name").value;

  await fetch("/start", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name })
  });

  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";
}

async function guess() {
  let value = document.getElementById("guess").value;

  let res = await fetch("/guess", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ guess: parseInt(value) })
  });

  let data = await res.json();

  document.getElementById("result").innerText = data.result;
  document.getElementById("hint").innerText = data.hint;

  if (data.result === "correct") {
    loadBoard();
  }
}

async function loadBoard() {
  let res = await fetch("/leaderboard");
  let data = await res.json();

  let board = document.getElementById("board");
  board.innerHTML = "";

  data.forEach(p => {
    let li = document.createElement("li");
  li.innerText = `${p.name} - ${p.attempts} ครั้ง`;
    board.appendChild(li);
  });
}