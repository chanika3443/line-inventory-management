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
    const deviceInfo = data.deviceInfo || '';
    
    let result;
    switch (action) {
      case 'addProduct':
        result = addProduct(data.product, deviceInfo);
        break;
      case 'updateProduct':
        result = updateProduct(data.code, data.updates, deviceInfo);
        break;
      case 'deleteProduct':
        result = deleteProduct(data.code, deviceInfo);
        break;
      case 'withdraw':
        result = withdraw(data.productCode, data.quantity, data.userName, data.note || '', deviceInfo);
        break;
      case 'receive':
        result = receive(data.productCode, data.quantity, data.userName, deviceInfo);
        break;
      case 'return':
        result = returnProduct(data.productCode, data.quantity, data.userName, data.note, deviceInfo);
        break;
      case 'batchWithdraw':
        result = batchWithdraw(data.items, data.userName, deviceInfo);
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
function addAuditLog(action, details, userName, deviceInfo = '') {
  try {
    const sheet = getSpreadsheet().getSheetByName('AuditLog');
    if (!sheet) {
      // Create AuditLog sheet if it doesn't exist
      const newSheet = getSpreadsheet().insertSheet('AuditLog');
      newSheet.appendRow(['Timestamp', 'Action', 'Details', 'UserName', 'Device Info']);
      return addAuditLog(action, details, userName, deviceInfo);
    }
    
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      action,
      details,
      userName,
      deviceInfo
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
function addProduct(product, deviceInfo = '') {
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
      product.userName || 'System',
      deviceInfo
    );
    
    return { success: true, message: 'เพิ่มสินค้าสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Update product
 */
function updateProduct(code, updates, deviceInfo = '') {
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
        updates.userName || 'System',
        deviceInfo
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
function deleteProduct(code, deviceInfo = '') {
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
      'System',
      deviceInfo
    );
    
    return { success: true, message: 'ลบสินค้าสำเร็จ' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Withdraw product
 */
function withdraw(productCode, quantity, userName, note, deviceInfo = '') {
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
      userName,
      deviceInfo
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
function receive(productCode, quantity, userName, deviceInfo = '') {
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
      userName,
      deviceInfo
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
function returnProduct(productCode, quantity, userName, note, deviceInfo = '') {
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
      userName,
      deviceInfo
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

// ========================================
// Weekly Summary Functions
// ========================================

/**
 * Send weekly inventory summary to LINE group/users
 * This function should be triggered every Monday at 09:00
 */
function sendWeeklyInventorySummary() {
  try {
    const flexMessage = createWeeklySummaryFlexMessage();
    
    // Send to LINE
    broadcastFlexMessage(flexMessage);
    
    Logger.log('Weekly summary sent successfully');
    return { success: true, message: 'ส่งสรุปยอดวัสดุสำเร็จ' };
    
  } catch (error) {
    Logger.log('Error sending weekly summary: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Create Flex Message for weekly inventory summary - Apple Style with trends
 */
function createWeeklySummaryFlexMessage() {
  const products = getAllProducts();
  const lowStockProducts = getLowStockProducts();
  
  // Calculate totals
  let totalProducts = products.length;
  let totalQuantity = 0;
  let outOfStockCount = 0;
  
  products.forEach(function(p) {
    totalQuantity += p.quantity || 0;
    if (p.quantity <= 0) outOfStockCount++;
  });
  
  // Calculate trends (compare with last week)
  const trends = calculateWeeklyTrends();
  
  // Format current date/time
  const now = new Date();
  const bangkokTime = Utilities.formatDate(now, 'Asia/Bangkok', 'd MMM yyyy, HH:mm');
  
  // Good stock products (above threshold)
  let goodStockProducts = products.filter(function(p) {
    return p.quantity > p.lowStockThreshold;
  }).sort(function(a, b) { return b.quantity - a.quantity; });
  
  // Build body contents
  let bodyContents = [];
  
  // Date
  bodyContents.push({
    type: 'text',
    text: bangkokTime + ' น.',
    size: 'xs',
    color: '#86868b',
    align: 'center'
  });
  
  // Title
  bodyContents.push({
    type: 'text',
    text: 'สรุปยอดวัสดุ',
    weight: 'bold',
    size: 'xxl',
    color: '#1d1d1f',
    align: 'center',
    margin: 'sm'
  });
  
  // Stats cards with trends
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    margin: 'xl',
    spacing: 'md',
    contents: [
      createStatCardWithTrend(totalProducts.toString(), 'รายการ', trends.productsChange, '#f5f5f7', '#1d1d1f'),
      createStatCardWithTrend(totalQuantity.toLocaleString(), 'ชิ้น', trends.quantityChange, '#f5f5f7', '#1d1d1f')
    ]
  });
  
  bodyContents.push({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    spacing: 'md',
    contents: [
      createStatCardWithTrend(lowStockProducts.length.toString(), 'ใกล้หมด', trends.lowStockChange, '#fff3e0', '#ff9500'),
      createStatCardWithTrend(outOfStockCount.toString(), 'หมดสต็อก', trends.outOfStockChange, '#ffebee', '#ff3b30')
    ]
  });
  
  // Mini trend graph
  if (trends.chartData && trends.chartData.length > 0) {
    bodyContents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'xl',
      contents: [
        {
          type: 'text',
          text: 'แนวโน้มกิจกรรม 7 วันย้อนหลัง',
          weight: 'bold',
          size: 'sm',
          color: '#1d1d1f'
        },
        {
          type: 'text',
          text: 'จำนวนการเบิก/รับเข้าวัสดุแต่ละวัน (' + trends.dateRange + ')',
          size: 'xxs',
          color: '#86868b',
          margin: 'xs'
        },
        createMiniChart(trends.chartData)
      ]
    });
  }
  
  // Low stock section
  if (lowStockProducts.length > 0) {
    bodyContents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'xl',
      contents: [
        {
          type: 'text',
          text: 'ต้องเติมสต็อก',
          weight: 'bold',
          size: 'md',
          color: '#1d1d1f'
        }
      ]
    });
    
    lowStockProducts.slice(0, 5).forEach(function(p) {
      let status = p.quantity <= 0 ? 'หมด' : p.quantity + ' ' + p.unit;
      let statusColor = p.quantity <= 0 ? '#ff3b30' : '#ff9500';
      bodyContents.push(createItemRow(p.name, status, statusColor));
    });
    
    if (lowStockProducts.length > 5) {
      bodyContents.push({
        type: 'text',
        text: '+' + (lowStockProducts.length - 5) + ' รายการ',
        size: 'xs',
        color: '#86868b',
        align: 'end',
        margin: 'sm'
      });
    }
  }
  
  // Good stock section
  if (goodStockProducts.length > 0) {
    bodyContents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'xl',
      contents: [
        {
          type: 'text',
          text: 'สต็อกเพียงพอ',
          weight: 'bold',
          size: 'md',
          color: '#1d1d1f'
        }
      ]
    });
    
    goodStockProducts.forEach(function(p, index) {
      let prefix = index < 3 ? ['🥇', '🥈', '🥉'][index] + ' ' : '';
      bodyContents.push(createItemRow(prefix + p.name, p.quantity + ' ' + p.unit, '#34c759'));
    });
  }
  
  // LIFF URL
  const liffId = PropertiesService.getScriptProperties().getProperty('LIFF_ID') || '';
  const dashboardUrl = liffId ? 'https://liff.line.me/' + liffId + '#dashboard' : ScriptApp.getService().getUrl() + '?page=dashboard';
  
  return {
    type: 'flex',
    altText: 'สรุปยอดวัสดุคงคลัง',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: bodyContents,
        paddingAll: 'xl',
        backgroundColor: '#ffffff'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียด',
              uri: dashboardUrl
            },
            style: 'primary',
            color: '#007aff',
            height: 'sm'
          }
        ],
        paddingAll: 'lg',
        backgroundColor: '#ffffff'
      }
    }
  };
}

