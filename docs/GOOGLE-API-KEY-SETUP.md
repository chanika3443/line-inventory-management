# วิธีสร้าง Google API Key

## ขั้นตอนที่ 1: เข้า Google Cloud Console

1. เปิดเบราว์เซอร์ไปที่: https://console.cloud.google.com/
2. Login ด้วย Google Account ของคุณ

## ขั้นตอนที่ 2: สร้างหรือเลือก Project

### ถ้ายังไม่มี Project:

1. คลิกที่ dropdown ด้านบน (ข้าง Google Cloud logo)
2. คลิก **"NEW PROJECT"**
3. ตั้งชื่อ Project: `LINE Inventory Management`
4. คลิก **"CREATE"**
5. รอสักครู่ให้ Project ถูกสร้าง

### ถ้ามี Project อยู่แล้ว:

1. คลิกที่ dropdown ด้านบน
2. เลือก Project ที่ต้องการใช้

## ขั้นตอนที่ 3: เปิดใช้งาน Google Sheets API

1. ไปที่เมนูด้านซ้าย → **"APIs & Services"** → **"Library"**
   
   หรือคลิกลิงก์นี้: https://console.cloud.google.com/apis/library

2. ค้นหา: `Google Sheets API`

3. คลิกที่ **"Google Sheets API"**

4. คลิกปุ่ม **"ENABLE"** (เปิดใช้งาน)

5. รอสักครู่ให้ API ถูกเปิดใช้งาน

## ขั้นตอนที่ 4: สร้าง API Key

1. ไปที่เมนูด้านซ้าย → **"APIs & Services"** → **"Credentials"**
   
   หรือคลิกลิงก์นี้: https://console.cloud.google.com/apis/credentials

2. คลิกปุ่ม **"+ CREATE CREDENTIALS"** ด้านบน

3. เลือก **"API key"**

4. API Key จะถูกสร้างขึ้นมา (เช่น: `AIzaSyD...`)

5. **คัดลอก API Key** ไว้ก่อน (จะใช้ในขั้นตอนถัดไป)

## ขั้นตอนที่ 5: จำกัดการใช้งาน API Key (สำคัญมาก!)

⚠️ **ห้ามข้ามขั้นตอนนี้!** มิเช่นนั้นใครก็ใช้ API Key ของคุณได้

### 5.1 คลิกที่ API Key ที่เพิ่งสร้าง

หรือคลิกไอคอน ✏️ (Edit) ข้างๆ API Key

### 5.2 ตั้งค่า Application restrictions

1. เลือก **"HTTP referrers (web sites)"**

2. คลิก **"ADD AN ITEM"**

3. เพิ่ม referrers ทั้งหมดนี้:

```
https://chanika3443.github.io/*
http://localhost:3000/*
http://localhost:5173/*
```

**อธิบาย**:
- `https://chanika3443.github.io/*` - สำหรับ production (GitHub Pages)
- `http://localhost:3000/*` - สำหรับ development (Vite default)
- `http://localhost:5173/*` - สำหรับ development (Vite alternative port)

### 5.3 ตั้งค่า API restrictions

1. เลือก **"Restrict key"**

2. คลิก dropdown **"Select APIs"**

3. เลือก **"Google Sheets API"** เท่านั้น

4. คลิก **"OK"**

### 5.4 บันทึก

คลิกปุ่ม **"SAVE"** ด้านล่าง

## ขั้นตอนที่ 6: ตั้งค่าใน React Project

### 6.1 สร้างไฟล์ .env

```bash
cd react-inventory
cp .env.example .env
```

### 6.2 แก้ไขไฟล์ .env

เปิดไฟล์ `.env` และใส่ API Key:

```env
VITE_LIFF_ID=2008893142-t04JvNpe
VITE_SPREADSHEET_ID=13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8
VITE_GOOGLE_API_KEY=AIzaSyD...your-api-key-here...
```

**⚠️ สำคัญ**: 
- ห้าม commit ไฟล์ `.env` ขึ้น GitHub
- ตรวจสอบว่า `.env` อยู่ใน `.gitignore` แล้ว

## ขั้นตอนที่ 7: ตั้งค่าใน GitHub Secrets (สำหรับ Deployment)

1. ไปที่ GitHub repository: https://github.com/chanika3443/line-inventory-management

2. คลิก **Settings** → **Secrets and variables** → **Actions**

3. คลิก **"New repository secret"**

4. เพิ่ม secrets ทั้งหมดนี้:

| Name | Value |
|------|-------|
| `VITE_LIFF_ID` | `2008893142-t04JvNpe` |
| `VITE_SPREADSHEET_ID` | `13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8` |
| `VITE_GOOGLE_API_KEY` | `AIzaSyD...` (API Key ที่คัดลอกไว้) |

