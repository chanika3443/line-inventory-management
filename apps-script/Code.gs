/**
 * LINE Inventory Management - Apps Script Backend
 * Handles WRITE operations to the real Google Sheet
 * Works with monthly stock count tabs
 */

const SPREADSHEET_ID = '1wjqnycMAHWVKQIzZLnyjLboOj5GhiinuB_zENg1Ttuo';

// Tab name prefix
const TAB_PREFIX = 'Display Warehouse Stocks of Material (For Monthly Count) ';

// Month names for tab matching
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Column indices (1-based for sheet operations)
const COL = {
  NO: 1,           // A
  CODE: 2,         // B
  DESCRIPTION: 3,  // C
  PLANT: 4,        // D
  BATCH: 5,        // E
  UNIT: 6,         // F
  WD_DATE: 7,      // G - เบิก วันที่
  WD_QTY: 8,       // H - เบิก จำนวน
  MAIN_PREV: 9,    // I - สต๊อกใหญ่ เดิม
  MAIN_IN: 10,     // J - สต๊อกใหญ่ รับเข้า
  MAIN_OUT: 11,    // K - สต๊อกใหญ่ ออก
  MAIN_REM: 12,    // L - สต๊อกใหญ่ คงเหลือ
  MAIN_SYS: 13,    // M - สต๊อกใหญ่ ระบบ
  MAIN_EXP: 14,    // N - Exp.สต๊อกใหญ่
  SUB_EXP: 15,     // O - Exp.สต๊อกเล็ก
  SUB_PREV: 16,    // P - สต๊อกเล็ก เดิม
  SUB_IN: 17,      // Q - สต๊อกเล็ก รับเข้า
  SUB_REM: 18,     // R - สต๊อกเล็ก คงเหลือ
  PRICE: 19,       // S - ราคา
};

// Number of header rows (title + main header + sub-header)
const HEADER_ROWS = 3;

// ========================================
// Core Functions
// ========================================

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;
    let result;
    if (action === 'getAvailableTabs') {
      result = getAvailableTabsAction();
    } else if (action === 'getMaterials') {
      result = getMaterialsAction(e.parameter.tabName);
    } else if (action === 'getTransactionLogs') {
      result = getTransactionLogsAction();
    } else {
      result = {
        success: true,
        message: 'Apps Script is running. Use POST for operations or GET with action.'
      };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const deviceInfo = data.deviceInfo || '';

    let result;
    switch (action) {
      case 'withdraw':
        result = withdraw(data.materialCode, data.quantity, data.userName, data.note || '', data.stockType, data.batch, data.sheetRow, data.tabName, deviceInfo);
        break;
      case 'receive':
        result = receive(data.materialCode, data.quantity, data.userName, data.stockType, data.batch, data.sheetRow, data.tabName, deviceInfo);
        break;
      case 'return':
        result = returnMaterial(data.materialCode, data.quantity, data.userName, data.note || '', data.stockType, data.batch, data.sheetRow, data.tabName, deviceInfo);
        break;
      case 'addMaterial':
        result = addMaterial(data.material, data.tabName, deviceInfo);
        break;
      case 'updateMaterial':
        result = updateMaterial(data.sheetRow, data.updates, data.tabName, deviceInfo);
        break;
      case 'deleteMaterial':
        result = deleteMaterial(data.sheetRow, data.tabName, data.userName, deviceInfo);
        break;
      case 'batchWithdraw':
        result = batchWithdraw(data.items, data.userName, data.tabName, deviceInfo);
        break;
      case 'getAvailableTabs':
        result = getAvailableTabsAction();
        break;
      case 'getMaterials':
        result = getMaterialsAction(data.tabName);
        break;
      case 'getTransactionLogs':
        result = getTransactionLogsAction();
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAvailableTabsAction() {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const tabs = [];
    const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{2,4})/i;
    for (let i = 0; i < sheets.length; i++) {
      const title = sheets[i].getName();
      if (monthRegex.test(title)) {
        tabs.push({ title: title, sheetId: sheets[i].getSheetId(), index: i });
      }
    }
    tabs.sort((a, b) => b.index - a.index);
    return { success: true, tabs: tabs };
  } catch (error) {
    return { success: false, message: error.toString(), tabs: [] };
  }
}

