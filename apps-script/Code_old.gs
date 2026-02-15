/**
 * LINE Inventory Management System
 * Main entry point for Google Apps Script
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  LINE_CHANNEL_ACCESS_TOKEN: PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '',
  LIFF_ID: PropertiesService.getScriptProperties().getProperty('LIFF_ID') || ''
};

/**
 * Handle GET requests - serve HTML pages or API data
 * @param {Object} e - Event object with query parameters
 * @returns {HtmlOutput|TextOutput}
 */
function doGet(e) {
  const params = e.parameter;
  
  // Handle API actions
  if (params.action) {
    return handleGetAction(params);
  }
  
  // Handle liff.state parameter (LIFF converts ?page=xxx to ?liff.state=%3Fpage%3Dxxx)
  if (params['liff.state']) {
    try {
      // Decode liff.state: %3Fpage%3Dproducts -> ?page=products
      var decodedState = decodeURIComponent(params['liff.state']);
      // Extract page parameter from decoded state
      var pageMatch = decodedState.match(/[?&]page=([^&]+)/);
      if (pageMatch) {
        return serveHtml(pageMatch[1]);
      }
    } catch (error) {
      Logger.log('Error parsing liff.state: ' + error);
    }
  }
  
  // Handle direct page requests
  if (params.page) {
    return serveHtml(params.page);
  }
  
  // Default: serve index with client-side routing support
  return serveHtml('index');
}

/**
 * Handle POST requests - process form submissions and LINE webhooks
 * @param {Object} e - Event object with post data
 * @returns {TextOutput}
 */
function doPost(e) {
  try {
    var data;
    
    // Check if it's FormData (from HTML forms)
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return createJsonResponse({ success: false, errorCode: 'E102', message: 'ไม่พบข้อมูล' });
    }
    
    // Check if this is a LINE webhook
    if (data.events) {
      return handleLineWebhook(data);
    }
    
    // Handle API actions
    return handlePostAction(data);
  } catch (error) {
    return createJsonResponse({ success: false, errorCode: 'E102', message: 'คำขอไม่ถูกต้อง: ' + error.message });
  }
}

/**
 * Handle GET API actions
 * @param {Object} params - Query parameters
 * @returns {TextOutput}
 * 
 * Supported actions:
 * - getProducts: Get all products
 * - getProduct: Get product by code (requires ?code=)
 * - searchProducts: Search products by query (requires ?query=)
 * - getLowStock: Get products at or below low stock threshold
 * - getLogs: Get transaction logs with filters
 * - getReport: Get report with filters and summary
 * - getDashboard: Get dashboard statistics
 * 
 * Requirements: 8.3
 */
function handleGetAction(params) {
  const action = params.action;
  
  try {
    switch (action) {
      case 'getProducts':
        return createJsonResponse(ProductService.getAllProducts());
      
      case 'getProduct':
        if (!params.code) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required parameter: code' });
        }
        const product = ProductService.getProductByCode(params.code);
        if (product) {
          return createJsonResponse({ success: true, data: product });
        }
        return createJsonResponse({ success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + params.code });
      
      case 'searchProducts':
        return createJsonResponse(ProductService.searchProducts(params.query || ''));
      
      case 'getLowStock':
        return createJsonResponse(ProductService.getLowStockProducts());
      
      case 'getNextCode':
        return createJsonResponse({ success: true, code: ProductService.generateNextCode() });
      
      case 'getLogs':
        const logFilters = {
          startDate: params.startDate,
          endDate: params.endDate,
          type: params.type,
          productCode: params.productCode,
          userName: params.userName
        };
        return createJsonResponse(TransactionService.getTransactionLogs(logFilters));
      
      case 'getReport':
        const reportFilters = {
          startDate: params.startDate,
          endDate: params.endDate,
          category: params.category,
          transactionType: params.transactionType
        };
        return createJsonResponse(TransactionService.getReport(reportFilters));
      
      case 'getDashboard':
        return createJsonResponse(getDashboardData());
      
      default:
        return createJsonResponse({ success: false, errorCode: 'E102', message: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, errorCode: 'E100', message: 'Server error: ' + error.message });
  }
}

/**
 * Handle POST API actions
 * @param {Object} data - POST data
 * @returns {TextOutput}
 * 
 * Supported actions:
 * - addProduct: Add new product (requires product object)
 * - updateProduct: Update existing product (requires code and updates)
 * - deleteProduct: Delete product (requires code and userName)
 * - withdraw: Process withdrawal (requires productCode, quantity, userName)
 * - receive: Process receipt (requires productCode, quantity, userName)
 * 
 * Requirements: 8.3
 */
