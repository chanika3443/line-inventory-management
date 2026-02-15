/**
 * LINE Inventory Management - Apps Script Backend
 * Handles WRITE operations to Google Sheets
 */

const SPREADSHEET_ID = '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8';

// Sheet names
const SHEETS = {
  PRODUCTS: 'Products',
  TRANSACTIONS: 'Transactions'
};

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Apps Script is running. Use POST for operations.'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests from frontend
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    switch (action) {
      case 'addProduct':
        result = addProduct(data.product);
        break;
      case 'updateProduct':
        result = updateProduct(data.code, data.updates);
        break;
      case 'deleteProduct':
        result = deleteProduct(data.code);
        break;
      case 'withdraw':
        result = withdraw(data.productCode, data.quantity, data.userName, data.note || '');
        break;
      case 'receive':
        result = receive(data.productCode, data.quantity, data.userName);
        break;
      case 'return':
        result = returnProduct(data.productCode, data.quantity, data.userName, data.note);
        break;
      case 'batchWithdraw':
        result = batchWithdraw(data.items, data.userName);
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

/**
 * Get spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Get sheet by name
 */
function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

/**
 * Find product row by code
 */
function findProductRow(code) {
  const sheet = getSheet(SHEETS.PRODUCTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      return i + 1; // Return 1-based row number
    }
  }
  return -1;
}

/**
 * Get product by code
 */
function getProduct(code) {
  const row = findProductRow(code);
  if (row === -1) return null;
  
  const sheet = getSheet(SHEETS.PRODUCTS);
  const data = sheet.getRange(row, 1, 1, 11).getValues()[0];
  
  return {
    code: data[0],
    name: data[1],
    unit: data[2],
    quantity: data[3],
    lowStockThreshold: data[4],
    category: data[5],
    returnable: data[6],
    requireRoom: data[7],
    requirePatientType: data[8],
    createdAt: data[9],
    updatedAt: data[10]
  };
}

/**
 * Add audit log entry
 */
function addAuditLog(action, details, userName, ipAddress = '') {
  try {
    const sheet = getSpreadsheet().getSheetByName('AuditLog');
    if (!sheet) {
      // Create AuditLog sheet if it doesn't exist
      const newSheet = getSpreadsheet().insertSheet('AuditLog');
      newSheet.appendRow(['Timestamp', 'Action', 'Details', 'UserName', 'IP Address']);
      return addAuditLog(action, details, userName, ipAddress);
    }
    
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      action,
      details,
      userName,
      ipAddress
    ]);
  } catch (error) {
    // Silently fail - don't break the main operation if audit log fails
    console.error('Audit log error:', error);
  }
}

/**
 * Add transaction log
 */
function addTransaction(type, productCode, productName, quantity, beforeQty, afterQty, userName, note = '') {
  const sheet = getSheet(SHEETS.TRANSACTIONS);
  const timestamp = new Date();
  const id = 'TXN' + timestamp.getTime();
  
  sheet.appendRow([
    id,
    timestamp,
    type,
    productCode,
    productName,
    quantity,
    beforeQty,
    afterQty,
    userName,
    note
  ]);
}

/**
 * Add new product
 */
