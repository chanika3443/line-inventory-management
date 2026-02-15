/**
 * Setup Script - Initialize Google Sheets structure
 * Run this once to set up the spreadsheet with required sheets and headers
 */

/**
 * Initialize all sheets with headers
 * Run this function from the Apps Script editor to set up the spreadsheet
 */
function initializeSheets() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Products sheet
  createProductsSheet(spreadsheet);
  
  // Create Transactions sheet
  createTransactionsSheet(spreadsheet);
  
  // Create Settings sheet
  createSettingsSheet(spreadsheet);
  
  SpreadsheetApp.getUi().alert('การตั้งค่าเสร็จสมบูรณ์! Sheets ถูกสร้างเรียบร้อยแล้ว');
}

/**
 * Create Products sheet with headers
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 */
function createProductsSheet(spreadsheet) {
  var sheetName = 'Products';
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // Define headers
  var headers = [
    'code',           // A: รหัสวัสดุ (unique)
    'name',           // B: ชื่อวัสดุ
    'unit',           // C: หน่วย
    'quantity',       // D: จำนวนคงเหลือ
    'lowStockThreshold', // E: จุดเตือนวัสดุใกล้หมด
    'category',       // F: หมวดหมู่
    'returnable',     // G: สามารถคืนได้ (TRUE/FALSE)
    'createdAt',      // H: วันที่สร้าง
    'updatedAt'       // I: วันที่แก้ไขล่าสุด
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4CAF50');
  headerRange.setFontColor('#FFFFFF');
  
  // Set column widths
  sheet.setColumnWidth(1, 100);  // code
  sheet.setColumnWidth(2, 200);  // name
  sheet.setColumnWidth(3, 80);   // unit
  sheet.setColumnWidth(4, 100);  // quantity
  sheet.setColumnWidth(5, 150);  // lowStockThreshold
  sheet.setColumnWidth(6, 150);  // category
  sheet.setColumnWidth(7, 100);  // returnable
  sheet.setColumnWidth(8, 150);  // createdAt
  sheet.setColumnWidth(9, 150);  // updatedAt
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('Products sheet created successfully');
}

/**
 * Create Transactions sheet with headers
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 */
function createTransactionsSheet(spreadsheet) {
  var sheetName = 'Transactions';
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // Define headers
  var headers = [
    'id',             // A: รหัสรายการ
    'timestamp',      // B: วันเวลาที่ทำรายการ
    'type',           // C: ประเภท (WITHDRAW/RECEIVE/EDIT/DELETE/CREATE)
    'productCode',    // D: รหัสวัสดุ
    'productName',    // E: ชื่อวัสดุ
    'quantity',       // F: จำนวนที่ทำรายการ
    'beforeQuantity', // G: จำนวนก่อนทำรายการ
    'afterQuantity',  // H: จำนวนหลังทำรายการ
    'userName',       // I: ชื่อผู้ทำรายการ
    'note'            // J: หมายเหตุ
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2196F3');
  headerRange.setFontColor('#FFFFFF');
  
  // Set column widths
  sheet.setColumnWidth(1, 180);  // id
  sheet.setColumnWidth(2, 150);  // timestamp
  sheet.setColumnWidth(3, 100);  // type
  sheet.setColumnWidth(4, 100);  // productCode
  sheet.setColumnWidth(5, 200);  // productName
  sheet.setColumnWidth(6, 100);  // quantity
  sheet.setColumnWidth(7, 120);  // beforeQuantity
  sheet.setColumnWidth(8, 120);  // afterQuantity
  sheet.setColumnWidth(9, 150);  // userName
  sheet.setColumnWidth(10, 200); // note
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('Transactions sheet created successfully');
}

/**
 * Create Settings sheet with headers and default values
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 */
function createSettingsSheet(spreadsheet) {
  var sheetName = 'Settings';
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // Define headers
  var headers = [
    'key',    // A: ชื่อการตั้งค่า
    'value'   // B: ค่า
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#FF9800');
  headerRange.setFontColor('#FFFFFF');
  
  // Set column widths
  sheet.setColumnWidth(1, 200);  // key
  sheet.setColumnWidth(2, 300);  // value
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add default settings if sheet is empty
  if (sheet.getLastRow() === 1) {
    var defaultSettings = [
      ['LINE_CHANNEL_ACCESS_TOKEN', ''],
      ['LIFF_ID', ''],
      ['DEFAULT_LOW_STOCK_THRESHOLD', '10'],
      ['COMPANY_NAME', 'บริษัท ตัวอย่าง จำกัด'],
      ['SYSTEM_VERSION', '1.0.0']
    ];
    
    sheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
  }
  
  Logger.log('Settings sheet created successfully');
}

/**
 * Add sample products for testing
 * Run this function to add sample data
 */
function addSampleProducts() {
  var sampleProducts = [
    {
      code: 'P001',
      name: 'กระดาษ A4',
      unit: 'รีม',
      quantity: 50,
      lowStockThreshold: 10,
      category: 'อุปกรณ์สำนักงาน',
      returnable: true
    },
    {
      code: 'P002',
      name: 'ปากกาลูกลื่น',
      unit: 'ด้าม',
      quantity: 100,
      lowStockThreshold: 20,
      category: 'อุปกรณ์สำนักงาน',
      returnable: true
    },
    {
      code: 'P003',
      name: 'แฟ้มเอกสาร',
      unit: 'แฟ้ม',
      quantity: 5,
      lowStockThreshold: 10,
      category: 'อุปกรณ์สำนักงาน',
      returnable: true
    },
    {
      code: 'P004',
      name: 'หมึกพิมพ์ HP',
      unit: 'ตลับ',
      quantity: 8,
      lowStockThreshold: 5,
      category: 'อุปกรณ์คอมพิวเตอร์',
      returnable: false
    },
    {
      code: 'P005',
      name: 'กาวแท่ง',
      unit: 'แท่ง',
      quantity: 30,
      lowStockThreshold: 10,
      category: 'อุปกรณ์สำนักงาน',
      returnable: true
    }
  ];
  
  sampleProducts.forEach(function(product) {
    product.userName = 'System';
    ProductService.addProduct(product);
  });
  
  SpreadsheetApp.getUi().alert('เพิ่มวัสดุตัวอย่างเรียบร้อยแล้ว ' + sampleProducts.length + ' รายการ');
}

/**
 * Add RETURNABLE column to existing Products sheet
 * Run this function to update existing sheet structure
 */
function addReturnableColumn() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('Products');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('ไม่พบ Sheet "Products"');
    return;
  }
  
  // Check if column G header is 'createdAt' (old structure)
  var headerG = sheet.getRange('G1').getValue();
  
  if (headerG === 'createdAt' || headerG === '') {
    // Insert new column at G (between category and createdAt)
    sheet.insertColumnAfter(6); // Insert after column F (category)
    
    // Set header for new column G
    sheet.getRange('G1').setValue('returnable');
    
    // Format header
    sheet.getRange('G1').setFontWeight('bold');
    sheet.getRange('G1').setBackground('#4CAF50');
    sheet.getRange('G1').setFontColor('#FFFFFF');
    
    // Set column width
    sheet.setColumnWidth(7, 100);
    
    // Set default value 'TRUE' for all existing products
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var defaultValues = [];
      for (var i = 2; i <= lastRow; i++) {
        defaultValues.push(['TRUE']);
      }
      sheet.getRange(2, 7, defaultValues.length, 1).setValues(defaultValues);
    }
    
    SpreadsheetApp.getUi().alert('เพิ่ม column "returnable" เรียบร้อยแล้ว!\n\nวัสดุทั้งหมดถูกตั้งค่าเป็น "สามารถคืนได้" (TRUE)\nคุณสามารถแก้ไขได้ในหน้าจัดการวัสดุ');
  } else if (headerG === 'returnable') {
    SpreadsheetApp.getUi().alert('Column "returnable" มีอยู่แล้ว ไม่ต้องเพิ่มใหม่');
  } else {
    SpreadsheetApp.getUi().alert('โครงสร้าง Sheet ไม่ตรงกับที่คาดไว้\nกรุณาตรวจสอบ column headers');
  }
}

/**
 * Clear all data (keep headers)
 * Use with caution!
 */
function clearAllData() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'ยืนยันการลบข้อมูล',
    'คุณต้องการลบข้อมูลทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    SheetService.clearData(SheetService.SHEETS.PRODUCTS);
    SheetService.clearData(SheetService.SHEETS.TRANSACTIONS);
    ui.alert('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว');
  }
}

/**
 * Create custom menu in Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 ระบบคลังวัสดุ')
    .addItem('🔧 ตั้งค่าระบบ (สร้าง Sheets)', 'initializeSheets')
    .addItem('➕ เพิ่ม Column "สามารถคืนได้"', 'addReturnableColumn')
    .addItem('📝 เพิ่มวัสดุตัวอย่าง', 'addSampleProducts')
    .addSeparator()
    .addItem('🗑️ ลบข้อมูลทั้งหมด', 'clearAllData')
    .addToUi();
}

/**
 * Get Web App URL
 * Run this after deploying to get the URL
 */
function getWebAppUrl() {
  var url = ScriptApp.getService().getUrl();
  Logger.log('Web App URL: ' + url);
  SpreadsheetApp.getUi().alert('Web App URL:\n\n' + url);
}
