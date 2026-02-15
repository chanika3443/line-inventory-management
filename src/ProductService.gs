/**
 * Product Service - Business logic for product management
 */

var ProductService = (function() {
  
  // Column indices for Products sheet
  var COLUMNS = {
    CODE: 0,
    NAME: 1,
    UNIT: 2,
    QUANTITY: 3,
    LOW_STOCK_THRESHOLD: 4,
    CATEGORY: 5,
    RETURNABLE: 6,
    CREATED_AT: 7,
    UPDATED_AT: 8
  };
  
  /**
   * Generate next product code automatically
   * Format: P0001, P0002, P0003, ...
   * @returns {string} Next product code
   */
  function generateNextCode() {
    var products = getAllProducts();
    var maxNumber = 0;
    
    products.forEach(function(product) {
      // Extract number from code like P0001, P0002
      var match = product.code.match(/^P(\d+)$/i);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    var nextNumber = maxNumber + 1;
    // Pad with zeros to 4 digits
    var paddedNumber = ('0000' + nextNumber).slice(-4);
    return 'P' + paddedNumber;
  }
  
  /**
   * Convert row data to Product object
   * @param {Array} row - Row data from sheet
   * @returns {Object} Product object
   */
  function rowToProduct(row) {
    return {
      code: row[COLUMNS.CODE],
      name: row[COLUMNS.NAME],
      unit: row[COLUMNS.UNIT],
      quantity: row[COLUMNS.QUANTITY] || 0,
      lowStockThreshold: row[COLUMNS.LOW_STOCK_THRESHOLD] || 0,
      category: row[COLUMNS.CATEGORY] || '',
      returnable: row[COLUMNS.RETURNABLE] === true || row[COLUMNS.RETURNABLE] === 'TRUE' || row[COLUMNS.RETURNABLE] === 'true',
      createdAt: row[COLUMNS.CREATED_AT],
      updatedAt: row[COLUMNS.UPDATED_AT]
    };
  }
  
  /**
   * Convert Product object to row data
   * @param {Object} product - Product object
   * @returns {Array} Row data
   */
  function productToRow(product) {
    return [
      product.code,
      product.name,
      product.unit,
      product.quantity || 0,
      product.lowStockThreshold || 0,
      product.category || '',
      product.returnable === true || product.returnable === 'true' ? 'TRUE' : 'FALSE',
      product.createdAt || new Date(),
      product.updatedAt || new Date()
    ];
  }
  
  /**
   * Get all products (with caching)
   * @returns {Array} Array of Product objects
   */
  function getAllProducts() {
    try {
      return SheetService.getCachedData('sheet_Products', function() {
        var data = SheetService.readData(SheetService.SHEETS.PRODUCTS);
        return data.map(rowToProduct);
      });
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get product by code
   * @param {string} code - Product code
   * @returns {Object|null} Product object or null if not found
   */
  function getProductByCode(code) {
    if (!code) {
      return null;
    }
    
    var data = SheetService.readData(SheetService.SHEETS.PRODUCTS);
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][COLUMNS.CODE] === code) {
        return rowToProduct(data[i]);
      }
    }
    
    return null;
  }
  
  /**
   * Add a new product
   * @param {Object} product - Product data
   * @returns {Object} Result object
   */
  function addProduct(product) {
    // Validate required fields
    if (!product.name || product.name.trim() === '') {
      return { success: false, errorCode: 'E003', message: 'ชื่อวัสดุไม่สามารถว่างได้' };
    }
    
    if (!product.unit || product.unit.trim() === '') {
      return { success: false, errorCode: 'E003', message: 'หน่วยวัสดุไม่สามารถว่างได้' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Auto-generate product code
      var productCode = generateNextCode();
      
      // Prepare product data
      var now = new Date();
      var newProduct = {
        code: productCode,
        name: product.name.trim(),
        unit: product.unit.trim(),
        quantity: parseInt(product.quantity) || 0,
        lowStockThreshold: parseInt(product.lowStockThreshold) || 0,
        category: (product.category || '').trim(),
        createdAt: now,
        updatedAt: now
      };
      
      // Write to sheet
      SheetService.writeRow(SheetService.SHEETS.PRODUCTS, productToRow(newProduct));
      
      // Create transaction log
      TransactionService.createLog({
        type: 'CREATE',
        productCode: newProduct.code,
        productName: newProduct.name,
        quantity: newProduct.quantity,
        beforeQuantity: 0,
        afterQuantity: newProduct.quantity,
        userName: product.userName || 'System',
        note: 'สร้างวัสดุใหม่'
      });
      
      SheetService.releaseLock(lock);
      
      return { success: true, message: 'เพิ่มวัสดุสำเร็จ', data: newProduct };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Update an existing product
   * @param {string} code - Product code
   * @param {Object} updates - Fields to update
   * @returns {Object} Result object
   */
  function updateProduct(code, updates) {
    if (!code) {
      return { success: false, errorCode: 'E001', message: 'รหัสวัสดุไม่สามารถว่างได้' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Find product
      var rowIndex = SheetService.findRow(SheetService.SHEETS.PRODUCTS, COLUMNS.CODE, code);
      if (rowIndex === -1) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + code };
      }
      
      // Get current product
      var data = SheetService.readData(SheetService.SHEETS.PRODUCTS);
      var currentProduct = rowToProduct(data[rowIndex - 1]);
      var beforeQuantity = currentProduct.quantity;
      
      // Apply updates
      var updatedProduct = {
        code: currentProduct.code, // Code cannot be changed
        name: updates.name !== undefined ? updates.name.trim() : currentProduct.name,
        unit: updates.unit !== undefined ? updates.unit.trim() : currentProduct.unit,
        quantity: updates.quantity !== undefined ? parseInt(updates.quantity) : currentProduct.quantity,
        lowStockThreshold: updates.lowStockThreshold !== undefined ? parseInt(updates.lowStockThreshold) : currentProduct.lowStockThreshold,
        category: updates.category !== undefined ? updates.category.trim() : currentProduct.category,
        createdAt: currentProduct.createdAt,
        updatedAt: new Date()
      };
      
      // Validate
      if (!updatedProduct.name) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E003', message: 'ชื่อวัสดุไม่สามารถว่างได้' };
      }
      
      // Update row
      SheetService.updateRow(SheetService.SHEETS.PRODUCTS, rowIndex, productToRow(updatedProduct));
      
      // Create transaction log
      TransactionService.createLog({
        type: 'EDIT',
        productCode: updatedProduct.code,
        productName: updatedProduct.name,
        quantity: Math.abs(updatedProduct.quantity - beforeQuantity),
        beforeQuantity: beforeQuantity,
        afterQuantity: updatedProduct.quantity,
        userName: updates.userName || 'System',
        note: 'แก้ไขข้อมูลวัสดุ'
      });
      
      SheetService.releaseLock(lock);
      
      return { success: true, message: 'อัพเดทวัสดุสำเร็จ', data: updatedProduct };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Delete a product
   * @param {string} code - Product code
   * @param {string} userName - User performing the deletion
   * @returns {Object} Result object
   */
  function deleteProduct(code, userName) {
    if (!code) {
      return { success: false, errorCode: 'E001', message: 'รหัสวัสดุไม่สามารถว่างได้' };
    }
    
    var lock = null;
    try {
      lock = SheetService.acquireLock();
      
      // Find product
      var rowIndex = SheetService.findRow(SheetService.SHEETS.PRODUCTS, COLUMNS.CODE, code);
      if (rowIndex === -1) {
        SheetService.releaseLock(lock);
        return { success: false, errorCode: 'E007', message: 'ไม่พบวัสดุรหัส: ' + code };
      }
      
      // Get product data before deletion
      var data = SheetService.readData(SheetService.SHEETS.PRODUCTS);
      var product = rowToProduct(data[rowIndex - 1]);
      
      // Delete row
      SheetService.deleteRow(SheetService.SHEETS.PRODUCTS, rowIndex);
      
      // Create transaction log
      TransactionService.createLog({
        type: 'DELETE',
        productCode: product.code,
        productName: product.name,
        quantity: product.quantity,
        beforeQuantity: product.quantity,
        afterQuantity: 0,
        userName: userName || 'System',
        note: 'ลบวัสดุ'
      });
      
      SheetService.releaseLock(lock);
      
      return { success: true, message: 'ลบวัสดุสำเร็จ', data: product };
      
    } catch (error) {
      SheetService.releaseLock(lock);
      return { success: false, errorCode: 'E100', message: error.message };
    }
  }
  
  /**
   * Search products by name or code
   * @param {string} query - Search query
   * @returns {Array} Array of matching products
   */
  function searchProducts(query) {
    if (!query) {
      return getAllProducts();
    }
    
    var products = getAllProducts();
    var lowerQuery = query.toLowerCase();
    
    return products.filter(function(product) {
      return product.code.toLowerCase().indexOf(lowerQuery) !== -1 ||
             product.name.toLowerCase().indexOf(lowerQuery) !== -1;
    });
  }
  
  /**
   * Get products with low stock
   * @returns {Array} Array of products at or below threshold
   */
  function getLowStockProducts() {
    var products = getAllProducts();
    
    return products.filter(function(product) {
      return product.quantity <= product.lowStockThreshold;
    });
  }
  
  /**
   * Update product quantity directly (used by TransactionService)
   * @param {string} code - Product code
   * @param {number} newQuantity - New quantity
   * @returns {boolean} Success status
   */
  function updateQuantity(code, newQuantity) {
    var rowIndex = SheetService.findRow(SheetService.SHEETS.PRODUCTS, COLUMNS.CODE, code);
    if (rowIndex === -1) {
      return false;
    }
    
    var data = SheetService.readData(SheetService.SHEETS.PRODUCTS);
    var product = rowToProduct(data[rowIndex - 1]);
    product.quantity = newQuantity;
    product.updatedAt = new Date();
    
    SheetService.updateRow(SheetService.SHEETS.PRODUCTS, rowIndex, productToRow(product));
    return true;
  }
  
  // Public API
  return {
    COLUMNS: COLUMNS,
    generateNextCode: generateNextCode,
    getAllProducts: getAllProducts,
    getProductByCode: getProductByCode,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    searchProducts: searchProducts,
    getLowStockProducts: getLowStockProducts,
    updateQuantity: updateQuantity
  };
  
})();
