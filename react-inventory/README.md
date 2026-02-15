# LINE Inventory Management System (React Version)

ระบบจัดการคลังวัสดุผ่าน LINE LIFF ด้วย React + GitHub Pages

## 🚀 Features

- ✅ รับเข้าวัสดุ
- ✅ เบิกวัสดุ
- ✅ คืนวัสดุ
- ✅ จัดการวัสดุ (เพิ่ม/แก้ไข/ลบ)
- ✅ ดูประวัติการทำรายการ
- ✅ รายงานและสถิติ
- ✅ Dashboard ภาพรวม
- ✅ แจ้งเตือนวัสดุใกล้หมด

## 📋 Prerequisites

- Node.js 18+ 
- Google Account (สำหรับ Google Sheets API)
- LINE Developers Account (สำหรับ LIFF)
- GitHub Account (สำหรับ deployment)

## 🛠️ Setup Instructions

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/chanika3443/line-inventory-management.git
cd line-inventory-management/react-inventory
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Setup Google Sheets API

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน **Google Sheets API**
4. สร้าง API Key:
   - ไปที่ Credentials → Create Credentials → API Key
   - จำกัดการใช้งาน API Key (Restrict Key):
     - Application restrictions: HTTP referrers
     - Website restrictions: เพิ่ม `https://chanika3443.github.io/*`
     - API restrictions: เลือก Google Sheets API
5. คัดลอก API Key

### 4. Setup Google Sheets

1. เปิด Google Sheet ที่มีอยู่: `13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8`
2. ตั้งค่าการแชร์:
   - คลิก Share → Anyone with the link → Viewer
   - หรือใช้คำสั่ง: File → Share → Publish to web → Entire Document → Publish
3. ตรวจสอบว่ามี Sheets ดังนี้:
   - `Products` (รายการวัสดุ)
   - `Transactions` (ประวัติการทำรายการ)
   - `Settings` (การตั้งค่า)

### 5. Configure Environment Variables

สร้างไฟล์ \`.env\` จาก \`.env.example\`:

\`\`\`bash
cp .env.example .env
\`\`\`

แก้ไขไฟล์ \`.env\`:

\`\`\`env
VITE_LIFF_ID=2008893142-t04JvNpe
VITE_SPREADSHEET_ID=13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8
VITE_GOOGLE_API_KEY=your_google_api_key_here
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

เปิดเบราว์เซอร์ที่ http://localhost:3000

## 🚢 Deployment to GitHub Pages

### Option 1: Manual Deployment

\`\`\`bash
npm run deploy
\`\`\`

### Option 2: Automatic Deployment (GitHub Actions)

1. ไปที่ GitHub Repository Settings
2. เลือก Secrets and variables → Actions
3. เพิ่ม Repository secrets:
   - \`VITE_LIFF_ID\`: 2008893142-t04JvNpe
   - \`VITE_SPREADSHEET_ID\`: 13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8
   - \`VITE_GOOGLE_API_KEY\`: your_google_api_key
4. Push code ไปที่ main branch
5. GitHub Actions จะ build และ deploy อัตโนมัติ

### Enable GitHub Pages

1. ไปที่ Repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages / (root)
4. Save

เว็บไซต์จะพร้อมใช้งานที่: https://chanika3443.github.io/line-inventory-management/

## 📱 LINE LIFF Configuration

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. เลือก Provider และ Channel ของคุณ
3. ไปที่ LIFF tab
4. แก้ไข LIFF app:
   - Endpoint URL: \`https://chanika3443.github.io/line-inventory-management/\`
   - Scope: profile, openid
   - Module mode: OFF

## 🏗️ Project Structure

\`\`\`
react-inventory/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── public/                     # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── Layout.jsx
│   │   ├── BottomNav.jsx
│   │   └── ...
│   ├── contexts/              # React contexts
│   │   ├── LiffContext.jsx
│   │   └── SheetsContext.jsx
│   ├── pages/                 # Page components
│   │   ├── Home.jsx
│   │   ├── Withdraw.jsx
│   │   ├── Receive.jsx
│   │   ├── Return.jsx
│   │   └── ...
│   ├── services/              # API services
│   │   ├── sheetsService.js
│   │   └── liffService.js
│   ├── utils/                 # Utility functions
│   ├── styles/                # CSS files
│   ├── config/                # Configuration
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
\`\`\`

## 🔧 Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run deploy\` - Deploy to GitHub Pages

## 📝 Notes

### ข้อแตกต่างจาก Google Apps Script Version

1. **ไม่ต้อง Deploy Apps Script**: ใช้ Google Sheets API โดยตรง
2. **Faster**: React SPA โหลดเร็วกว่า
3. **Better UX**: Client-side routing ไม่ต้อง reload หน้า
4. **Modern Stack**: React + Vite
5. **Free Hosting**: GitHub Pages ฟรี

### Limitations

- Google Sheets API มี quota limit (อ่าน: 100 requests/100 seconds/user)
- ต้องตั้งค่า CORS ใน Google Sheets
- ไม่สามารถใช้ Apps Script triggers (เช่น onEdit)

## 🐛 Troubleshooting

### API Key ไม่ทำงาน
- ตรวจสอบว่า API Key ถูก restrict ให้ใช้กับ domain ที่ถูกต้อง
- ตรวจสอบว่าเปิดใช้งาน Google Sheets API แล้ว

### CORS Error
- ตรวจสอบว่า Google Sheet ถูกแชร์เป็น public
- ใช้ Google Sheets API แทนการเรียก URL โดยตรง

### LIFF ไม่ทำงาน
- ตรวจสอบ Endpoint URL ใน LINE Developers Console
- ตรวจสอบว่า LIFF ID ถูกต้อง

## 📄 License

MIT

## 👤 Author

Chanika
