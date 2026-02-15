/**
 * Transaction Service - Business logic for inventory transactions
 */

var TransactionService = (function() {
  
  // Column indices for Transactions sheet
  var COLUMNS = {
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
  };
  
  // Transaction types
  var TYPES = {
    WITHDRAW: 'WITHDRAW',
    RECEIVE: 'RECEIVE',
    RETURN: 'RETURN',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    CREATE: 'CREATE'
  };
  
  /**
   * Generate unique transaction ID
   * @returns {string} Transaction ID
   */
  function generateId() {
    var timestamp = new Date().getTime();
    var random = Math.floor(Math.random() * 1000);
    return 'TXN' + timestamp + random;
  }
  
  /**
   * Convert row data to Transaction object
   * @param {Array} row - Row data from sheet
   * @returns {Object} Transaction object
   */
  function rowToTransaction(row) {
    return {
      id: row[COLUMNS.ID],
      timestamp: row[COLUMNS.TIMESTAMP],
      type: row[COLUMNS.TYPE],
      productCode: row[COLUMNS.PRODUCT_CODE],
      productName: row[COLUMNS.PRODUCT_NAME],
      quantity: row[COLUMNS.QUANTITY] || 0,
      beforeQuantity: row[COLUMNS.BEFORE_QUANTITY] || 0,
      afterQuantity: row[COLUMNS.AFTER_QUANTITY] || 0,
      userName: row[COLUMNS.USER_NAME],
      note: row[COLUMNS.NOTE] || ''
    };
  }
  
  /**
   * Convert Transaction object to row data
   * @param {Object} transaction - Transaction object
   * @returns {Array} Row data
   */
  function transactionToRow(transaction) {
    return [
      transaction.id,
      transaction.timestamp,
      transaction.type,
      transaction.productCode,
      transaction.productName,
      transaction.quantity,
      transaction.beforeQuantity,
      transaction.afterQuantity,
      transaction.userName,
      transaction.note || ''
    ];
  }
  
  /**
   * Create a transaction log entry
   * @param {Object} log - Log data
   */
  function createLog(log) {
    var transaction = {
      id: generateId(),
      timestamp: new Date(),
      type: log.type,
      productCode: log.productCode,
      productName: log.productName,
      quantity: log.quantity,
      beforeQuantity: log.beforeQuantity,
      afterQuantity: log.afterQuantity,
      userName: log.userName,
      note: log.note || ''
    };
    
    SheetService.writeRow(SheetService.SHEETS.TRANSACTIONS, transactionToRow(transaction));
  }
  
  /**
   * Process a withdrawal
   * @param {string} productCode - Product code
   * @param {number} quantity - Quantity to withdraw
   * @param {string} userName - User name
   * @returns {Object} Result object
   */
  function withdraw(productCode, quantity, userName) {
    // Validate user name
    if (!userName || userName.trim() === '') {
      return { success: false, errorCode: 'E006', message: 'กรุณาระบุชื่อผู้ทำรายการ' };
    }
    
    // Validate quantity
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, errorCode: 'E004', message: 'จำนวนต้องเป็นตัวเลขที่มากกว่า 0' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Get product
      var product = ProductService.getProductByCode(productCode);
      if (!product) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + productCode };
      }
      
      // Check stock
      if (quantity > product.quantity) {
        SheetService.releaseLock(lock);
        return { 
          success: false, 
          errorCode: 'E005', 
          message: 'จำนวนเบิกเกินจำนวนคงเหลือ (คงเหลือ: ' + product.quantity + ')' 
        };
      }
      
      // Calculate new quantity
      var beforeQuantity = product.quantity;
      var afterQuantity = beforeQuantity - quantity;
      
      // Update product quantity
      ProductService.updateQuantity(productCode, afterQuantity);
      
      // Create transaction log
      createLog({
        type: TYPES.WITHDRAW,
        productCode: product.code,
        productName: product.name,
        quantity: quantity,
        beforeQuantity: beforeQuantity,
        afterQuantity: afterQuantity,
        userName: userName.trim(),
        note: 'เบิกวัสดุ'
      });
      
      SheetService.releaseLock(lock);
      
      return { 
        success: true, 
        message: 'เบิกวัสดุสำเร็จ',
        data: {
          productCode: product.code,
          productName: product.name,
          quantity: quantity,
          beforeQuantity: beforeQuantity,
          afterQuantity: afterQuantity
        }
      };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Process a receipt
   * @param {string} productCode - Product code
   * @param {number} quantity - Quantity to receive
   * @param {string} userName - User name
   * @returns {Object} Result object
   */
  function receive(productCode, quantity, userName) {
    // Validate user name
    if (!userName || userName.trim() === '') {
      return { success: false, errorCode: 'E006', message: 'กรุณาระบุชื่อผู้ทำรายการ' };
    }
    
    // Validate quantity
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, errorCode: 'E004', message: 'จำนวนต้องเป็นตัวเลขที่มากกว่า 0' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Get product
      var product = ProductService.getProductByCode(productCode);
      if (!product) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + productCode };
      }
      
      // Calculate new quantity
      var beforeQuantity = product.quantity;
      var afterQuantity = beforeQuantity + quantity;
      
      // Update product quantity
      ProductService.updateQuantity(productCode, afterQuantity);
      
      // Create transaction log
      createLog({
        type: TYPES.RECEIVE,
        productCode: product.code,
        productName: product.name,
        quantity: quantity,
        beforeQuantity: beforeQuantity,
        afterQuantity: afterQuantity,
        userName: userName.trim(),
        note: 'รับเข้าวัสดุ'
      });
      
      SheetService.releaseLock(lock);
      
      return { 
        success: true, 
        message: 'รับเข้าวัสดุสำเร็จ',
        data: {
          productCode: product.code,
          productName: product.name,
          quantity: quantity,
          beforeQuantity: beforeQuantity,
          afterQuantity: afterQuantity
        }
      };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Process a return (คืนวัสดุ)
   * @param {string} productCode - Product code
   * @param {number} quantity - Quantity to return
   * @param {string} userName - User name
   * @param {string} note - Optional note
   * @returns {Object} Result object
   */
  function returnProduct(productCode, quantity, userName, note) {
    // Validate user name
    if (!userName || userName.trim() === '') {
      return { success: false, errorCode: 'E006', message: 'กรุณาระบุชื่อผู้ทำรายการ' };
    }
    
    // Validate quantity
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, errorCode: 'E004', message: 'จำนวนต้องเป็นตัวเลขที่มากกว่า 0' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Get product
      var product = ProductService.getProductByCode(productCode);
      if (!product) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + productCode };
      }
      
      // Check if product is returnable
      if (!product.returnable) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E008', message: 'วัสดุนี้ไม่สามารถคืนได้' };
      }
      
      // Calculate new quantity
      var beforeQuantity = product.quantity;
      var afterQuantity = beforeQuantity + quantity;
      
      // Update product quantity
      ProductService.updateQuantity(productCode, afterQuantity);
      
      // Create transaction log
      createLog({
        type: TYPES.RETURN,
        productCode: product.code,
        productName: product.name,
        quantity: quantity,
        beforeQuantity: beforeQuantity,
        afterQuantity: afterQuantity,
        userName: userName.trim(),
        note: note ? 'คืนวัสดุ: ' + note : 'คืนวัสดุ'
      });
      
      SheetService.releaseLock(lock);
      
      return { 
        success: true, 
        message: 'คืนวัสดุสำเร็จ',
        data: {
          productCode: product.code,
          productName: product.name,
          quantity: quantity,
          beforeQuantity: beforeQuantity,
          afterQuantity: afterQuantity
        }
      };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Get transaction logs with filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of transactions
   */
  function getTransactionLogs(filters) {
    filters = filters || {};
    
    try {
      var data = SheetService.readData(SheetService.SHEETS.TRANSACTIONS);
      var transactions = data.map(rowToTransaction);
      
      // Apply filters
      if (filters.startDate) {
        var startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        transactions = transactions.filter(function(t) {
          return new Date(t.timestamp) >= startDate;
        });
      }
      
      if (filters.endDate) {
        var endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        transactions = transactions.filter(function(t) {
          return new Date(t.timestamp) <= endDate;
        });
      }
      
      if (filters.type) {
        transactions = transactions.filter(function(t) {
          return t.type === filters.type;
        });
      }
      
      if (filters.productCode) {
        transactions = transactions.filter(function(t) {
          return t.productCode === filters.productCode;
        });
      }
      
      if (filters.userName) {
        transactions = transactions.filter(function(t) {
          return t.userName.toLowerCase().indexOf(filters.userName.toLowerCase()) !== -1;
        });
      }
      
      // Sort by timestamp descending
      transactions.sort(function(a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      return transactions;
      
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get report with filters and summary
   * @param {Object} filters - Filter criteria
   * @returns {Object} Report data
   */
  function getReport(filters) {
    filters = filters || {};
    
    var transactions = getTransactionLogs(filters);
    
    // Calculate summary
    var totalWithdrawals = 0;
    var totalReceipts = 0;
    
    transactions.forEach(function(t) {
      if (t.type === TYPES.WITHDRAW) {
        totalWithdrawals += t.quantity;
      } else if (t.type === TYPES.RECEIVE || t.type === TYPES.RETURN) {
        totalReceipts += t.quantity;
      }
    });
    
    var netChange = totalReceipts - totalWithdrawals;
    
    return {
      success: true,
      data: {
        transactions: transactions,
        summary: {
          totalWithdrawals: totalWithdrawals,
          totalReceipts: totalReceipts,
          netChange: netChange,
          transactionCount: transactions.length
        }
      }
    };
  }
  
  // Public API
  return {
    COLUMNS: COLUMNS,
    TYPES: TYPES,
    createLog: createLog,
    withdraw: withdraw,
    receive: receive,
    returnProduct: returnProduct,
    getTransactionLogs: getTransactionLogs,
    getReport: getReport
  };
  
})();
