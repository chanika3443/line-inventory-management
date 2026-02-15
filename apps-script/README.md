# Apps Script Deployment Guide

## วิธี Deploy Apps Script เพื่อให้ระบบเขียนข้อมูลลง Google Sheets

### ขั้นตอนที่ 1: สร้าง Apps Script Project

1. เปิด Google Sheets ของคุณ: https://docs.google.com/spreadsheets/d/13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8
2. คลิก **Extensions** > **Apps Script**
3. ลบโค้ดเดิมทั้งหมดออก
4. Copy โค้ดจากไฟล์ `Code.gs` ไปวางใน Apps Script Editor
5. ตั้งชื่อโปรเจค เช่น "LINE Inventory Backend"
6. คลิก **Save** (💾)

### ขั้นตอนที่ 2: Deploy เป็น Web App

1. คลิก **Deploy** > **New deployment**
2. คลิกไอคอน ⚙️ (Settings) ข้าง "Select type"
3. เลือก **Web app**
4. ตั้งค่าดังนี้:
   - **Description**: "Inventory API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. คลิก **Deploy**
6. คลิก **Authorize access**
7. เลือก Google Account ของคุณ
8. คลิก **Advanced** > **Go to [Project Name] (unsafe)**
9. คลิก **Allow**
10. Copy **Web app URL** ที่ได้ (จะมีหน้าตาประมาณนี้):
    ```
    https://script.google.com/macros/s/AKfycby.../exec
    ```

### ขั้นตอนที่ 3: อัพเดท Config

เปิดไฟล์ `.env` และเพิ่ม:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

หรือแก้ไขไฟล์ `src/config/index.js`:

```javascript
appsScript: {
  url: import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
}
```

### ขั้นตอนที่ 4: ทดสอบ

1. Restart dev server: `npm run dev`
2. ลองเบิกสินค้า/รับเข้า/คืน สินค้า
3. ตรวจสอบว่าข้อมูลใน Google Sheets เปลี่ยนแปลงหรือไม่

### หมายเหตุ

- ทุกครั้งที่แก้ไขโค้ด Apps Script ต้อง Deploy ใหม่ (New deployment)
- URL จะเปลี่ยนทุกครั้งที่ Deploy ใหม่
- ถ้าต้องการให้ URL เดิมใช้ได้ ให้ใช้ "Manage deployments" > Edit แทน

### การแก้ปัญหา

**ถ้า Deploy แล้วไม่ทำงาน:**
1. ตรวจสอบว่า SPREADSHEET_ID ใน Code.gs ถูกต้อง
2. ตรวจสอบว่า Sheet มีชื่อ "Products" และ "Transactions"
3. ดู Execution log ใน Apps Script: **Executions** tab
4. ตรวจสอบ Console ในเบราว์เซอร์ (F12)

**ถ้าเจอ CORS Error:**
- Apps Script จะจัดการ CORS ให้อัตโนมัติ
- ตรวจสอบว่า Deploy เป็น "Web app" และ "Who has access" เป็น "Anyone"
