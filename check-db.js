const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('game.db');

console.log('🔍 ตรวจสอบฐานข้อมูล...\n');

// ดูตารางทั้งหมด
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }

  console.log('📋 ตารางที่มีในฐานข้อมูล:');
  tables.forEach(table => {
    console.log(`  • ${table.name}`);
  });
  console.log('');

  // ดูข้อมูลในตาราง players
  db.all('SELECT * FROM players ORDER BY wins DESC LIMIT 5', (err, players) => {
    if (err) {
      console.error('❌ Error reading players:', err);
      return;
    }

    console.log('👥 ผู้เล่นในระบบ:');
    if (players.length === 0) {
      console.log('  (ยังไม่มีผู้เล่น)');
    } else {
      players.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.name} - ชนะ: ${player.wins}, พยายามทั้งหมด: ${player.total_attempts}, สถิติดีที่สุด: ${player.best_attempts || 'N/A'}`);
      });
    }
    console.log('');

    // ดูข้อมูลในตาราง games
    db.all('SELECT * FROM games ORDER BY created_at DESC LIMIT 5', (err, games) => {
      if (err) {
        console.error('❌ Error reading games:', err);
        return;
      }

      console.log('🎮 ประวัติการเล่นล่าสุด:');
      if (games.length === 0) {
        console.log('  (ยังไม่มีประวัติการเล่น)');
      } else {
        games.forEach((game, index) => {
          const guesses = JSON.parse(game.guesses || '[]');
          console.log(`  ${index + 1}. ${game.player_name} - เลขลับ: ${game.secret_number}, พยายาม: ${game.attempts}, ผล: ${game.result}`);
          console.log(`     ทาย: [${guesses.join(', ')}]`);
        });
      }

      db.close();
      console.log('\n✅ ตรวจสอบฐานข้อมูลเสร็จสิ้น');
    });
  });
});