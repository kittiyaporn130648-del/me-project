# 🎮 เกมทายเลขผ่าน Cloud

## 📋 ภาพรวมโปรเจค

เกมทายเลขออนไลน์ที่ผู้เล่นหลายคนสามารถเข้าเล่นพร้อมกันผ่านเว็บ ใช้ระบบ Cloud กลาง โดยมี Server ควบคุมเกม ฐานข้อมูล SQLite เก็บข้อมูล และระบบ Leaderboard แสดงอันดับผู้เล่น

---

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. เริ่มเซิร์ฟเวอร์
```bash
npm start
```

### 3. เปิดเบราว์เซอร์
```
http://localhost:3000
```

---

## 🧩 สถาปัตยกรรมระบบ

```
┌──────────────────────────────┐
│   Frontend (HTML/CSS/JS)     │
│  Multiple Players in Browser │
└──────────────┬───────────────┘
               │ HTTP API
┌──────────────▼───────────────┐
│   Node.js + Express Server   │
│  • Game Logic                │
│  • Session Management        │
│  • API Endpoints             │
└──────────────┬───────────────┘
               │ SQL
┌──────────────▼───────────────┐
│  SQLite Database (game.db)   │
│  • Players Stats             │
│  • Game History              │
│  • Sessions                  │
└──────────────────────────────┘
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/new-game` | สร้างเกมใหม่ |
| GET | `/api/status/:sessionId` | ดึงสถานะเกม |
| POST | `/api/guess` | ส่งตัวเลขที่ทาย |
| GET | `/api/leaderboard` | ดึง Leaderboard Top 10 |
| GET | `/api/history` | ดึงประวัติการเล่น |
| GET | `/api/player/:name` | ดึงสถิติผู้เล่น |

---

## 🎮 วิธีเล่น

1. **เข้าเว็บ** → `http://localhost:3000`
2. **ใส่ชื่อ** → กรอกชื่อผู้เล่นของคุณ
3. **ทายเลข** → พิมพ์เลข 1-100
4. **รอผลลัพธ์** → ระบบจะบอก "สูงเกินไป" หรือ "ต่ำเกินไป"
5. **ทายต่อไป** → จนกว่าทายถูก
6. **ดูผลลัพธ์** → เช็ค Leaderboard และประวัติ

---

## ✅ Features

### Core Game:
- ✅ Multiple simultaneous players
- ✅ Real-time validation
- ✅ Range: 1-100
- ✅ Error handling & input validation
- ✅ Winner announcement

### Database:
- ✅ Player statistics (wins, attempts, best)
- ✅ Game history tracking
- ✅ Session management
- ✅ SQLite (lightweight, no setup)

### UI/UX:
- ✅ 3-screen interface (Setup, Game, Results)
- ✅ Active players display
- ✅ Attempt counter
- ✅ History of guesses
- ✅ Dark modern theme with emojis
- ✅ Responsive design (mobile-friendly)
- ✅ Thai language support

### Real-time:
- ✅ Live player updates every 2 seconds
- ✅ Leaderboard tracking
- ✅ Instant feedback

---

## 📁 โครงสร้าง Folder

```
Me-project/
├── server.js           ← Backend Server
├── package.json        ← Dependencies  
├── game.db             ← SQLite Database (Auto-created)
└── public/
    ├── index.html      ← Frontend HTML
    ├── style.css       ← Styling
    └── script.js       ← Game Logic
```

---

## 🔧 ไฟล์สำคัญ

### `server.js`
- Express server บน port 3000
- Game logic (random 1-100)
- API endpoints
- SQLite integration
- Session management

### `public/index.html`  
- Setup Screen: ชื่อผู้เล่น
- Game Screen: ทายเลข
- Results Screen: Leaderboard

### `public/script.js`
- Fetch API calls
- UI screen management  
- Input validation
- Real-time updates

### `public/style.css`
- Dark theme
- Responsive layout
- Smooth animations

---

## 📊 Database Schema

### Players Table
```sql
id, name, wins, total_attempts, best_attempts, created_at
```

### Games Table  
```sql
id, player_name, secret_number, guesses (JSON), attempts, result, created_at
```

### Game Sessions Table
```sql
id, session_id, secret_number, players (JSON), winner, created_at, updated_at
```

---

## 🎯 ตัวอย่าง Response

### Create Game:
```json
{ "success": true, "session_id": "session_xxx" }
```

### Make Guess (Win):
```json
{
  "success": true,
  "result": "WIN",
  "message": "✅ Player ทายถูก! เลขที่ถูกต้องคือ 42 (ทายไป 5 ครั้ง)",
  "attempts": 5
}
```

### Leaderboard:
```json
{
  "success": true,
  "leaderboard": [
    { "name": "Player1", "wins": 5, "best_attempts": 3 },
    { "name": "Player2", "wins": 3, "best_attempts": 4 }
  ]
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect to localhost:3000 | ตรวจสอบ Server รันอยู่ (`npm start`) |
| npm install ไม่ได้ | อัปเดต Node.js ล่าสุด |
| Database ไม่บันทึก | ตรวจสอบ file permission |
| Port 3000 ใช้ไปแล้ว | เปลี่ยน PORT ในโค้ด หรือปิดแอป |

---

## 🎤 Presentation Summary

**สำหรับการนำเสนอ:**
> "โปรเจคนี้เป็นเกมทายเลขผ่าน Cloud ผู้เล่นสามารถเข้าเล่นพร้อมกันผ่านเว็บ มี Server กลางควบคุมเกม ฐานข้อมูล SQLite เก็บข้อมูล และระบบ Leaderboard แสดงอันดับผู้เล่น"

**Technology Stack:**
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js + Express
- Database: SQLite3
- API: REST

**Key Advantages:**
- ✅ ใช้งานง่าย  
- ✅ Cloud-based (ไม่ต้องติดตั้ง)  
- ✅ Real-time gameplay  
- ✅ Data persistent  
- ✅ Scalable  
- ✅ No registration needed  

---

## 📝 Notes

- Server runs on **localhost:3000** by default
- Database auto-creates on first run
- Player names must be unique
- Leaderboard shows top 10 players
- History shows 20 most recent games

---

**สร้างโดย:** Thitipon Muk  
**License:** MIT
- แสดง Leaderboard และประวัติการทาย

## วิธีใช้งาน

1. ติดตั้ง dependencies

```bash
npm install
```

2. เริ่ม Server

```bash
npm start
```

3. เปิดเว็บที่

```text
http://localhost:3000
```

## โครงสร้างระบบ

- `server.js` - Backend รับคำตอบและตรวจเลข
- `public/index.html` - หน้าเว็บหลัก
- `public/script.js` - เชื่อมหน้ากับ Server
- `public/style.css` - UI สวยงาม
- `guesses.json` - Database แบบ JSON เก็บข้อมูลการทาย

## ขยายผลงาน

- นำไปติดตั้งบน Linux / VPS / Raspberry Pi
- เปิดพอร์ตและใช้ IP /โดเมนให้เพื่อนเล่น
- ขยายเป็นเกมอื่น ๆ เช่น ทายคำศัพท์หรือหลายรอบ