function handlePostAction(data) {
  const action = data.action;
  
  if (!action) {
    return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: action' });
  }
  
  try {
    switch (action) {
      case 'addProduct':
        if (!data.product) {
          // Support flat data structure from form
          var productData = {
            name: data.name,
            unit: data.unit,
            quantity: data.quantity,
            lowStockThreshold: data.threshold !== undefined ? data.threshold : data.lowStockThreshold,
            category: data.category,
            returnable: data.returnable,
            userName: data.userName
          };
          return createJsonResponse(ProductService.addProduct(productData));
        }
        return createJsonResponse(ProductService.addProduct(data.product));
      
      case 'updateProduct':
        if (!data.code) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: code' });
        }
        // Support both flat data and nested updates object
        var updates = data.updates || {
          name: data.name,
          unit: data.unit,
          quantity: data.quantity,
          lowStockThreshold: data.threshold !== undefined ? data.threshold : data.lowStockThreshold,
          category: data.category,
          returnable: data.returnable,
          userName: data.userName
        };
        return createJsonResponse(ProductService.updateProduct(data.code, updates));
      
      case 'deleteProduct':
        if (!data.code) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: code' });
        }
        return createJsonResponse(ProductService.deleteProduct(data.code, data.userName || 'System'));
      
      case 'withdraw':
        if (!data.productCode) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: productCode' });
        }
        return createJsonResponse(TransactionService.withdraw(data.productCode, data.quantity, data.userName));
      
      case 'receive':
        if (!data.productCode) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: productCode' });
        }
        return createJsonResponse(TransactionService.receive(data.productCode, data.quantity, data.userName));
      
      case 'return':
        if (!data.productCode) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: productCode' });
        }
        return createJsonResponse(TransactionService.returnProduct(data.productCode, data.quantity, data.userName, data.note));
      
      case 'batchWithdraw':
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
          return createJsonResponse({ success: false, errorCode: 'E102', message: 'Missing required field: items' });
        }
        return createJsonResponse(batchWithdraw(data.items, data.userName));
      
      default:
        return createJsonResponse({ success: false, errorCode: 'E102', message: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createJsonResponse({ success: false, errorCode: 'E100', message: 'Server error: ' + error.message });
  }
}

/**
 * Handle LINE webhook events
 * @param {Object} data - LINE webhook data
 * @returns {TextOutput}
 * 
 * Supported events:
 * - message: User sends a message
 * - follow: User follows the LINE OA
 * - postback: User clicks a postback button
 * 
 * Requirements: 1.1
 */
function handleLineWebhook(data) {
  const events = data.events;
  
  if (!events || !Array.isArray(events)) {
    return ContentService.createTextOutput('OK');
  }
  
  events.forEach(function(event) {
    try {
      // Handle message and follow events by sending the menu
      if (event.type === 'message' || event.type === 'follow') {
        if (event.replyToken) {
          sendFlexMenu(event.replyToken);
        }
      }
      // Handle postback events (for future expansion)
      else if (event.type === 'postback') {
        if (event.replyToken) {
          handlePostback(event);
        }
      }
    } catch (error) {
      console.error('Error handling LINE event:', error);
    }
  });
  
  return ContentService.createTextOutput('OK');
}

/**
 * Handle postback events from LINE
 * @param {Object} event - LINE postback event
 */
function handlePostback(event) {
  // For now, just send the menu for any postback
  // Can be extended to handle specific postback data
  sendFlexMenu(event.replyToken);
}

/**
 * Send Flex Message menu to user
 * @param {string} replyToken - LINE reply token
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
function sendFlexMenu(replyToken) {
  if (!replyToken) {
    console.error('sendFlexMenu: Missing replyToken');
    return;
  }
  
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('sendFlexMenu: LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }
  
  const flexMessage = createFlexMenuMessage();
  
  const payload = {
    replyToken: replyToken,
    messages: [flexMessage]
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      console.error('LINE API error:', responseCode, response.getContentText());
    }
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

/**
 * Create Flex Message menu structure - Premium Carousel Style
 * @returns {Object} Flex message object
 * 

/**
 * Create Flex Message menu structure - Apple Style with badges
 * @returns {Object} Flex message object
 */
