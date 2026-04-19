let answer = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

function start() {
  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";
}

function guess() {
  let value = document.getElementById("guess").value;

  if (!value) {
    alert("กรุณาใส่ตัวเลข");
    return;
  }

  let num = parseInt(value);
  attempts++;

  let result = "";
  let hint = "";

  if (num < answer) {
    result = "ต่ำไป";
  } else if (num > answer) {
    result = "สูงไป";
  } else {
    result = "ถูกต้อง 🎉";
  }

  let diff = Math.abs(num - answer);
  if (diff <= 5) hint = "🔥 ใกล้มาก!";
  else if (diff <= 15) hint = "🙂 ใกล้แล้ว";
  else hint = "❄️ ไกลอยู่";

  document.getElementById("result").innerText = result;
  document.getElementById("hint").innerText =
    hint + " | ครั้งที่: " + attempts;

  if (result === "ถูกต้อง 🎉") {
    alert("ชนะแล้ว! ใช้ไป " + attempts + " ครั้ง");
  }
}