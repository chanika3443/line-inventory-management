# LINE Inventory Management - React Version

ระบบจัดการคลังวัสดุผ่าน LINE LIFF (React + GitHub Pages)

## 🎯 Features

- ✅ เบิกวัสดุ (Withdraw)
- ✅ รับเข้าวัสดุ (Receive)
- ✅ คืนวัสดุ (Return)
- ✅ จัดการวัสดุ (Products Management)
- ✅ ภาพรวมคลัง (Dashboard)
- ✅ รายงาน (Reports)
- ✅ ประวัติการทำรายการ (Transaction Logs)
- ✅ แจ้งเตือนสต็อกต่ำ (Low Stock Alert)
- ✅ Haptic Feedback (การสั่นตอบกลับ)
- ✅ Pull-to-Refresh (ดึงเพื่อรีเฟรช)
- ✅ Skeleton Loading (แสดงโครงสร้างขณะโหลด)
- ✅ Auto Scroll to Top (เลื่อนขึ้นบนอัตโนมัติเมื่อเปลี่ยนหน้า)
- ✅ Optimized UI (ลดขนาด header/navbar, ฟอนต์ไทย)
- ✅ Docker Support (รองรับการ deploy ด้วย Docker)

## 🏗️ Architecture

### Hybrid Architecture
- **Read Operations**: Google Sheets API (เร็ว, ไม่ต้อง auth)
- **Write Operations**: Apps Script API (ปลอดภัย, มี auth)
- **Database**: Google Sheets
- **Frontend**: React + Vite
- **Hosting**: GitHub Pages
- **Authentication**: LINE LIFF

```
React App (GitHub Pages)
    ↓
    ├─→ Google Sheets API (Read)
    └─→ Apps Script API (Write)
            ↓
        Google Sheets (Database)
```

## 📋 Prerequisites

1. Google Account
2. LINE Developer Account
3. GitHub Account
4. Node.js 18+ และ npm

## 🚀 Setup

### 1. Clone Repository

```bash
git clone https://github.com/chanika3443/line-inventory-management.git
cd line-inventory-management/react-inventory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

สร้างไฟล์ `.env`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
VITE_LIFF_ID=your_liff_id_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

### 4. Setup Google API Key

ดูวิธีสร้าง Google API Key ได้ที่:
- [docs/GOOGLE-API-KEY-SETUP.md](./docs/GOOGLE-API-KEY-SETUP.md)

### 5. Setup Apps Script URL

1. เปิดไฟล์ `src/config/index.js`
2. แก้ไข `appsScript.url` ให้เป็น URL ของ Apps Script Web App ของคุณ

```javascript
appsScript: {
  url: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
}
```

### 6. Update Apps Script (เพิ่ม CORS Headers)

เปิดไฟล์ `src/Code.gs` ใน Apps Script และเพิ่ม CORS headers:

```javascript
function doPost(e) {
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  
  // Enable CORS
  output.setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io')
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // ... rest of your code
}

function doOptions(e) {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
```

### 7. Run Development Server

```bash
npm run dev
```

เปิด http://localhost:5173

## 📦 Deployment

### Option 1: GitHub Pages (แนะนำ)

#### 1. Setup GitHub Secrets

ไปที่ GitHub Repository Settings → Secrets and variables → Actions

เพิ่ม secrets:
- `VITE_LIFF_ID`
- `VITE_SPREADSHEET_ID`
- `VITE_GOOGLE_API_KEY`

#### 2. Push to GitHub

```bash
git add .
git commit -m "Deploy React inventory app"
git push origin main
```

#### 3. Enable GitHub Pages

1. ไปที่ Repository Settings → Pages
2. Source: GitHub Actions
3. รอ deployment เสร็จ (~2-3 นาที)

#### 4. Access Your App

https://chanika3443.github.io/line-inventory-management/

### Option 2: Docker Deployment

ดูรายละเอียดเพิ่มเติมใน [DOCKER.md](./DOCKER.md)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Google API Key Setup](./docs/GOOGLE-API-KEY-SETUP.md)
- [Docker Deployment Guide](./DOCKER.md)
- [Apps Script Setup](./apps-script/README.md)

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Routing**: React Router v6
- **Styling**: CSS (iOS-inspired) with Thai fonts (Sukhumvit Set, Sarabun, Prompt, Kanit)
- **API**: Google Sheets API (Read), Apps Script (Write)
- **Authentication**: LINE LIFF
- **Deployment**: GitHub Pages + GitHub Actions, Docker + Nginx
- **UX Features**: Haptic feedback, Pull-to-refresh, Skeleton loading

## 📱 Browser Support

- Chrome (recommended)
- Safari
- LINE In-App Browser

## 🔒 Security

- API Key restricted to specific domains
- Apps Script handles authentication
- No sensitive data in frontend code
- Environment variables via GitHub Secrets

## 🐛 Troubleshooting

### API Key Error
- ตรวจสอบว่า API Key ถูก restrict ให้ใช้กับ domain ที่ถูกต้อง
- ตรวจสอบว่าเปิดใช้งาน Google Sheets API แล้ว

### CORS Error
- ตรวจสอบว่าเพิ่ม CORS headers ใน Apps Script แล้ว
- ตรวจสอบว่า domain ตรงกับที่ตั้งค่าไว้

### LIFF Error
- ตรวจสอบ LIFF ID ว่าถูกต้อง
- ตรวจสอบ Endpoint URL ใน LINE Developers Console

## 📄 License

MIT

## 👤 Author

Chanika

## 🙏 Acknowledgments

- LINE LIFF SDK
- Google Sheets API
- React Team
