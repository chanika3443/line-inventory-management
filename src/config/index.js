export const config = {
  // For READ operations - Google Sheets API
  sheetsApi: {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8',
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || ''
  },
  
  // For WRITE operations - Apps Script API
  // TODO: Deploy your Apps Script as Web App and paste the URL here
  appsScript: {
    url: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec'
  },
  
  // LINE LIFF
  liff: {
    id: import.meta.env.VITE_LIFF_ID || '2008893142-t04JvNpe'
  }
}