function getMaterialsAction(tabName) {
  try {
    const { sheet, tabName: resolvedTab } = getSheetByTab(tabName);
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(HEADER_ROWS);
    return { success: true, rows: rows, tabName: resolvedTab };
  } catch (error) {
    return { success: false, message: error.toString(), rows: [] };
  }
}

function getTransactionLogsAction() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Transactions');
    if (!sheet) return { success: true, rows: [] };
    const data = sheet.getDataRange().getValues();
    return { success: true, rows: data.slice(1) };
  } catch (error) {
    return { success: false, message: error.toString(), rows: [] };
  }
}

// ========================================
// Helper Functions
// ========================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Get the current month's sheet tab
 */
function getCurrentMonthSheet() {
  const now = new Date();
  const monthName = MONTHS[now.getMonth()];
  const yy = String(now.getFullYear()).slice(-2);
  const primaryTab = monthName + yy; // e.g. "September26"

  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(primaryTab);
  let tabName = primaryTab;

  if (!sheet) {
    // Try with full year (e.g. "September2026")
    const fullYearTab = monthName + now.getFullYear();
    sheet = ss.getSheetByName(fullYearTab);
    if (sheet) tabName = fullYearTab;
  }

  if (!sheet) {
    // Try prefixed name
    const prefixedTab = TAB_PREFIX + monthName + ' ' + now.getFullYear();
    sheet = ss.getSheetByName(prefixedTab);
    if (sheet) tabName = prefixedTab;
  }

  if (!sheet) {
    // Search any tab matching month
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const name = sheets[i].getName();
      if (name.toLowerCase().indexOf(monthName.toLowerCase()) !== -1) {
        sheet = sheets[i];
        tabName = name;
        break;
      }
    }
  }

  if (!sheet) {
    // Ultimate fallback: first sheet
    sheet = ss.getSheets()[0];
    tabName = sheet ? sheet.getName() : primaryTab;
  }

  return { sheet, tabName };
}

/**
 * Get sheet by tab name (flexible matching)
 */
function getSheetByTab(tabName) {
  if (!tabName) {
    return getCurrentMonthSheet();
  }
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  if (sheet) {
    return { sheet, tabName };
  }

  // Case-insensitive or trimmed match
  const sheets = ss.getSheets();
  const lowerSearch = tabName.trim().toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().trim();
    if (sName.toLowerCase() === lowerSearch) {
      return { sheet: sheets[i], tabName: sName };
    }
  }

  // If still not found, check if it matches a month name
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().trim();
    for (let m = 0; m < MONTHS.length; m++) {
      if (lowerSearch.indexOf(MONTHS[m].toLowerCase()) !== -1 && sName.toLowerCase().indexOf(MONTHS[m].toLowerCase()) !== -1) {
        return { sheet: sheets[i], tabName: sName };
      }
    }
  }

  // Fallback to current month sheet
  return getCurrentMonthSheet();
}

/**
 * Find material row by code and optionally batch
 * Returns 1-based row number or -1 if not found
 */
function findMaterialRow(sheet, materialCode, batch) {
  const data = sheet.getDataRange().getValues();

  for (let i = HEADER_ROWS; i < data.length; i++) {
    const rowCode = String(data[i][COL.CODE - 1] || '').trim();
    const rowBatch = String(data[i][COL.BATCH - 1] || '').trim();

    if (rowCode === materialCode) {
      if (!batch || rowBatch === batch) {
        return i + 1; // 1-based row number
      }
    }
  }
  return -1;
}

/**
 * Get material data at a specific row
 */
