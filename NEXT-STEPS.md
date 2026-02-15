# ขั้นตอนต่อไป

## ✅ สิ่งที่ทำเสร็จแล้ว

1. ✅ สร้างโครงสร้าง React project
2. ✅ ติดตั้ง dependencies
3. ✅ สร้าง Services (sheetsService, appsScriptService, liffService)
4. ✅ สร้าง Contexts (LiffContext, SheetsContext)
5. ✅ สร้าง Components (Layout, BottomNav, Loading, ErrorMessage)
6. ✅ สร้าง Pages ทั้งหมด (Home, Withdraw, Receive, Return, Dashboard, Reports, Logs, Products)
7. ✅ สร้าง Styles (global.css และ page-specific CSS)
8. ✅ ตั้งค่า GitHub Actions workflow
9. ✅ สร้าง Documentation

## 🔧 สิ่งที่ต้องทำต่อ

### 1. ติดตั้ง Dependencies

```bash
cd react-inventory
npm install
```

### 2. ตั้งค่า Google API Key

ทำตามขั้นตอนใน `docs/GOOGLE-API-KEY-SETUP.md`:

1. สร้าง API Key ใน Google Cloud Console
2. Restrict API Key:
   - HTTP referrers: `https://chanika3443.github.io/*`, `http://localhost:*`
   - API restrictions: เลือก "Google Sheets API" เท่านั้น
3. เพิ่มใน `.env`:
   ```env
   VITE_GOOGLE_API_KEY=AIzaSy...your-key-here...
   ```

### 3. Deploy Apps Script และเพิ่ม CORS

#### 3.1 เพิ่ม CORS Headers ใน `src/Code.gs`

เพิ่มโค้ดนี้ใน Apps Script:

```javascript
function doPost(e) {
  try {
    var data;
    
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createJsonResponse({ success: false, errorCode: 'E102', message: 'ไม่พบข้อมูล' });
    }
    
    // Handle API actions
    var result = handlePostAction(data);
    
    // Create response with CORS headers
    var output = ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers
    output.setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io');
    output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
    
  } catch (error) {
    var errorResponse = ContentService.createTextOutput(
      JSON.stringify({ success: false, errorCode: 'E102', message: 'คำขอไม่ถูกต้อง: ' + error.message })
    ).setMimeType(ContentService.MimeType.JSON);
    
    errorResponse.setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io');
    errorResponse.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    errorResponse.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// Handle OPTIONS request (CORS preflight)
function doOptions(e) {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

#### 3.2 Deploy Apps Script as Web App

1. ใน Apps Script Editor: คลิก **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (หรือ **Anyone with Google account**)
5. คลิก **Deploy**
6. คัดลอก **Web app URL** (จะเป็นรูปแบบ `https://script.google.com/macros/s/.../exec`)

#### 3.3 อัปเดต Config

เปิดไฟล์ `react-inventory/src/config/index.js` และแก้ไข:

```javascript
appsScript: {
  url: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec' // วาง URL ที่คัดลอกมา
}
```

### 4. ทดสอบ Local

```bash
npm run dev
```

เปิด http://localhost:5173 และทดสอบ:
- ✅ โหลดรายการวัสดุได้
- ✅ เบิกวัสดุได้
- ✅ รับเข้าวัสดุได้
- ✅ คืนวัสดุได้
- ✅ เพิ่ม/แก้ไข/ลบวัสดุได้

### 5. Setup GitHub Secrets

1. ไปที่: https://github.com/chanika3443/line-inventory-management/settings/secrets/actions
2. คลิก **New repository secret**
3. เพิ่ม secrets ทั้งหมด:

| Name | Value |
|------|-------|
| `VITE_LIFF_ID` | `2008893142-t04JvNpe` |
| `VITE_SPREADSHEET_ID` | `13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8` |
| `VITE_GOOGLE_API_KEY` | `AIzaSy...` (API Key ของคุณ) |

### 6. Push to GitHub

```bash
git add .
git commit -m "Complete React inventory app"
git push origin main
```

### 7. Enable GitHub Pages

1. ไปที่: https://github.com/chanika3443/line-inventory-management/settings/pages
2. Source: **GitHub Actions**
3. รอ deployment เสร็จ (~2-3 นาที)
4. ตรวจสอบที่ Actions tab: https://github.com/chanika3443/line-inventory-management/actions

### 8. ทดสอบ Production

เปิด: https://chanika3443.github.io/line-inventory-management/

ทดสอบทุก features:
- ✅ หน้าแรก
- ✅ เบิกวัสดุ
- ✅ รับเข้าวัสดุ
- ✅ คืนวัสดุ
- ✅ ภาพรวม
- ✅ รายงาน
- ✅ ประวัติ
- ✅ จัดการวัสดุ

### 9. Update LINE LIFF Endpoint (ถ้าต้องการ)

ถ้าต้องการให้ LINE LIFF เปิด React app แทน Apps Script:

1. ไปที่ LINE Developers Console
2. เลือก LIFF app ของคุณ
3. แก้ไข Endpoint URL เป็น: `https://chanika3443.github.io/line-inventory-management/`
4. บันทึก

## 🎉 เสร็จสิ้น!

ตอนนี้คุณมี:
- ✅ React app ที่ทำงานเหมือน Apps Script version เดิม 100%
- ✅ Deploy บน GitHub Pages
- ✅ ใช้ Google Sheets เป็น database
- ✅ ใช้ LINE LIFF สำหรับ authentication
- ✅ UI แบบ iOS สวยงาม
- ✅ ตัดขาดจาก `src/` เดิมทั้งหมด

## 📝 Notes

- React app อยู่ใน `react-inventory/` folder
- Apps Script เดิมอยู่ใน `src/` folder (ยังใช้งานได้ปกติ)
- ทั้ง 2 versions ใช้ Google Sheets เดียวกัน
- สามารถใช้ทั้ง 2 versions พร้อมกันได้

## 🐛 Troubleshooting

### ถ้าเจอ CORS Error:
- ตรวจสอบว่าเพิ่ม CORS headers ใน Apps Script แล้ว
- ตรวจสอบว่า domain ตรงกับที่ตั้งค่า

### ถ้าเจอ API Key Error:
- ตรวจสอบว่า API Key ถูก restrict ถูกต้อง
- ตรวจสอบว่าเปิดใช้งาน Google Sheets API แล้ว

### ถ้า GitHub Actions ไม่ทำงาน:
- ตรวจสอบว่าเพิ่ม Secrets ครบแล้ว
- ตรวจสอบ workflow file ที่ `.github/workflows/deploy.yml`

## 📞 Support

ถ้ามีปัญหาหรือคำถาม สามารถ:
1. เช็ค Documentation ใน `docs/` folder
2. ดู Troubleshooting section ใน README.md
3. เช็ค Console logs ใน browser (F12)
