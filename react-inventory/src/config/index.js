export const config = {
  liffId: import.meta.env.VITE_LIFF_ID || '2008893142-t04JvNpe',
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8',
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  lineChannelAccessToken: import.meta.env.VITE_LINE_CHANNEL_ACCESS_TOKEN || '',
  
  // Google Sheets API endpoints
  sheetsApiBase: 'https://sheets.googleapis.com/v4/spreadsheets',
  
  // Sheet names
  sheets: {
    products: 'Products',
    transactions: 'Transactions',
    settings: 'Settings'
  },
  
  // Column mappings
  columns: {
    products: {
      CODE: 0,
      NAME: 1,
      UNIT: 2,
      QUANTITY: 3,
      LOW_STOCK_THRESHOLD: 4,
      CATEGORY: 5,
      RETURNABLE: 6,
      CREATED_AT: 7,
      UPDATED_AT: 8
    },
    transactions: {
      ID: 0,
      TIMESTAMP: 1,
      TYPE: 2,
      PRODUCT_CODE: 3,
      PRODUCT_NAME: 4,
      QUANTITY: 5,
      BEFORE_QUANTITY: 6,
      AFTER_QUANTITY: 7,
      USER_NAME: 8,
      NOTE: 9
    }
  }
}
