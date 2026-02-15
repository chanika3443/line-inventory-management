/**
 * Dashboard Service - Business logic for dashboard and reports
 */

var DashboardService = (function() {
  
  /**
   * Get dashboard data including statistics and low stock products
   * @returns {Object} Dashboard data
   * 
   * Requirements: 5.1
   * - Display total product count
   * - Display count of low stock items
   * - Display list of products at or below Low_Stock_Threshold
   */
  function getDashboardData() {
    try {
      var products = ProductService.getAllProducts();
      
      // Calculate statistics
      var totalProducts = products.length;
      var totalQuantity = 0;
      var lowStockProducts = [];
      
      for (var i = 0; i < products.length; i++) {
        var product = products[i];
        totalQuantity += product.quantity || 0;
        
        // Check if product is at or below low stock threshold
        if (product.quantity <= product.lowStockThreshold) {
          lowStockProducts.push(product);
        }
      }
      
      var lowStockCount = lowStockProducts.length;
      
      return {
        success: true,
        data: {
          totalProducts: totalProducts,
          totalQuantity: totalQuantity,
          lowStockCount: lowStockCount,
          lowStockProducts: lowStockProducts
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errorCode: 'E100',
        message: error.message
      };
    }
  }
  
  /**
   * Get report with filters and summary statistics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Report data with summary
   * 
   * Requirements: 7.2, 7.3
   * - Support filters: date range, category, transactionType
   * - Calculate totalWithdrawals, totalReceipts, netChange
   */
  function getReport(filters) {
    filters = filters || {};
    
    try {
      // Get filtered transactions
      var transactions = TransactionService.getTransactionLogs(filters);
      
      // If category filter is specified, filter by product category
      if (filters.category) {
        var productsByCategory = getProductCodesByCategory(filters.category);
        transactions = transactions.filter(function(t) {
          return productsByCategory.indexOf(t.productCode) !== -1;
        });
      }
      
      // Calculate summary statistics
      var totalWithdrawals = 0;
      var totalReceipts = 0;
      
      for (var i = 0; i < transactions.length; i++) {
        var t = transactions[i];
        if (t.type === 'WITHDRAW') {
          totalWithdrawals += t.quantity || 0;
        } else if (t.type === 'RECEIVE') {
          totalReceipts += t.quantity || 0;
        }
      }
      
      var netChange = totalReceipts - totalWithdrawals;
      
      // Get current stock for filtered products if productCode filter is specified
      var currentStock = null;
      if (filters.productCode) {
        var product = ProductService.getProductByCode(filters.productCode);
        if (product) {
          currentStock = product.quantity;
        }
      }
      
      return {
        success: true,
        data: {
          transactions: transactions,
          summary: {
            totalWithdrawals: totalWithdrawals,
            totalReceipts: totalReceipts,
            netChange: netChange,
            transactionCount: transactions.length,
            currentStock: currentStock
          }
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errorCode: 'E100',
        message: error.message
      };
    }
  }
  
  /**
   * Get product codes by category
   * @param {string} category - Category name
   * @returns {Array} Array of product codes
   */
  function getProductCodesByCategory(category) {
    var products = ProductService.getAllProducts();
    var codes = [];
    
    for (var i = 0; i < products.length; i++) {
      if (products[i].category === category) {
        codes.push(products[i].code);
      }
    }
    
    return codes;
  }
  
  // Public API
  return {
    getDashboardData: getDashboardData,
    getReport: getReport
  };
  
})();