function createFlexMenuMessage() {
  const liffId = CONFIG.LIFF_ID;
  const baseUrl = liffId ? 'https://liff.line.me/' + liffId : ScriptApp.getService().getUrl();
  
  // Get stats for badges
  const products = ProductService.getAllProducts();
  const lowStockProducts = ProductService.getLowStockProducts();
  const totalProducts = products.length;
  const lowStockCount = lowStockProducts.length;
  
  return {
    type: 'flex',
    altText: 'เมนูจัดการคลังวัสดุ',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // Header
          {
            type: 'text',
            text: 'คลังวัสดุ',
            weight: 'bold',
            size: 'xl',
            color: '#1d1d1f',
            align: 'center'
          },
          {
            type: 'text',
            text: 'เลือกเมนูที่ต้องการ',
            size: 'sm',
            color: '#86868b',
            align: 'center',
            margin: 'sm'
          },
          // Menu Grid Row 1
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'xl',
            spacing: 'md',
            contents: [
              createMenuCardWithBadge('📥', 'รับเข้า', 'เพิ่มวัสดุเข้าคลัง', null, baseUrl + '#receive'),
              createMenuCardWithBadge('📤', 'เบิก', 'เบิกออกจากคลัง', null, baseUrl + '#withdraw')
            ]
          },
          // Menu Grid Row 2
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            spacing: 'md',
            contents: [
              createMenuCardWithBadge('📊', 'ภาพรวม', 'สถิติคลังวัสดุ', lowStockCount > 0 ? lowStockCount.toString() : null, baseUrl + '#dashboard'),
              createMenuCardWithBadge('📋', 'รายงาน', 'สรุปและวิเคราะห์', null, baseUrl + '#reports')
            ]
          }
        ],
        paddingAll: 'xl',
        backgroundColor: '#ffffff'
      }
    }
  };
}

/**
 * Helper: Create menu card with badge (Apple style)
 */
function createMenuCardWithBadge(icon, label, subtitle, badge, uri) {
  var contents = [
    {
      type: 'text',
      text: icon,
      size: 'xxl',
      align: 'center'
    },
    {
      type: 'text',
      text: label,
      size: 'sm',
      color: '#1d1d1f',
      align: 'center',
      margin: 'md',
      weight: 'bold'
    },
    {
      type: 'text',
      text: subtitle,
      size: 'xxs',
      color: '#86868b',
      align: 'center',
      margin: 'xs',
      wrap: true
    }
  ];
  
  // Add badge if provided
  if (badge) {
    contents.splice(1, 0, {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: badge,
          size: 'xs',
          color: '#ffffff',
          align: 'center',
          weight: 'bold'
        }
      ],
      backgroundColor: '#ff3b30',
      cornerRadius: 'xl',
      paddingAll: 'xs',
      position: 'absolute',
      offsetTop: '5px',
      offsetEnd: '5px',
      width: '24px',
      height: '24px'
    });
  }
  
  return {
    type: 'box',
    layout: 'vertical',
    contents: contents,
    backgroundColor: '#f5f5f7',
    cornerRadius: 'xl',
    paddingAll: 'lg',
    flex: 1,
    action: {
      type: 'uri',
      uri: uri
    }
  };
}

/**
 * Serve HTML page
 * @param {string} page - Page name
 * @returns {HtmlOutput}
 */
function serveHtml(page) {
  try {
    const template = HtmlService.createTemplateFromFile(page);
    template.baseUrl = ScriptApp.getService().getUrl();
    template.liffId = CONFIG.LIFF_ID;
    
    // Pre-load data based on page to reduce API calls
    template.preloadedData = null;
    
    switch (page) {
      case 'products':
      case 'withdraw':
      case 'receive':
      case 'return':
        template.preloadedData = JSON.stringify(ProductService.getAllProducts());
        break;
      case 'dashboard':
        template.preloadedData = JSON.stringify(getDashboardData().data);
        break;
      case 'logs':
        // Preload last 1 month logs
        var today = new Date();
        var oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        var logFilters = {
          startDate: formatDateForFilter(oneMonthAgo),
          endDate: formatDateForFilter(today)
        };
        template.preloadedData = JSON.stringify(TransactionService.getTransactionLogs(logFilters));
        break;
      case 'reports':
        // Preload last 1 month report
        var today2 = new Date();
        var oneMonthAgo2 = new Date(today2);
        oneMonthAgo2.setMonth(oneMonthAgo2.getMonth() - 1);
        var reportFilters = {
          startDate: formatDateForFilter(oneMonthAgo2),
          endDate: formatDateForFilter(today2)
        };
        template.preloadedData = JSON.stringify(TransactionService.getReport(reportFilters));
        break;
    }
    
    return template.evaluate()
      .setTitle('ระบบคลังวัสดุ')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput('<h1>Page not found: ' + page + '</h1>');
  }
}

