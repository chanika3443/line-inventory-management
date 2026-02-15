# Architecture Overview

## Hybrid Architecture (แนะนำ)

```
┌─────────────────┐
│   LINE LIFF     │
│   (React App)   │
│  GitHub Pages   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────────┐
│ Google Sheets   │  │ Apps Script API  │
│   API (Read)    │  │   (Write/Auth)   │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         └────────┬───────────┘
                  ▼
         ┌─────────────────┐
         │  Google Sheets  │
         │   (Database)    │
         └─────────────────┘
```

### ทำไมต้องใช้ Hybrid?

1. **Read Operations** → Google Sheets API (เร็ว, ไม่ต้อง auth)
   - ดูรายการวัสดุ
   - ดูประวัติ
   - ดู Dashboard

2. **Write Operations** → Apps Script API (ปลอดภัย, มี auth)
   - เพิ่ม/แก้ไข/ลบวัสดุ
   - เบิก/รับเข้า/คืนวัสดุ
   - บันทึกประวัติ

### ข้อดี:
- ✅ ไม่ต้องเปิดเผย credentials
- ✅ มี authentication/authorization
- ✅ สามารถทำ business logic ที่ซับซ้อน
- ✅ ใช้ Apps Script triggers ได้ (onEdit, time-based)
- ✅ ส่ง LINE notifications ได้

### ข้อเสีย:
- ⚠️ ต้องมี Apps Script backend (แต่มีอยู่แล้ว)
- ⚠️ Write operations ช้ากว่าเล็กน้อย

## Implementation

### 1. Apps Script API (Backend)

```javascript
// Code.gs
function doPost(e) {
  const data = JSON.parse(e.postData.contents)
  
  // Authentication
  if (!isAuthorized(data.userId)) {
    return createResponse({ error: 'Unauthorized' }, 401)
  }
  
  // Route to appropriate handler
  switch (data.action) {
    case 'addProduct':
      return handleAddProduct(data)
    case 'updateProduct':
      return handleUpdateProduct(data)
    case 'withdraw':
      return handleWithdraw(data)
    // ... other actions
  }
}

function doGet(e) {
  // Optional: Read operations can also go through Apps Script
  // But using Sheets API directly is faster
  const action = e.parameter.action
  
  switch (action) {
    case 'getProducts':
      return createResponse(ProductService.getAllProducts())
    // ... other read operations
  }
}
```

### 2. React Service Layer

```javascript
// src/services/apiService.js

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec'
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export const apiService = {
  // Read operations - Direct to Sheets API (fast)
  async getProducts() {
    const response = await fetch(
      \`\${SHEETS_API_URL}/\${SPREADSHEET_ID}/values/Products!A2:I?key=\${API_KEY}\`
    )
    return await response.json()
  },
  
  // Write operations - Through Apps Script (secure)
  async addProduct(product) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addProduct',
        userId: liff.getProfile().userId,
        data: product
      })
    })
    return await response.json()
  },
  
  async withdraw(productCode, quantity, userName) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'withdraw',
        userId: liff.getProfile().userId,
        productCode,
        quantity,
        userName
      })
    })
    return await response.json()
  }
}
```

## Alternative: Pure Client-Side (ไม่แนะนำ)

### แบบที่ 2: ใช้ Google OAuth 2.0

```javascript
// ต้อง implement OAuth flow
// ผู้ใช้ต้อง login ด้วย Google Account
// ซับซ้อนและไม่เหมาะกับ LINE LIFF
```

**ข้อเสีย**:
- ❌ ผู้ใช้ต้อง login Google (ไม่ใช่แค่ LINE)
- ❌ ซับซ้อนในการ implement
- ❌ UX ไม่ดี (ต้อง login 2 ครั้ง)

### แบบที่ 3: ใช้ Google Sheets เป็น Public + Form

```javascript
// ใช้ Google Forms API หรือ Web App
// แต่มีข้อจำกัดมาก
```

**ข้อเสีย**:
- ❌ ไม่มี authentication
- ❌ ใครก็แก้ไขได้
- ❌ ไม่ปลอดภัย

## Recommended Setup

### Step 1: Keep Existing Apps Script

ใช้ Apps Script ที่มีอยู่แล้วเป็น API backend:

```javascript
// Code.gs - เพิ่ม CORS headers
function doPost(e) {
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  
  // Enable CORS
  output.setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io')
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  
  // Handle request
  const data = JSON.parse(e.postData.contents)
  const result = handleRequest(data)
  
  output.setContent(JSON.stringify(result))
  return output
}

function doOptions(e) {
  // Handle preflight
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', 'https://chanika3443.github.io')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
```

### Step 2: React App Configuration

```javascript
// src/config/index.js
export const config = {
  // For READ operations
  sheetsApi: {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    spreadsheetId: '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8',
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY
  },
  
  // For WRITE operations
  appsScript: {
    url: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
  },
  
  // LINE LIFF
  liff: {
    id: '2008893142-t04JvNpe'
  }
}
```

### Step 3: Service Layer

```javascript
// src/services/dataService.js
export const dataService = {
  // Fast reads from Sheets API
  async getProducts() {
    const url = \`\${config.sheetsApi.baseUrl}/\${config.sheetsApi.spreadsheetId}/values/Products!A2:I?key=\${config.sheetsApi.apiKey}\`
    const response = await fetch(url)
    const data = await response.json()
    return data.values.map(rowToProduct)
  },
  
  // Secure writes through Apps Script
  async addProduct(product) {
    const response = await fetch(config.appsScript.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addProduct',
        userId: await liff.getProfile().userId,
        data: product
      })
    })
    return await response.json()
  }
}
```

## Performance Comparison

| Operation | Sheets API | Apps Script | Hybrid |
|-----------|------------|-------------|--------|
| Read Products | 200ms ⚡ | 500ms | 200ms ⚡ |
| Write Product | ❌ No Auth | 800ms ✅ | 800ms ✅ |
| Security | ⚠️ API Key | ✅ Full Auth | ✅ Full Auth |
| Complexity | Low | Medium | Medium |

## Conclusion

**แนะนำใช้ Hybrid Architecture**:
- Read จาก Sheets API (เร็ว)
- Write ผ่าน Apps Script (ปลอดภัย)
- ได้ทั้งความเร็วและความปลอดภัย
- ใช้ Apps Script ที่มีอยู่แล้ว (ไม่ต้องสร้างใหม่)

## Migration Path

1. ✅ Deploy React app to GitHub Pages
2. ✅ Use Sheets API for read operations
3. ✅ Keep Apps Script for write operations
4. ✅ Update Apps Script to add CORS headers
5. ✅ Test all features
6. ✅ Monitor performance and errors
