/**
 * Sheet Service - Data Layer for Google Sheets operations
 */

var SheetService = (function() {
  
  // Sheet names
  var SHEETS = {
    PRODUCTS: 'Products',
    TRANSACTIONS: 'Transactions',
    SETTINGS: 'Settings'
  };
  
  // Cache duration in seconds (5 minutes for products)
  var CACHE_DURATION = 300;
  
  /**
   * Get cached data or fetch from sheet
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @returns {*} Cached or fresh data
   */
  function getCachedData(key, fetchFn) {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }
    
    var data = fetchFn();
    try {
      cache.put(key, JSON.stringify(data), CACHE_DURATION);
    } catch (e) {
      // Cache might be too large, ignore
    }
    return data;
  }
  
  /**
   * Clear cache for a sheet
   * @param {string} sheetName - Name of the sheet
   */
  function clearCache(sheetName) {
    var cache = CacheService.getScriptCache();
    cache.remove('sheet_' + sheetName);
  }
  
  /**
   * Get the active spreadsheet
   * @returns {Spreadsheet}
   */
  function getSpreadsheet() {
    var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      return SpreadsheetApp.openById(spreadsheetId);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  
  /**
   * Get a sheet by name
   * @param {string} sheetName - Name of the sheet
   * @returns {Sheet|null}
   */
  function getSheet(sheetName) {
    var spreadsheet = getSpreadsheet();
    if (!spreadsheet) {
      throw new Error('E100: ไม่พบ Spreadsheet');
    }
    
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('E100: ไม่พบ Sheet ที่ต้องการ: ' + sheetName);
    }
    
    return sheet;
  }
  
  /**
   * Read all data from a sheet (excluding header row)
   * @param {string} sheetName - Name of the sheet
   * @returns {Array[]} 2D array of data
   */
  function readData(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    if (lastRow <= 1 || lastCol === 0) {
      return [];
    }
    
    return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }
  
  /**
   * Read all data including headers
   * @param {string} sheetName - Name of the sheet
   * @returns {Array[]} 2D array of data with headers
   */
  function readDataWithHeaders(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      return [];
    }
    
    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
  }
  
  /**
   * Write a new row to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} row - Row data to write
   */
  function writeRow(sheetName, row) {
    var sheet = getSheet(sheetName);
    sheet.appendRow(row);
    clearCache(sheetName); // Clear cache after write
  }
  
  /**
   * Update an existing row in a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {number} rowIndex - Row index (1-based, excluding header)
   * @param {Array} row - New row data
   */
  function updateRow(sheetName, rowIndex, row) {
    var sheet = getSheet(sheetName);
    var actualRow = rowIndex + 1; // Account for header row
    
    if (actualRow < 2 || actualRow > sheet.getLastRow()) {
      throw new Error('Invalid row index: ' + rowIndex);
    }
    
    sheet.getRange(actualRow, 1, 1, row.length).setValues([row]);
    clearCache(sheetName); // Clear cache after update
  }
  
  /**
   * Delete a row from a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {number} rowIndex - Row index (1-based, excluding header)
   */
  function deleteRow(sheetName, rowIndex) {
    var sheet = getSheet(sheetName);
    var actualRow = rowIndex + 1; // Account for header row
    
    if (actualRow < 2 || actualRow > sheet.getLastRow()) {
      throw new Error('Invalid row index: ' + rowIndex);
    }
    
    sheet.deleteRow(actualRow);
    clearCache(sheetName); // Clear cache after delete
  }
  
  /**
   * Find a row by column value
   * @param {string} sheetName - Name of the sheet
   * @param {number} column - Column index (0-based)
   * @param {*} value - Value to search for
   * @returns {number} Row index (1-based, excluding header) or -1 if not found
   */
  function findRow(sheetName, column, value) {
    var data = readData(sheetName);
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][column] === value) {
        return i + 1; // Return 1-based index
      }
    }
    
    return -1;
  }
  
  /**
   * Find all rows matching a column value
   * @param {string} sheetName - Name of the sheet
   * @param {number} column - Column index (0-based)
   * @param {*} value - Value to search for
   * @returns {Array} Array of row indices (1-based, excluding header)
   */
  function findAllRows(sheetName, column, value) {
    var data = readData(sheetName);
    var results = [];
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][column] === value) {
        results.push(i + 1);
      }
    }
    
    return results;
  }
  
  /**
   * Acquire a lock for concurrent access
   * @param {number} timeout - Lock timeout in milliseconds (default: 30000)
   * @returns {Lock}
   */
  function acquireLock(timeout) {
    timeout = timeout || 30000;
    var lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(timeout);
      return lock;
    } catch (e) {
      throw new Error('E101: ระบบกำลังประมวลผล กรุณาลองใหม่');
    }
  }
  
  /**
   * Release a lock
   * @param {Lock} lock - Lock to release
   */
  function releaseLock(lock) {
    if (lock) {
      lock.releaseLock();
    }
  }
  
  /**
   * Get the number of data rows (excluding header)
   * @param {string} sheetName - Name of the sheet
   * @returns {number}
   */
  function getRowCount(sheetName) {
    var sheet = getSheet(sheetName);
    return Math.max(0, sheet.getLastRow() - 1);
  }
  
  /**
   * Clear all data from a sheet (keep headers)
   * @param {string} sheetName - Name of the sheet
   */
  function clearData(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  }
  
  // Public API
  return {
    SHEETS: SHEETS,
    getSheet: getSheet,
    getSpreadsheet: getSpreadsheet,
    readData: readData,
    readDataWithHeaders: readDataWithHeaders,
    writeRow: writeRow,
    updateRow: updateRow,
    deleteRow: deleteRow,
    findRow: findRow,
    findAllRows: findAllRows,
    acquireLock: acquireLock,
    releaseLock: releaseLock,
    getRowCount: getRowCount,
    clearData: clearData,
    getCachedData: getCachedData,
    clearCache: clearCache
  };
  
})();