/**
 * Format date for filter (YYYY-MM-DD)
 */
function formatDateForFilter(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/**
 * Get dashboard data
 * @returns {Object} Dashboard data
 */
function getDashboardData() {
  const products = ProductService.getAllProducts();
  const lowStockProducts = ProductService.getLowStockProducts();
  
  const totalQuantity = products.reduce(function(sum, p) {
    return sum + (p.quantity || 0);
  }, 0);
  
  return {
    success: true,
    data: {
      totalProducts: products.length,
      totalQuantity: totalQuantity,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts
    }
  };
}

/**
 * Process batch withdrawal
 * @param {Array} items - Array of {productCode, quantity}
 * @param {string} userName - User name
 * @returns {Object} Result object
 */
function batchWithdraw(items, userName) {
  if (!userName || userName.trim() === '') {
    return { success: false, errorCode: 'E006', message: 'กรุณาระบุชื่อผู้ทำรายการ' };
  }
  
  var results = [];
  var successCount = 0;
  var failedCount = 0;
  
  items.forEach(function(item) {
    var result = TransactionService.withdraw(item.productCode, item.quantity, userName);
    results.push({
      productCode: item.productCode,
      productName: result.data ? result.data.productName : '',
      quantity: item.quantity,
      success: result.success,
      message: result.message
    });
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  });
  
  return {
    success: successCount > 0,
    message: 'เบิกสำเร็จ ' + successCount + ' รายการ' + (failedCount > 0 ? ', ไม่สำเร็จ ' + failedCount + ' รายการ' : ''),
    data: {
      results: results,
      successCount: successCount,
      failedCount: failedCount
    }
  };
}

/**
 * Create JSON response
 * @param {Object} data - Response data
 * @returns {TextOutput}
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Include HTML file content (for templates)
 * @param {string} filename - File to include
 * @returns {string} File content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ========================================
// Weekly Summary Trigger Functions
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
  const products = ProductService.getAllProducts();
  const lowStockProducts = ProductService.getLowStockProducts();
  
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
  const liffId = CONFIG.LIFF_ID;
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
    const products = ProductService.getAllProducts();
    const lowStockProducts = ProductService.getLowStockProducts();
    
    // Get transactions from last 7 days (excluding today)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Format date range for display (DD/MM format)
    const startDate = Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'dd/MM');
    const endDate = Utilities.formatDate(yesterday, 'Asia/Bangkok', 'dd/MM');
    const dateRange = startDate + ' - ' + endDate;
    
    const recentLogs = TransactionService.getTransactionLogs({
      startDate: Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd'),
      endDate: Utilities.formatDate(yesterday, 'Asia/Bangkok', 'yyyy-MM-dd')
    });
    
    const previousLogs = TransactionService.getTransactionLogs({
      startDate: Utilities.formatDate(fourteenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd'),
      endDate: Utilities.formatDate(sevenDaysAgo, 'Asia/Bangkok', 'yyyy-MM-dd')
    });
    
    // Calculate changes (simplified - in real app, compare actual stock levels)
    const recentActivity = Array.isArray(recentLogs) ? recentLogs.length : (recentLogs.data || []).length;
    const previousActivity = Array.isArray(previousLogs) ? previousLogs.length : (previousLogs.data || []).length;
    
    const activityChange = previousActivity > 0 ? 
      Math.round(((recentActivity - previousActivity) / previousActivity) * 100) : 0;
    
    // Generate mini chart data (last 7 days activity, excluding today)
    const chartData = generateChartData(recentLogs);
    
    return {
      productsChange: 0, // No change in product count typically
      quantityChange: activityChange,
      lowStockChange: lowStockProducts.length > 0 ? -5 : 0, // Example
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
  // Thai day labels starting from Sunday
  const dayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  
  // Calculate which day is today
  const today = new Date();
  
  data.forEach(function(value, index) {
    const heightPercent = Math.round((value / maxValue) * 100);
    
    // Calculate day label (7 days ago to yesterday, not including today)
    const daysAgo = 7 - index; // 7, 6, 5, 4, 3, 2, 1 (yesterday)
    const dayDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayIndex = dayDate.getDay(); // 0=Sunday, 1=Monday, etc.
    // Use dayIndex directly since our dayLabels array starts with Sunday
    
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
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN) {
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
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
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
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN) {
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
      'Authorization': 'Bearer ' + CONFIG.LINE_CHANNEL_ACCESS_TOKEN
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
    const products = ProductService.getAllProducts();
    const lowStockProducts = ProductService.getLowStockProducts();
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