## ขั้นตอนที่ 8: ทดสอบ API Key

### 8.1 ทดสอบใน Browser

เปิด browser และลองเข้า URL นี้:

```
https://sheets.googleapis.com/v4/spreadsheets/13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8/values/Products!A1:I1?key=YOUR_API_KEY
```

**แทนที่ `YOUR_API_KEY`** ด้วย API Key ของคุณ

**ผลลัพธ์ที่ควรได้**:
```json
{
  "range": "Products!A1:I1",
  "majorDimension": "ROWS",
  "values": [
    ["code", "name", "unit", "quantity", "lowStockThreshold", "category", "returnable", "createdAt", "updatedAt"]
  ]
}
```

### 8.2 ทดสอบใน React App

```bash
npm run dev
```

เปิด http://localhost:3000 และดูว่าโหลดข้อมูลได้หรือไม่

## Troubleshooting

### ❌ Error: "API key not valid"

**สาเหตุ**: API Key ไม่ถูกต้องหรือยังไม่ได้เปิดใช้งาน

**แก้ไข**:
1. ตรวจสอบว่าคัดลอก API Key ถูกต้อง
2. ตรวจสอบว่าเปิดใช้งาน Google Sheets API แล้ว
3. รอ 1-2 นาทีให้ API Key active

### ❌ Error: "API key not valid. Please pass a valid API key."

**สาเหตุ**: API Key ถูก restrict ไม่ให้ใช้จาก domain นี้

**แก้ไข**:
1. ไปที่ Google Cloud Console → Credentials
2. Edit API Key
3. ตรวจสอบ HTTP referrers ว่าเพิ่ม domain ถูกต้อง
4. บันทึกและรอ 1-2 นาที

### ❌ Error: "The caller does not have permission"

**สาเหตุ**: Google Sheet ไม่ได้แชร์เป็น public

**แก้ไข**:
1. เปิด Google Sheet
2. คลิก **Share** → **Change to anyone with the link**
3. ตั้งเป็น **Viewer**
4. คลิก **Done**

### ❌ Error: "Quota exceeded"

**สาเหตุ**: เรียก API เกิน quota (100 requests/100 seconds/user)

**แก้ไข**:
1. รอ 100 วินาที
2. ใช้ caching เพื่อลด API calls
3. ใช้ batch requests

### ❌ CORS Error

**สาเหตุ**: Browser block request เพราะ CORS policy

**แก้ไข**:
1. ตรวจสอบว่าใช้ Sheets API URL ที่ถูกต้อง
2. ตรวจสอบว่า API Key ถูก restrict ให้ใช้กับ domain ที่ถูกต้อง
3. ห้ามใช้ direct Google Sheets URL (ต้องใช้ API endpoint)

## ข้อมูลเพิ่มเติม

### API Quota Limits

- **Read requests**: 100 requests per 100 seconds per user
- **Write requests**: 100 requests per 100 seconds per user

### Best Practices

1. **Cache data**: เก็บข้อมูลใน localStorage หรือ context
2. **Batch requests**: รวม requests หลายๆ อันเป็นอันเดียว
3. **Debounce**: ใช้ debounce สำหรับ search/filter
4. **Error handling**: จัดการ error ให้ดี แสดงข้อความที่เข้าใจง่าย

### Security Checklist

- ✅ API Key ถูก restrict ด้วย HTTP referrers
- ✅ API Key ถูก restrict ให้ใช้เฉพาะ Sheets API
- ✅ ไฟล์ `.env` อยู่ใน `.gitignore`
- ✅ ไม่ commit API Key ขึ้น GitHub
- ✅ ใช้ GitHub Secrets สำหรับ deployment
- ✅ Google Sheet แชร์เป็น Viewer only (ไม่ใช่ Editor)

## ลิงก์ที่เป็นประโยชน์

- Google Cloud Console: https://console.cloud.google.com/
- Google Sheets API Documentation: https://developers.google.com/sheets/api
- API Key Best Practices: https://cloud.google.com/docs/authentication/api-keys

## สรุป

1. ✅ สร้าง Project ใน Google Cloud Console
2. ✅ เปิดใช้งาน Google Sheets API
3. ✅ สร้าง API Key
4. ✅ Restrict API Key (HTTP referrers + API restrictions)
5. ✅ เพิ่ม API Key ใน `.env`
6. ✅ เพิ่ม API Key ใน GitHub Secrets
7. ✅ ทดสอบว่าใช้งานได้

ตอนนี้คุณพร้อมใช้งาน Google Sheets API แล้ว! 🎉
