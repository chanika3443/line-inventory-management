// Sheet 1: Material Inventory & Monthly Stock Count Sheet (ชีทใหม่สำหรับวัสดุและสต็อกรายเดือน)
const DEFAULT_MATERIAL_SPREADSHEET_ID = '1wjqnycMAHWVKQIzZLnyjLboOj5GhiinuB_zENg1Ttuo'

// Sheet 2: Non-Material Data & Log Sheet (ชีทเดิมสำหรับเก็บ Transactions, AuditLog, AllowedUsers, Users, Settings)
const DEFAULT_LOG_SPREADSHEET_ID = '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8'

const envSpreadsheetId = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_SPREADSHEET_ID || '').trim() : ''
const envLogSpreadsheetId = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_LOG_SPREADSHEET_ID || '').trim() : ''

// Guard: If VITE_SPREADSHEET_ID was set to the old sheet ID (from GitHub secrets set 7 months ago),
// do not accidentally use the log sheet as the material sheet!
const resolvedMaterialSheetId = (envSpreadsheetId && envSpreadsheetId !== DEFAULT_LOG_SPREADSHEET_ID)
  ? envSpreadsheetId
  : DEFAULT_MATERIAL_SPREADSHEET_ID

const resolvedLogSheetId = envLogSpreadsheetId || DEFAULT_LOG_SPREADSHEET_ID

export const config = {
  // Sheet 1: Material inventory (Google Sheet วัสดุและสต็อกรายเดือน)
  sheetsApi: {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    spreadsheetId: resolvedMaterialSheetId,
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY) || ''
  },

  // Sheet 2: Non-Material Sheet (ชีทเดิมสำหรับเก็บ Transactions, AuditLog, AllowedUsers, Users, Settings)
  logSheet: {
    spreadsheetId: resolvedLogSheetId
  },
  
  // For WRITE operations - Apps Script API
  appsScript: {
    url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APPS_SCRIPT_URL) || 'https://script.google.com/macros/s/AKfycbx485xIyUla9r78h6rxgwbr0JHlCt4skYjsXdxwPgHwjjwshVqhYI9OOVWY9fjVpYT0/exec'
  },
  
  // LINE LIFF
  liff: {
    id: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIFF_ID) || '2008893142-t04JvNpe'
  }
}