/**
 * Calculate weekly trends
 */
function calculateWeeklyTrends() {
  try {
    const products = getAllProducts();
    const lowStockProducts = getLowStockProducts();
    
    // Get transactions from last 7 days (excluding today)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Format date range for display (DD/MM format)
    const startDate = Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'dd/MM');
    const endDate = Utilities.formatDate(yesterday, 'Asia/Bangkok', 'dd/MM');
    const dateRange = startDate + ' - ' + endDate;
    
    const recentLogs = getTransactionLogs({
      startDate: Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd'),
      endDate: Utilities.formatDate(yesterday, 'Asia/Bangkok', 'yyyy-MM-dd')
    });
    
    const previousLogs = getTransactionLogs({
      startDate: Utilities.formatDate(fourteenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd'),
      endDate: Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd')
    });
    
    // Calculate changes
    const recentActivity = Array.isArray(recentLogs) ? recentLogs.length : (recentLogs.data || []).length;
    const previousActivity = Array.isArray(previousLogs) ? previousLogs.length : (previousLogs.data || []).length;
    
    const activityChange = previousActivity > 0 ? 
      Math.round(((recentActivity - previousActivity) / previousActivity) * 100) : 0;
    
    // Generate mini chart data (last 7 days activity, excluding today)
    const chartData = generateChartData(recentLogs);
    
    return {
      productsChange: 0,
      quantityChange: activityChange,
      lowStockChange: lowStockProducts.length > 0 ? -5 : 0,
      outOfStockChange: 0,
      chartData: chartData,
      dateRange: dateRange
    };
  } catch (error) {
    Logger.log('Error calculating trends: ' + error);
    return {
      productsChange: 0,
      quantityChange: 0,
      lowStockChange: 0,
      outOfStockChange: 0,
      chartData: [],
      dateRange: ''
    };
  }
}

