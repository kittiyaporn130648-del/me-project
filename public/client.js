// Number Guessing Game Frontend
// Handles UI and API Communication

let gameState = {
  sessionId: null,
  playerName: null,
  currentAttempts: 0,
  gameActive: false,
  guesses: []
};

const API_BASE = 'http://localhost:3000/api';

// ==================== Screen Management ====================

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showStatus(message, type = 'info') {
  const statusBox = document.getElementById('status-box');
  statusBox.textContent = message;
  statusBox.style.display = 'block';
}

function hideStatus() {
  document.getElementById('status-box').style.display = 'none';
}

// ==================== Game Initialization ====================

async function startNewGame() {
  const playerNameInput = document.getElementById('player-name');
  const playerName = playerNameInput.value.trim();

  if (!playerName) {
    alert('กรุณาใส่ชื่อของคุณ');
    return;
  }

  // ตรวจสอบชื่อซ้ำ (Optional - for demonstration)
  if (playerName.length < 2 || playerName.length > 20) {
    alert('ชื่อต้องยาว 2-20 ตัวอักษร');
    return;
  }

  try {
    // Create game session on server
    const response = await fetch(`${API_BASE}/new-game`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      gameState.sessionId = data.session_id;
      gameState.playerName = playerName;
      gameState.currentAttempts = 0;
      gameState.gameActive = true;
      gameState.guesses = [];

      // Update UI
      document.getElementById('current-player-name').textContent = playerName;
      document.getElementById('player-guess').value = '';
      document.getElementById('player-guess').focus();

      switchScreen('game-screen');
      updateActivePlayers();
      hideStatus();
    } else {
      alert('เกิดข้อผิดพลาด: ' + data.message);
    }
  } catch (error) {
    console.error('Error creating game:', error);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
  }
}