function addProduct(product) {
  try {
    const sheet = getSheet(SHEETS.PRODUCTS);
    
    // Check if product code already exists
    if (findProductRow(product.code) !== -1) {
      return { success: false, message: 'รหัสสินค้านี้มีอยู่แล้ว' };
    }
    
    const timestamp = new Date();
    sheet.appendRow([
      product.code,
      product.name,
      product.unit || 'ชิ้น',
      product.quantity || 0,
      product.lowStockThreshold || 10,
      product.category || '',
      product.returnable || false,
      product.requireRoom || false,
      product.requirePatientType || false,
      timestamp,
      timestamp
    ]);
    
    // Add audit log
    addAuditLog(
      'ADD_PRODUCT',
      `เพิ่มวัสดุ: ${product.code} - ${product.name}`,
      product.userName || 'System'
    );
    
    return { success: true, message: 'เพิ่มสินค้าสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Update product
 */
function updateProduct(code, updates) {
  try {
    const row = findProductRow(code);
    if (row === -1) {
      return { success: false, message: 'ไม่พบสินค้า' };
    }
    
    const sheet = getSheet(SHEETS.PRODUCTS);
    const timestamp = new Date();
    
    // Get old product data for audit log
    const oldProduct = getProduct(code);
    let changes = [];
    
    // Update fields
    if (updates.name !== undefined && updates.name !== oldProduct.name) {
      sheet.getRange(row, 2).setValue(updates.name);
      changes.push(`ชื่อ: ${oldProduct.name} → ${updates.name}`);
    }
    if (updates.unit !== undefined && updates.unit !== oldProduct.unit) {
      sheet.getRange(row, 3).setValue(updates.unit);
      changes.push(`หน่วย: ${oldProduct.unit} → ${updates.unit}`);
    }
    if (updates.quantity !== undefined && updates.quantity !== oldProduct.quantity) {
      sheet.getRange(row, 4).setValue(updates.quantity);
      changes.push(`จำนวน: ${oldProduct.quantity} → ${updates.quantity}`);
    }
    if (updates.lowStockThreshold !== undefined && updates.lowStockThreshold !== oldProduct.lowStockThreshold) {
      sheet.getRange(row, 5).setValue(updates.lowStockThreshold);
      changes.push(`เกณฑ์: ${oldProduct.lowStockThreshold} → ${updates.lowStockThreshold}`);
    }
    if (updates.category !== undefined && updates.category !== oldProduct.category) {
      sheet.getRange(row, 6).setValue(updates.category);
      changes.push(`หมวดหมู่: ${oldProduct.category} → ${updates.category}`);
    }
    if (updates.returnable !== undefined && updates.returnable !== oldProduct.returnable) {
      sheet.getRange(row, 7).setValue(updates.returnable);
      changes.push(`คืนได้: ${oldProduct.returnable} → ${updates.returnable}`);
    }
    if (updates.requireRoom !== undefined && updates.requireRoom !== oldProduct.requireRoom) {
      sheet.getRange(row, 8).setValue(updates.requireRoom);
      changes.push(`ต้องระบุห้อง: ${oldProduct.requireRoom} → ${updates.requireRoom}`);
    }
    if (updates.requirePatientType !== undefined && updates.requirePatientType !== oldProduct.requirePatientType) {
      sheet.getRange(row, 9).setValue(updates.requirePatientType);
      changes.push(`ต้องระบุประเภทผู้ป่วย: ${oldProduct.requirePatientType} → ${updates.requirePatientType}`);
    }
    
    // Update timestamp
    sheet.getRange(row, 11).setValue(timestamp);
    
    // Add audit log
    if (changes.length > 0) {
      addAuditLog(
        'UPDATE_PRODUCT',
        `แก้ไขวัสดุ ${code}: ${changes.join(', ')}`,
        updates.userName || 'System'
      );
    }
    
    return { success: true, message: 'แก้ไขสินค้าสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete product
 */
function deleteProduct(code) {
  try {
    const row = findProductRow(code);
    if (row === -1) {
      return { success: false, message: 'ไม่พบสินค้า' };
    }
    
    // Get product data before deletion for audit log
    const product = getProduct(code);
    
    const sheet = getSheet(SHEETS.PRODUCTS);
    sheet.deleteRow(row);
    
    // Add audit log
    addAuditLog(
      'DELETE_PRODUCT',
      `ลบวัสดุ: ${code} - ${product.name}`,
      'System'
    );
    
    return { success: true, message: 'ลบสินค้าสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Withdraw product
 */
function withdraw(productCode, quantity, userName, note) {
  try {
    const product = getProduct(productCode);
    if (!product) {
      return { success: false, message: 'ไม่พบสินค้า' };
    }
    
    if (product.quantity < quantity) {
      return { success: false, message: 'สินค้าไม่เพียงพอ' };
    }
    
    const row = findProductRow(productCode);
    const sheet = getSheet(SHEETS.PRODUCTS);
    const newQuantity = product.quantity - quantity;
    
    // Update quantity
    sheet.getRange(row, 4).setValue(newQuantity);
    sheet.getRange(row, 11).setValue(new Date());
    
    // Add transaction log with note
    addTransaction('เบิก', productCode, product.name, quantity, product.quantity, newQuantity, userName, note || 'เบิกวัสดุ');
    
    // Add audit log
    addAuditLog(
      'WITHDRAW',
      `เบิก: ${product.name} (${productCode}) จำนวน ${quantity} ${product.unit} | ${note || 'เบิกวัสดุ'}`,
      userName
    );
    
    return { 
      success: true, 
      message: 'เบิกสินค้าสำเร็จ',
      newQuantity: newQuantity
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Receive product
 */
function receive(productCode, quantity, userName) {
  try {
    const product = getProduct(productCode);
    if (!product) {
      return { success: false, message: 'ไม่พบสินค้า' };
    }
    
    const row = findProductRow(productCode);
    const sheet = getSheet(SHEETS.PRODUCTS);
    const newQuantity = product.quantity + quantity;
    
    // Update quantity
    sheet.getRange(row, 4).setValue(newQuantity);
    sheet.getRange(row, 11).setValue(new Date());
    
    // Add transaction log
    addTransaction('รับเข้า', productCode, product.name, quantity, product.quantity, newQuantity, userName);
    
    // Add audit log
    addAuditLog(
      'RECEIVE',
      `รับเข้า: ${product.name} (${productCode}) จำนวน ${quantity} ${product.unit}`,
      userName
    );
    
    return { 
      success: true, 
      message: 'รับเข้าสินค้าสำเร็จ',
      newQuantity: newQuantity
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Return product
 */
function returnProduct(productCode, quantity, userName, note) {
  try {
    const product = getProduct(productCode);
    if (!product) {
      return { success: false, message: 'ไม่พบสินค้า' };
    }
    
    if (!product.returnable) {
      return { success: false, message: 'สินค้านี้ไม่สามารถคืนได้' };
    }
    
    const row = findProductRow(productCode);
    const sheet = getSheet(SHEETS.PRODUCTS);
    const newQuantity = product.quantity + quantity;
    
    // Update quantity
    sheet.getRange(row, 4).setValue(newQuantity);
    sheet.getRange(row, 11).setValue(new Date());
    
    // Add transaction log
    addTransaction('คืน', productCode, product.name, quantity, product.quantity, newQuantity, userName, note);
    
    // Add audit log
    addAuditLog(
      'RETURN',
      `คืน: ${product.name} (${productCode}) จำนวน ${quantity} ${product.unit} | ${note}`,
      userName
    );
    
    return { 
      success: true, 
      message: 'คืนสินค้าสำเร็จ',
      newQuantity: newQuantity
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Batch withdraw multiple products
 */
function batchWithdraw(items, userName) {
  try {
    const results = [];
    
    for (let item of items) {
      const result = withdraw(item.productCode, item.quantity, userName);
      results.push({
        productCode: item.productCode,
        success: result.success,
        message: result.message
      });
      
      if (!result.success) {
        return { 
          success: false, 
          message: 'เบิกสินค้าไม่สำเร็จ: ' + item.productCode,
          results: results
        };
      }
    }
    
    return { 
      success: true, 
      message: 'เบิกสินค้าทั้งหมดสำเร็จ',
      results: results
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