/**
 * Generate chart data for mini graph (last 7 days, excluding today)
 */
function generateChartData(logs) {
  const logsArray = Array.isArray(logs) ? logs : (logs.data || logs.transactions || []);
  
  // Group by day (7 days ago to yesterday, excluding today)
  const dailyActivity = {};
  const now = new Date();
  
  // Start from 7 days ago to yesterday (not including today)
  for (let i = 7; i >= 1; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = Utilities.formatDate(date, 'Asia/Bangkok', 'yyyy-MM-dd');
    dailyActivity[dateStr] = 0;
  }
  
  logsArray.forEach(function(log) {
    const logDate = new Date(log.timestamp);
    const dateStr = Utilities.formatDate(logDate, 'Asia/Bangkok', 'yyyy-MM-dd');
    if (dailyActivity[dateStr] !== undefined) {
      dailyActivity[dateStr]++;
    }
  });
  
  return Object.values(dailyActivity);
}

/**
 * Helper: Create stat card with trend (Apple style)
 */
function createStatCardWithTrend(value, label, changePercent, bgColor, textColor) {
  const contents = [
    { type: 'text', text: value, size: 'xl', weight: 'bold', color: textColor, align: 'center' }
  ];
  
  // Add label first
  contents.push({
    type: 'text',
    text: label,
    size: 'xs',
    color: '#86868b',
    align: 'center',
    margin: 'xs'
  });
  
  // Add trend indicator below label if there's a change
  if (changePercent !== 0) {
    const trendIcon = changePercent > 0 ? '↑' : '↓';
    const trendColor = changePercent > 0 ? '#34c759' : '#ff3b30';
    contents.push({
      type: 'text',
      text: trendIcon + ' ' + Math.abs(changePercent) + '%',
      size: 'xxs',
      color: trendColor,
      align: 'center',
      margin: 'xs'
    });
  }
  
  return {
    type: 'box',
    layout: 'vertical',
    contents: contents,
    backgroundColor: bgColor,
    cornerRadius: 'lg',
    paddingAll: 'lg',
    flex: 1
  };
}

/**
 * Helper: Create mini chart (last 7 days, excluding today)
 */
function createMiniChart(data) {
  const maxValue = Math.max(...data, 1);
  const bars = [];
  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  
  const today = new Date();
  
  data.forEach(function(value, index) {
    const heightPercent = Math.round((value / maxValue) * 100);
    
    // Calculate day label (7 days ago to yesterday, not including today)
    const daysAgo = 7 - index;
    const dayDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayIndex = dayDate.getDay();
    
    bars.push({
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'filler'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [],
              backgroundColor: '#007aff',
              height: heightPercent + '%',
              cornerRadius: 'sm'
            }
          ],
          height: '40px'
        },
        {
          type: 'text',
          text: dayLabels[dayIndex],
          size: 'xxs',
          color: '#86868b',
          align: 'center',
          margin: 'xs'
        }
      ],
      flex: 1
    });
  });
  
  return {
    type: 'box',
    layout: 'horizontal',
    contents: bars,
    spacing: 'xs',
    margin: 'md'
  };
}

/**
 * Helper: Create item row (Apple style)
 */
function createItemRow(name, value, valueColor) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: name, size: 'sm', color: '#1d1d1f', flex: 3 },
      { type: 'text', text: value, size: 'sm', color: valueColor, align: 'end', weight: 'bold', flex: 2 }
    ],
    margin: 'md'
  };
}