function getMaterialAtRow(sheet, row) {
  const data = sheet.getRange(row, 1, 1, 19).getValues()[0];
  return {
    no: data[COL.NO - 1],
    materialCode: String(data[COL.CODE - 1] || '').trim(),
    description: String(data[COL.DESCRIPTION - 1] || '').trim(),
    plant: String(data[COL.PLANT - 1] || '').trim(),
    batch: String(data[COL.BATCH - 1] || '').trim(),
    unit: String(data[COL.UNIT - 1] || '').trim(),
    withdrawDate: String(data[COL.WD_DATE - 1] || '').trim(),
    withdrawQty: parseInt(data[COL.WD_QTY - 1]) || 0,
    mainStock: {
      previous: parseInt(data[COL.MAIN_PREV - 1]) || 0,
      received: parseInt(data[COL.MAIN_IN - 1]) || 0,
      issued: parseInt(data[COL.MAIN_OUT - 1]) || 0,
      remaining: parseInt(data[COL.MAIN_REM - 1]) || 0,
      system: parseInt(data[COL.MAIN_SYS - 1]) || 0,
    },
    mainStockExpiry: String(data[COL.MAIN_EXP - 1] || '').trim(),
    subStockExpiry: String(data[COL.SUB_EXP - 1] || '').trim(),
    subStock: {
      previous: parseInt(data[COL.SUB_PREV - 1]) || 0,
      received: parseInt(data[COL.SUB_IN - 1]) || 0,
      remaining: parseInt(data[COL.SUB_REM - 1]) || 0,
    },
    price: String(data[COL.PRICE - 1] || '').trim(),
  };
}

/**
 * Add transaction log to the Transactions sheet
 */
function addTransaction(type, materialCode, description, quantity, stockType, batch, userName, note) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');

  // Create Transactions sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Transactions');
    sheet.appendRow([
      'ID', 'Timestamp', 'Type', 'MaterialCode', 'Description',
      'Quantity', 'StockType', 'Batch', 'UserName', 'Note'
    ]);
  }

  const timestamp = new Date();
  const id = 'TXN' + timestamp.getTime();

  sheet.appendRow([
    id, timestamp, type, materialCode, description,
    quantity, stockType, batch, userName, note
  ]);
}

/**
 * Add audit log entry
 */
function addAuditLog(action, details, userName, deviceInfo) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('AuditLog');
    if (!sheet) {
      sheet = ss.insertSheet('AuditLog');
      sheet.appendRow(['Timestamp', 'Action', 'Details', 'UserName', 'Device Info']);
    }
    sheet.appendRow([new Date(), action, details, userName, deviceInfo || '']);
  } catch (error) {
    // Silently fail
    console.error('Audit log error:', error);
  }
}

// ========================================
// Write Operations
// ========================================

/**
 * Withdraw material
 * @param {string} materialCode
 * @param {number} quantity
 * @param {string} userName
 * @param {string} note
 * @param {string} stockType - 'main' or 'sub'
 * @param {string} batch - specific batch (optional)
 * @param {number} sheetRow - 1-based row in sheet (optional, for direct targeting)
 * @param {string} tabName - tab name (optional)
 * @param {string} deviceInfo
 */
