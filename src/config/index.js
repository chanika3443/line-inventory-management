export const config = {
  // For READ operations - Google Sheets API
  sheetsApi: {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8',
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || ''
  },
  
  // For WRITE operations - Apps Script API
  appsScript: {
    url: import.meta.env.VITE_APPS_SCRIPT_URL || ''
  },
  
  // LINE LIFF
  liff: {
    id: import.meta.env.VITE_LIFF_ID || '2008893142-t04JvNpe'
  }
}
