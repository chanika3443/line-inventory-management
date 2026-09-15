export const config = {
  // For READ operations - Google Sheets API
  sheetsApi: {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    spreadsheetId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SPREADSHEET_ID) || '1wjqnycMAHWVKQIzZLnyjLboOj5GhiinuB_zENg1Ttuo',
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY) || ''
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