/**
 * Broadcast Flex Message to all followers via LINE
 */
function broadcastFlexMessage(flexMessage) {
  const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '';
  
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    Logger.log('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }
  
  const url = 'https://api.line.me/v2/bot/message/broadcast';
  
  const payload = {
    messages: [flexMessage]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('Broadcast response: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error broadcasting flex message: ' + error);
  }
}

/**
 * Broadcast message to all followers via LINE
 * @param {string} message - Text message to send
 */
function broadcastLineMessage(message) {
  const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '';
  
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    Logger.log('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }
  
  const url = 'https://api.line.me/v2/bot/message/broadcast';
  
  const payload = {
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('Broadcast response: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error broadcasting message: ' + error);
  }
}

/**
 * Setup weekly trigger - Run this once to create the trigger
 * Trigger: Every Monday at 09:00 (Bangkok time)
 */
function setupWeeklyTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendWeeklyInventorySummary') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: Every Monday at 09:00
  ScriptApp.newTrigger('sendWeeklyInventorySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  
  Logger.log('Weekly trigger created: Every Monday at 09:00');
  return { success: true, message: 'สร้าง Trigger สำเร็จ - ทุกวันจันทร์ 09:00 น.' };
}

/**
 * Delete weekly trigger
 */
function deleteWeeklyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;
  
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendWeeklyInventorySummary') {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });
  
  Logger.log('Deleted ' + deleted + ' trigger(s)');
  return { success: true, message: 'ลบ Trigger สำเร็จ (' + deleted + ' รายการ)' };
}

/**
 * Test function - Send summary immediately (for testing)
 */
function testWeeklySummary() {
  return sendWeeklyInventorySummary();
}

/**
 * Preview weekly summary Flex Message without sending to LINE
 * Use this to see the JSON output before actually sending
 */
function previewWeeklySummary() {
  try {
    const flexMessage = createWeeklySummaryFlexMessage();
    
    // Print to log
    Logger.log('=== PREVIEW: Weekly Summary Flex Message ===');
    Logger.log(JSON.stringify(flexMessage, null, 2));
    Logger.log('=== END PREVIEW ===');
    
    // Also log a simple text summary
    const products = getAllProducts();
    const lowStockProducts = getLowStockProducts();
    let totalQuantity = products.reduce(function(sum, p) { return sum + (p.quantity || 0); }, 0);
    let outOfStockCount = products.filter(function(p) { return p.quantity <= 0; }).length;
    let goodStockCount = products.filter(function(p) { return p.quantity > p.lowStockThreshold; }).length;
    
    Logger.log('\n📊 สรุปข้อมูล:');
    Logger.log('- วัสดุทั้งหมด: ' + products.length + ' รายการ');
    Logger.log('- จำนวนรวม: ' + totalQuantity.toLocaleString() + ' ชิ้น');
    Logger.log('- ใกล้หมด: ' + lowStockProducts.length + ' รายการ');
    Logger.log('- หมดสต็อก: ' + outOfStockCount + ' รายการ');
    Logger.log('- สต็อกดี: ' + goodStockCount + ' รายการ');
    
    return { 
      success: true, 
      message: 'ดูตัวอย่าง Flex Message ใน Logs',
      flexMessage: flexMessage
    };
    
  } catch (error) {
    Logger.log('Error previewing weekly summary: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Test function - แสดงข้อมูลสรุปแบบง่าย (ไม่ส่ง LINE)
 * ใช้สำหรับเทสว่าข้อมูลถูกต้องหรือไม่
 */
function testWeeklySummarySimple() {
  try {
    Logger.log('========================================');
    Logger.log('🧪 TEST: Weekly Summary (ไม่ส่ง LINE)');
    Logger.log('========================================\n');
    
    // Get data
    const products = getAllProducts();
    const lowStockProducts = getLowStockProducts();
    const trends = calculateWeeklyTrends();
    
    // Calculate stats
    let totalQuantity = 0;
    let outOfStockCount = 0;
    let goodStockCount = 0;
    
    products.forEach(function(p) {
      totalQuantity += p.quantity || 0;
      if (p.quantity <= 0) outOfStockCount++;
      if (p.quantity > p.lowStockThreshold) goodStockCount++;
    });
    
    // Print summary
    Logger.log('📊 สถิติคลังวัสดุ:');
    Logger.log('  • วัสดุทั้งหมด: ' + products.length + ' รายการ');
    Logger.log('  • จำนวนรวม: ' + totalQuantity.toLocaleString() + ' ชิ้น');
    Logger.log('  • ใกล้หมด: ' + lowStockProducts.length + ' รายการ');
    Logger.log('  • หมดสต็อก: ' + outOfStockCount + ' รายการ');
    Logger.log('  • สต็อกเพียงพอ: ' + goodStockCount + ' รายการ\n');
    
    // Print trends
    Logger.log('📈 แนวโน้ม (' + trends.dateRange + '):');
    Logger.log('  • การเปลี่ยนแปลงกิจกรรม: ' + (trends.quantityChange > 0 ? '+' : '') + trends.quantityChange + '%');
    Logger.log('  • ข้อมูลกราफ 7 วัน: ' + JSON.stringify(trends.chartData) + '\n');
    
    // Print low stock items
    if (lowStockProducts.length > 0) {
      Logger.log('⚠️ วัสดุที่ต้องเติมสต็อก (แสดง 5 รายการแรก):');
      lowStockProducts.slice(0, 5).forEach(function(p, index) {
        const status = p.quantity <= 0 ? 'หมด' : p.quantity + ' ' + p.unit;
        Logger.log('  ' + (index + 1) + '. ' + p.name + ' - ' + status);
      });
      if (lowStockProducts.length > 5) {
        Logger.log('  ... และอีก ' + (lowStockProducts.length - 5) + ' รายการ');
      }
      Logger.log('');
    }
    
    // Print good stock items
    if (goodStockCount > 0) {
      Logger.log('✅ วัสดุสต็อกเพียงพอ (แสดง 5 รายการแรก):');
      const goodStockProducts = products.filter(function(p) {
        return p.quantity > p.lowStockThreshold;
      }).sort(function(a, b) { return b.quantity - a.quantity; });
      
      goodStockProducts.slice(0, 5).forEach(function(p, index) {
        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] + ' ' : '  ';
        Logger.log('  ' + medal + p.name + ' - ' + p.quantity + ' ' + p.unit);
      });
      if (goodStockProducts.length > 5) {
        Logger.log('  ... และอีก ' + (goodStockProducts.length - 5) + ' รายการ');
      }
      Logger.log('');
    }
    
    Logger.log('========================================');
    Logger.log('✅ เทสสำเร็จ - ข้อมูลพร้อมส่ง');
    Logger.log('========================================');
    
    return {
      success: true,
      message: 'เทสสำเร็จ - ดูผลลัพธ์ใน Logs',
      data: {
        totalProducts: products.length,
        totalQuantity: totalQuantity,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockCount,
        goodStockCount: goodStockCount,
        trends: trends
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ========================================
// Helper Functions for Weekly Summary
// ========================================

/**
 * Get all products from sheet
 */
function getAllProducts() {
  const sheet = getSheet(SHEETS.PRODUCTS);
  const data = sheet.getDataRange().getValues();
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      products.push({
        code: data[i][0],
        name: data[i][1],
        unit: data[i][2],
        quantity: data[i][3],
        lowStockThreshold: data[i][4],
        category: data[i][5],
        returnable: data[i][6],
        requireRoom: data[i][7],
        requirePatientType: data[i][8],
        createdAt: data[i][9],
        updatedAt: data[i][10]
      });
    }
  }
  
  return products;
}

/**
 * Get low stock products
 */
function getLowStockProducts() {
  const products = getAllProducts();
  return products.filter(function(p) {
    return p.quantity <= p.lowStockThreshold;
  });
}

/**
 * Get transaction logs with filters
 */
function getTransactionLogs(filters) {
  const sheet = getSheet(SHEETS.TRANSACTIONS);
  const data = sheet.getDataRange().getValues();
  const logs = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      const log = {
        id: data[i][0],
        timestamp: data[i][1],
        type: data[i][2],
        productCode: data[i][3],
        productName: data[i][4],
        quantity: data[i][5],
        beforeQty: data[i][6],
        afterQty: data[i][7],
        userName: data[i][8],
        note: data[i][9]
      };
      
      // Apply filters
      if (filters) {
        if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) continue;
        if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate + ' 23:59:59')) continue;
        if (filters.type && log.type !== filters.type) continue;
        if (filters.productCode && log.productCode !== filters.productCode) continue;
        if (filters.userName && log.userName !== filters.userName) continue;
      }
      
      logs.push(log);
    }
  }
  
  return logs;
}