function withdraw(materialCode, quantity, userName, note, stockType, batch, sheetRow, tabName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);
    quantity = parseInt(quantity);

    // Find the row
    let row = sheetRow;
    if (!row) {
      row = findMaterialRow(sheet, materialCode, batch);
    }
    if (row === -1 || !row) {
      return { success: false, message: 'ไม่พบวัสดุ: ' + materialCode };
    }

    const material = getMaterialAtRow(sheet, row);

    if (stockType === 'sub') {
      // Withdraw from sub stock (สต๊อกเล็ก)
      const currentRemaining = material.subStock.remaining;
      if (currentRemaining < quantity) {
        return { success: false, message: 'สต๊อกเล็กไม่เพียงพอ (คงเหลือ ' + currentRemaining + ')' };
      }
      const newRemaining = currentRemaining - quantity;
      sheet.getRange(row, COL.SUB_REM).setValue(newRemaining);
    } else {
      // Withdraw from main stock (สต๊อกใหญ่)
      const currentRemaining = material.mainStock.remaining;
      if (currentRemaining < quantity) {
        return { success: false, message: 'สต๊อกใหญ่ไม่เพียงพอ (คงเหลือ ' + currentRemaining + ')' };
      }
      const newIssued = material.mainStock.issued + quantity;
      const newRemaining = material.mainStock.previous + material.mainStock.received - newIssued;

      sheet.getRange(row, COL.MAIN_OUT).setValue(newIssued);
      sheet.getRange(row, COL.MAIN_REM).setValue(newRemaining);

      // Update withdraw info
      const now = new Date();
      const thaiMonth = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][now.getMonth()];
      const dateStr = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();

      // Append to existing withdraw date/qty
      const existingDate = material.withdrawDate;
      const existingQty = material.withdrawQty;
      if (existingDate) {
        sheet.getRange(row, COL.WD_DATE).setValue(existingDate + ', ' + dateStr);
        sheet.getRange(row, COL.WD_QTY).setValue(existingQty + quantity);
      } else {
        sheet.getRange(row, COL.WD_DATE).setValue(dateStr);
        sheet.getRange(row, COL.WD_QTY).setValue(quantity);
      }
    }

    // Transaction log
    addTransaction('เบิก', materialCode, material.description, quantity, stockType || 'main', material.batch, userName, note || 'เบิกวัสดุ');

    // Audit log
    addAuditLog(
      'WITHDRAW',
      'เบิก: ' + material.description + ' (' + materialCode + ') จำนวน ' + quantity + ' ' + material.unit + ' จาก' + (stockType === 'sub' ? 'สต๊อกเล็ก' : 'สต๊อกใหญ่') + ' | ' + (note || ''),
      userName,
      deviceInfo
    );

    return {
      success: true,
      message: 'เบิกวัสดุสำเร็จ',
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Receive material
 */
function receive(materialCode, quantity, userName, stockType, batch, sheetRow, tabName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);
    quantity = parseInt(quantity);

    let row = sheetRow;
    if (!row) {
      row = findMaterialRow(sheet, materialCode, batch);
    }
    if (row === -1 || !row) {
      return { success: false, message: 'ไม่พบวัสดุ: ' + materialCode };
    }

    const material = getMaterialAtRow(sheet, row);

    if (stockType === 'sub') {
      // Receive into sub stock
      const newReceived = material.subStock.received + quantity;
      const newRemaining = material.subStock.previous + newReceived;
      sheet.getRange(row, COL.SUB_IN).setValue(newReceived);
      sheet.getRange(row, COL.SUB_REM).setValue(newRemaining);
    } else {
      // Receive into main stock
      const newReceived = material.mainStock.received + quantity;
      const newRemaining = material.mainStock.previous + newReceived - material.mainStock.issued;
      sheet.getRange(row, COL.MAIN_IN).setValue(newReceived);
      sheet.getRange(row, COL.MAIN_REM).setValue(newRemaining);
    }

    addTransaction('รับเข้า', materialCode, material.description, quantity, stockType || 'main', material.batch, userName, 'รับเข้าวัสดุ');

    addAuditLog(
      'RECEIVE',
      'รับเข้า: ' + material.description + ' (' + materialCode + ') จำนวน ' + quantity + ' ' + material.unit + ' เข้า' + (stockType === 'sub' ? 'สต๊อกเล็ก' : 'สต๊อกใหญ่'),
      userName,
      deviceInfo
    );

    return { success: true, message: 'รับเข้าวัสดุสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Return material
 */
function returnMaterial(materialCode, quantity, userName, note, stockType, batch, sheetRow, tabName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);
    quantity = parseInt(quantity);

    let row = sheetRow;
    if (!row) {
      row = findMaterialRow(sheet, materialCode, batch);
    }
    if (row === -1 || !row) {
      return { success: false, message: 'ไม่พบวัสดุ: ' + materialCode };
    }

    const material = getMaterialAtRow(sheet, row);

    if (stockType === 'sub') {
      const newRemaining = material.subStock.remaining + quantity;
      sheet.getRange(row, COL.SUB_REM).setValue(newRemaining);
    } else {
      // Return to main stock — reduce issued count, increase remaining
      const newIssued = Math.max(0, material.mainStock.issued - quantity);
      const newRemaining = material.mainStock.previous + material.mainStock.received - newIssued;
      sheet.getRange(row, COL.MAIN_OUT).setValue(newIssued);
      sheet.getRange(row, COL.MAIN_REM).setValue(newRemaining);
    }

    addTransaction('คืน', materialCode, material.description, quantity, stockType || 'main', material.batch, userName, note);

    addAuditLog(
      'RETURN',
      'คืน: ' + material.description + ' (' + materialCode + ') จำนวน ' + quantity + ' ' + material.unit + ' | ' + note,
      userName,
      deviceInfo
    );

    return { success: true, message: 'คืนวัสดุสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Add new material row to the sheet
 */
function addMaterial(material, tabName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);

    // Find the last data row (before empty/section rows)
    const data = sheet.getDataRange().getValues();
    let lastDataRow = HEADER_ROWS;
    for (let i = HEADER_ROWS; i < data.length; i++) {
      const code = String(data[i][COL.CODE - 1] || '').trim();
      if (code && /^\d+$/.test(code)) {
        lastDataRow = i + 1;
      }
    }

    // Insert new row after last data row
    const newRow = lastDataRow + 1;
    sheet.insertRowAfter(lastDataRow);

    // Set values
    const no = lastDataRow - HEADER_ROWS + 1; // Auto-number
    sheet.getRange(newRow, COL.NO).setValue(no);
    sheet.getRange(newRow, COL.CODE).setValue(material.materialCode || '');
    sheet.getRange(newRow, COL.DESCRIPTION).setValue(material.description || '');
    sheet.getRange(newRow, COL.PLANT).setValue(material.plant || '1030');
    sheet.getRange(newRow, COL.BATCH).setValue(material.batch || 'MAT_BUY');
    sheet.getRange(newRow, COL.UNIT).setValue(material.unit || 'EA');
    sheet.getRange(newRow, COL.MAIN_PREV).setValue(parseInt(material.mainQuantity) || 0);
    sheet.getRange(newRow, COL.MAIN_IN).setValue(0);
    sheet.getRange(newRow, COL.MAIN_OUT).setValue(0);
    sheet.getRange(newRow, COL.MAIN_REM).setValue(parseInt(material.mainQuantity) || 0);
    sheet.getRange(newRow, COL.MAIN_SYS).setValue(parseInt(material.mainQuantity) || 0);
    sheet.getRange(newRow, COL.SUB_PREV).setValue(parseInt(material.subQuantity) || 0);
    sheet.getRange(newRow, COL.SUB_IN).setValue(0);
    sheet.getRange(newRow, COL.SUB_REM).setValue(parseInt(material.subQuantity) || 0);
    if (material.price) sheet.getRange(newRow, COL.PRICE).setValue(material.price);

    addAuditLog('ADD_MATERIAL', 'เพิ่มวัสดุ: ' + material.materialCode + ' - ' + material.description, material.userName || 'System', deviceInfo);
    addTransaction('เพิ่ม', material.materialCode, material.description, 0, 'main', material.batch || '', material.userName || 'System', 'เพิ่มรายการใหม่');

    return { success: true, message: 'เพิ่มวัสดุสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Update material at a specific row
 */
function updateMaterial(sheetRow, updates, tabName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);

    if (!sheetRow || sheetRow <= HEADER_ROWS) {
      return { success: false, message: 'ไม่ระบุแถวที่ต้องการแก้ไข' };
    }

    const oldMaterial = getMaterialAtRow(sheet, sheetRow);
    const changes = [];

    if (updates.description !== undefined && updates.description !== oldMaterial.description) {
      sheet.getRange(sheetRow, COL.DESCRIPTION).setValue(updates.description);
      changes.push('ชื่อ: ' + oldMaterial.description + ' → ' + updates.description);
    }
    if (updates.unit !== undefined && updates.unit !== oldMaterial.unit) {
      sheet.getRange(sheetRow, COL.UNIT).setValue(updates.unit);
      changes.push('หน่วย: ' + oldMaterial.unit + ' → ' + updates.unit);
    }
    if (updates.plant !== undefined && updates.plant !== oldMaterial.plant) {
      sheet.getRange(sheetRow, COL.PLANT).setValue(updates.plant);
      changes.push('Plant: ' + oldMaterial.plant + ' → ' + updates.plant);
    }
    if (updates.mainRemaining !== undefined) {
      sheet.getRange(sheetRow, COL.MAIN_REM).setValue(parseInt(updates.mainRemaining));
      changes.push('สต๊อกใหญ่ คงเหลือ: ' + oldMaterial.mainStock.remaining + ' → ' + updates.mainRemaining);
    }
    if (updates.subRemaining !== undefined) {
      sheet.getRange(sheetRow, COL.SUB_REM).setValue(parseInt(updates.subRemaining));
      changes.push('สต๊อกเล็ก คงเหลือ: ' + oldMaterial.subStock.remaining + ' → ' + updates.subRemaining);
    }
    if (updates.mainExpiry !== undefined) {
      sheet.getRange(sheetRow, COL.MAIN_EXP).setValue(updates.mainExpiry);
      changes.push('Exp.สต๊อกใหญ่ อัปเดต');
    }
    if (updates.subExpiry !== undefined) {
      sheet.getRange(sheetRow, COL.SUB_EXP).setValue(updates.subExpiry);
      changes.push('Exp.สต๊อกเล็ก อัปเดต');
    }
    if (updates.price !== undefined) {
      sheet.getRange(sheetRow, COL.PRICE).setValue(updates.price);
      changes.push('ราคา: ' + oldMaterial.price + ' → ' + updates.price);
    }

    if (changes.length > 0) {
      addAuditLog('UPDATE_MATERIAL', 'แก้ไขวัสดุ ' + oldMaterial.materialCode + ': ' + changes.join(', '), updates.userName || 'System', deviceInfo);
    }

    return { success: true, message: 'แก้ไขวัสดุสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete material row
 */
function deleteMaterial(sheetRow, tabName, userName, deviceInfo) {
  try {
    const { sheet } = getSheetByTab(tabName);

    if (!sheetRow || sheetRow <= HEADER_ROWS) {
      return { success: false, message: 'ไม่ระบุแถวที่ต้องการลบ' };
    }

    const material = getMaterialAtRow(sheet, sheetRow);
    sheet.deleteRow(sheetRow);

    addAuditLog('DELETE_MATERIAL', 'ลบวัสดุ: ' + material.materialCode + ' - ' + material.description, userName || 'System', deviceInfo);

    return { success: true, message: 'ลบวัสดุสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Batch withdraw multiple materials
 */
function batchWithdraw(items, userName, tabName, deviceInfo) {
  try {
    const results = [];

    for (let item of items) {
      const result = withdraw(
        item.materialCode, item.quantity, userName,
        item.note || '', item.stockType || 'main', item.batch || '',
        item.sheetRow, tabName, deviceInfo
      );
      results.push({
        materialCode: item.materialCode,
        success: result.success,
        message: result.message
      });

      if (!result.success) {
        return {
          success: false,
          message: 'เบิกวัสดุไม่สำเร็จ: ' + item.materialCode,
          results: results
        };
      }
    }

    return {
      success: true,
      message: 'เบิกวัสดุทั้งหมดสำเร็จ',
      results: results
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========================================
// Weekly Summary (updated for new schema)
// ========================================

function sendWeeklyInventorySummary() {
  try {
    const flexMessage = createWeeklySummaryFlexMessage();
    broadcastFlexMessage(flexMessage);
    Logger.log('Weekly summary sent successfully');
    return { success: true, message: 'ส่งสรุปยอดวัสดุสำเร็จ' };
  } catch (error) {
    Logger.log('Error sending weekly summary: ' + error);
    return { success: false, message: error.toString() };
  }
}

function createWeeklySummaryFlexMessage() {
  const { sheet } = getCurrentMonthSheet();
  const data = sheet.getDataRange().getValues();

  let totalMaterials = 0;
  let totalMainRemaining = 0;
  let totalSubRemaining = 0;
  let outOfStockItems = [];
  let lowStockItems = [];

  for (let i = HEADER_ROWS; i < data.length; i++) {
    const code = String(data[i][COL.CODE - 1] || '').trim();
    if (!code || !/^\d+$/.test(code)) continue;

    totalMaterials++;
    const mainRem = parseInt(data[i][COL.MAIN_REM - 1]) || 0;
    const subRem = parseInt(data[i][COL.SUB_REM - 1]) || 0;
    const name = String(data[i][COL.DESCRIPTION - 1] || '').trim();
    const unit = String(data[i][COL.UNIT - 1] || '').trim();
    const total = mainRem + subRem;

    totalMainRemaining += mainRem;
    totalSubRemaining += subRem;

    if (total <= 0) {
      outOfStockItems.push({ name, unit, mainRem, subRem });
    } else if (total <= 5) {
      lowStockItems.push({ name, unit, mainRem, subRem, total });
    }
  }

  const now = new Date();
  const bangkokTime = Utilities.formatDate(now, 'Asia/Bangkok', 'd MMM yyyy, HH:mm');

  let bodyContents = [
    { type: 'text', text: bangkokTime + ' น.', size: 'xs', color: '#86868b', align: 'center' },
    { type: 'text', text: 'สรุปยอดวัสดุ', weight: 'bold', size: 'xxl', color: '#1d1d1f', align: 'center', margin: 'sm' },
    {
      type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md',
      contents: [
        createStatCard(totalMaterials.toString(), 'รายการ', '#f5f5f7', '#1d1d1f'),
        createStatCard((totalMainRemaining + totalSubRemaining).toLocaleString(), 'ชิ้น', '#f5f5f7', '#1d1d1f')
      ]
    },
    {
      type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md',
      contents: [
        createStatCard(lowStockItems.length.toString(), 'ใกล้หมด', '#fff3e0', '#ff9500'),
        createStatCard(outOfStockItems.length.toString(), 'หมดสต็อก', '#ffebee', '#ff3b30')
      ]
    }
  ];

  // Low stock section
  if (lowStockItems.length > 0) {
    bodyContents.push({
      type: 'box', layout: 'vertical', margin: 'xl',
      contents: [{ type: 'text', text: 'ต้องเติมสต็อก', weight: 'bold', size: 'md', color: '#1d1d1f' }]
    });
    lowStockItems.slice(0, 5).forEach(function (p) {
      bodyContents.push(createItemRow(p.name, p.total + ' ' + p.unit, '#ff9500'));
    });
  }

  const liffId = PropertiesService.getScriptProperties().getProperty('LIFF_ID') || '';
  const dashboardUrl = liffId ? 'https://liff.line.me/' + liffId + '#dashboard' : '';

  return {
    type: 'flex', altText: 'สรุปยอดวัสดุคงคลัง',
    contents: {
      type: 'bubble', size: 'mega',
      body: { type: 'box', layout: 'vertical', contents: bodyContents, paddingAll: 'xl', backgroundColor: '#ffffff' },
      footer: dashboardUrl ? {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: 'ดูรายละเอียด', uri: dashboardUrl },
          style: 'primary', color: '#007aff', height: 'sm'
        }],
        paddingAll: 'lg', backgroundColor: '#ffffff'
      } : undefined
    }
  };
}

function createStatCard(value, label, bgColor, textColor) {
  return {
    type: 'box', layout: 'vertical', flex: 1,
    contents: [
      { type: 'text', text: value, size: 'xl', weight: 'bold', color: textColor, align: 'center' },
      { type: 'text', text: label, size: 'xs', color: '#86868b', align: 'center', margin: 'xs' }
    ],
    backgroundColor: bgColor, cornerRadius: 'lg', paddingAll: 'lg'
  };
}

function createItemRow(name, value, valueColor) {
  return {
    type: 'box', layout: 'horizontal', margin: 'md',
    contents: [
      { type: 'text', text: name, size: 'sm', color: '#1d1d1f', flex: 3 },
      { type: 'text', text: value, size: 'sm', color: valueColor, align: 'end', weight: 'bold', flex: 2 }
    ]
  };
}

function broadcastFlexMessage(flexMessage) {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '';
  if (!token) { Logger.log('LINE_CHANNEL_ACCESS_TOKEN not configured'); return; }

  const options = {
    method: 'post', contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + token },
    payload: JSON.stringify({ messages: [flexMessage] }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', options);
    Logger.log('Broadcast response: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error broadcasting: ' + error);
  }
}

function setupWeeklyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'sendWeeklyInventorySummary') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('sendWeeklyInventorySummary')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
  Logger.log('Weekly trigger created');
  return { success: true, message: 'สร้าง Trigger สำเร็จ' };
}