async function updateActivePlayers() {
  try {
    const response = await fetch(`${API_BASE}/status/${gameState.sessionId}`);
    const data = await response.json();

    if (data.success) {
      const playersList = document.getElementById('active-players');
      playersList.innerHTML = '';

      Object.keys(data.players).forEach(name => {
        const player = data.players[name];
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
          <div>
            <div class="player-name">${name}</div>
            <div class="player-attempts">${player.attempts} ครั้ง</div>
          </div>
          <div class="player-status ${player.result ? 'complete' : 'active'}">
            ${player.result === 'WIN' ? '✅ ชนะ!' : '🎮 เล่นอยู่'}
          </div>
        `;
        playersList.appendChild(playerDiv);
      });
    }
  } catch (error) {
    console.error('Error updating players:', error);
  }
}

// ==================== Game Logic ====================

async function makeGuess(event) {
  event.preventDefault();

  if (!gameState.gameActive) {
    return;
  }

  const guessInput = document.getElementById('player-guess');
  const guessValue = guessInput.value.trim();

  if (!guessValue) {
    showStatus('⚠️ กรุณาใส่เลข');
    return;
  }

  const guess = parseInt(guessValue);

  try {
    const response = await fetch(`${API_BASE}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: gameState.sessionId,
        playerName: gameState.playerName,
        guess: guess
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showStatus('❌ ' + data.error);
      return;
    }

    if (data.success) {
      gameState.currentAttempts = data.attempts;
      gameState.guesses = data.all_guesses;

      // Update attempt counter
      document.getElementById('attempt-counter').textContent = `ครั้งที่ ${data.attempts}`;

      // Show result
      showResult(data.result, data.message, data.all_guesses);

      // Check if game is won
      if (data.result === 'WIN') {
        gameState.gameActive = false;
        setTimeout(() => {
          showWinner(data.message);
        }, 500);
      }

      // Update active players list
      updateActivePlayers();

      // Clear input
      guessInput.value = '';
      guessInput.focus();
    }
  } catch (error) {
    console.error('Error making guess:', error);
    showStatus('❌ เกิดข้อผิดพลาดในการทำนาย');
  }
}

function showResult(result, message, guesses) {
  const resultBox = document.getElementById('result-box');
  const resultMessage = document.getElementById('result-message');
  const guessesDisplay = document.getElementById('guesses-display');

  resultMessage.textContent = message;

  // Show guesses
  guessesDisplay.innerHTML = `<strong>ทายไปแล้ว:</strong> ${guesses.join(', ')}`;

  resultBox.classList.remove('hidden');
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showWinner(message) {
  document.getElementById('result-box').classList.add('hidden');
  document.getElementById('winner-message').textContent = message.substring(0, message.indexOf('('));
  document.getElementById('winner-box').classList.remove('hidden');
}

async function startNewGameRound() {
  // Reset current game but keep player name
  gameState.currentAttempts = 0;
  gameState.gameActive = true;
  gameState.guesses = [];

  document.getElementById('attempt-counter').textContent = 'ครั้งที่ 1';
  document.getElementById('player-guess').value = '';
  document.getElementById('result-box').classList.add('hidden');
  document.getElementById('winner-box').classList.add('hidden');
  document.getElementById('player-guess').focus();

  try {
    const response = await fetch(`${API_BASE}/new-game`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      gameState.sessionId = data.session_id;
      updateActivePlayers();
      showStatus('🎮 เกมใหม่เริ่มแล้ว!', 'success');
    }
  } catch (error) {
    console.error('Error starting new game:', error);
  }
}

// ==================== Results Screen ====================

async function loadResults() {
  switchScreen('results-screen');
  await loadLeaderboard();
  await loadHistory();
}

async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_BASE}/leaderboard`);
    const data = await response.json();

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    if (data.leaderboard && data.leaderboard.length > 0) {
      data.leaderboard.forEach((player, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><span class="rank rank-${rank}">${rank}</span></td>
          <td>${player.name}</td>
          <td>${player.wins}</td>
          <td>${player.best_attempts || '-'}</td>
          <td>${player.total_attempts}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">ยังไม่มีข้อมูล</td></tr>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    document.getElementById('leaderboard-body').innerHTML = 
      '<tr><td colspan="5" style="text-align: center;">❌ ไม่สามารถโหลดข้อมูล</td></tr>';
  }
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    const data = await response.json();

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (data.history && data.history.length > 0) {
      data.history.forEach(game => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const resultClass = game.result;
        const resultText = 
          game.result === 'WIN' ? `✅ ชนะ (${game.attempts} ครั้ง)` :
          game.result === 'HIGH' ? '🔽 สูงเกินไป' :
          '🔼 ต่ำเกินไป';

        li.innerHTML = `
          <div class="history-info">
            <div class="history-player">${game.player_name}</div>
            <div class="history-details">เลขลับ: ${game.secret_number} | ${new Date(game.created_at).toLocaleString('th-TH')}</div>
          </div>
          <div class="history-result ${resultClass}">${resultText}</div>
        `;
        historyList.appendChild(li);
      });
    } else {
      historyList.innerHTML = '<li style="text-align: center; padding: 20px;">ยังไม่มีประวัติการเล่น</li>';
    }
  } catch (error) {
    console.error('Error loading history:', error);
    document.getElementById('history-list').innerHTML = 
      '<li style="text-align: center; padding: 20px;">❌ ไม่สามารถโหลดข้อมูล</li>';
  }
}

function goBack() {
  switchScreen('game-screen');
  document.getElementById('winner-box').classList.add('hidden');
  document.getElementById('result-box').classList.add('hidden');
  document.getElementById('player-guess').value = '';
  document.getElementById('player-guess').focus();
}

function resetToSetup() {
  gameState = {
    sessionId: null,
    playerName: null,
    currentAttempts: 0,
    gameActive: false,
    guesses: []
  };
  document.getElementById('player-name').value = '';
  switchScreen('setup-screen');
  document.getElementById('player-name').focus();
}

// ==================== Event Listeners ====================

// Setup Screen
document.getElementById('start-btn').addEventListener('click', startNewGame);
document.getElementById('player-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startNewGame();
});

// Game Screen
document.getElementById('guess-form').addEventListener('submit', makeGuess);
document.getElementById('new-game-btn').addEventListener('click', startNewGameRound);
document.getElementById('back-btn').addEventListener('click', goBack);

// Results Screen
async function showResultsScreen() {
  await loadResults();
}

// Auto-update active players every 2 seconds
setInterval(() => {
  if (gameState.gameActive && gameState.sessionId) {
    updateActivePlayers();
  }
}, 2000);

// Make player-guess input auto-focus
document.getElementById('player-guess').addEventListener('blur', function() {
  if (gameState.gameActive) {
    this.focus();
  }
});

// Navigation
document.getElementById('play-again-btn').addEventListener('click', resetToSetup);

// Display leaderboard when clicking results button (if there is one)
document.addEventListener('DOMContentLoaded', function() {
  // You can add more initialization logic here if needed
  console.log('✓ Number Guessing Game Ready');
});
