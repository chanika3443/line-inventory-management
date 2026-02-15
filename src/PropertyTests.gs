/**
 * Property-Based Tests for LINE Inventory Management System
 * 
 * Run these tests by executing runAllPropertyTests() from the Apps Script editor
 */

/**
 * Feature: line-inventory-management, Property 1: Product CRUD Round-Trip
 * Validates: Requirements 2.2
 * 
 * For any valid product input, adding the product and then retrieving it by code 
 * should return an equivalent product with matching code, name, unit, quantity, 
 * and threshold values.
 */
function testProperty1_ProductCRUDRoundTrip() {
  return TestFramework.propertyTest(
    'Property 1: Product CRUD Round-Trip (Validates: Requirements 2.2)',
    function() {
      // Generate random product
      var inputProduct = TestFramework.generateProduct();
      
      // Ensure unique code for this test
      inputProduct.code = 'PBT1-' + TestFramework.randomString(8);
      
      // Add product
      var addResult = ProductService.addProduct(inputProduct);
      
      // Check add was successful
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product', 
          error: addResult.message,
          input: inputProduct 
        };
      }
      
      // Retrieve product by code
      var retrievedProduct = ProductService.getProductByCode(inputProduct.code);
      
      // Check product was retrieved
      if (!retrievedProduct) {
        // Cleanup attempt
        ProductService.deleteProduct(inputProduct.code, 'TestCleanup');
        return { 
          success: false, 
          message: 'Failed to retrieve product after adding',
          input: inputProduct 
        };
      }
      
      // Verify round-trip consistency
      var codeMatch = retrievedProduct.code === inputProduct.code;
      var nameMatch = retrievedProduct.name === inputProduct.name.trim();
      var unitMatch = retrievedProduct.unit === inputProduct.unit.trim();
      var quantityMatch = retrievedProduct.quantity === (parseInt(inputProduct.quantity) || 0);
      var thresholdMatch = retrievedProduct.lowStockThreshold === (parseInt(inputProduct.lowStockThreshold) || 0);
      
      // Cleanup - delete the test product
      ProductService.deleteProduct(inputProduct.code, 'TestCleanup');
      
      if (!codeMatch || !nameMatch || !unitMatch || !quantityMatch || !thresholdMatch) {
        return {
          success: false,
          message: 'Round-trip mismatch',
          input: inputProduct,
          retrieved: retrievedProduct,
          matches: {
            code: codeMatch,
            name: nameMatch,
            unit: unitMatch,
            quantity: quantityMatch,
            threshold: thresholdMatch
          }
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 4: Product Code Uniqueness
 * Validates: Requirements 2.5, 2.6
 * 
 * For any two product creation attempts with the same product code, only the first 
 * should succeed, and the second should return an error result with success=false.
 */
function testProperty4_ProductCodeUniqueness() {
  return TestFramework.propertyTest(
    'Property 4: Product Code Uniqueness (Validates: Requirements 2.5, 2.6)',
    function() {
      // Generate a unique product code for this test
      var uniqueCode = 'PBT4-' + TestFramework.randomString(8);
      
      // Generate two products with the same code
      var product1 = TestFramework.generateProduct();
      product1.code = uniqueCode;
      
      var product2 = TestFramework.generateProduct();
      product2.code = uniqueCode; // Same code as product1
      
      // First addition should succeed
      var result1 = ProductService.addProduct(product1);
      
      if (!result1.success) {
        return { 
          success: false, 
          message: 'First product addition should succeed', 
          error: result1.message,
          input: product1 
        };
      }
      
      // Second addition with same code should fail
      var result2 = ProductService.addProduct(product2);
      
      // Cleanup - delete the test product
      ProductService.deleteProduct(uniqueCode, 'TestCleanup');
      
      if (result2.success) {
        return {
          success: false,
          message: 'Second product addition with duplicate code should fail',
          code: uniqueCode,
          result1: result1,
          result2: result2
        };
      }
      
      // Verify error code is E002 (duplicate code)
      if (result2.errorCode !== 'E002') {
        return {
          success: false,
          message: 'Expected error code E002 for duplicate product',
          actualErrorCode: result2.errorCode,
          actualMessage: result2.message
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 2: Product Update Consistency
 * Validates: Requirements 2.3
 * 
 * For any existing product and valid update data, updating the product and then 
 * retrieving it should reflect all the updated values while preserving unchanged fields.
 */
function testProperty2_ProductUpdateConsistency() {
  return TestFramework.propertyTest(
    'Property 2: Product Update Consistency (Validates: Requirements 2.3)',
    function() {
      // Generate and add a product
      var originalProduct = TestFramework.generateProduct();
      originalProduct.code = 'PBT2-' + TestFramework.randomString(8);
      
      var addResult = ProductService.addProduct(originalProduct);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for update test', 
          error: addResult.message 
        };
      }
      
      // Generate random updates (some fields updated, some not)
      var updates = {};
      var updatedFields = [];
      
      // Randomly decide which fields to update
      if (Math.random() > 0.5) {
        updates.name = 'Updated Name ' + TestFramework.randomString(4);
        updatedFields.push('name');
      }
      if (Math.random() > 0.5) {
        updates.unit = ['ชิ้น', 'กล่อง', 'แพ็ค'][TestFramework.randomInt(0, 2)];
        updatedFields.push('unit');
      }
      if (Math.random() > 0.5) {
        updates.quantity = TestFramework.randomInt(0, 200);
        updatedFields.push('quantity');
      }
      if (Math.random() > 0.5) {
        updates.lowStockThreshold = TestFramework.randomInt(1, 30);
        updatedFields.push('lowStockThreshold');
      }
      if (Math.random() > 0.5) {
        updates.category = ['อุปกรณ์', 'วัสดุ', 'เครื่องมือ'][TestFramework.randomInt(0, 2)];
        updatedFields.push('category');
      }
      
      updates.userName = 'TestUser';
      
      // Perform update
      var updateResult = ProductService.updateProduct(originalProduct.code, updates);
      
      if (!updateResult.success) {
        ProductService.deleteProduct(originalProduct.code, 'TestCleanup');
        return { 
          success: false, 
          message: 'Update failed', 
          error: updateResult.message,
          updates: updates
        };
      }
      
      // Retrieve updated product
      var retrievedProduct = ProductService.getProductByCode(originalProduct.code);
      
      // Cleanup
      ProductService.deleteProduct(originalProduct.code, 'TestCleanup');
      
      if (!retrievedProduct) {
        return { 
          success: false, 
          message: 'Failed to retrieve product after update' 
        };
      }
      
      // Verify updated fields have new values
      var mismatches = [];
      
      if (updates.name !== undefined && retrievedProduct.name !== updates.name) {
        mismatches.push({ field: 'name', expected: updates.name, actual: retrievedProduct.name });
      }
      if (updates.unit !== undefined && retrievedProduct.unit !== updates.unit) {
        mismatches.push({ field: 'unit', expected: updates.unit, actual: retrievedProduct.unit });
      }
      if (updates.quantity !== undefined && retrievedProduct.quantity !== updates.quantity) {
        mismatches.push({ field: 'quantity', expected: updates.quantity, actual: retrievedProduct.quantity });
      }
      if (updates.lowStockThreshold !== undefined && retrievedProduct.lowStockThreshold !== updates.lowStockThreshold) {
        mismatches.push({ field: 'lowStockThreshold', expected: updates.lowStockThreshold, actual: retrievedProduct.lowStockThreshold });
      }
      if (updates.category !== undefined && retrievedProduct.category !== updates.category) {
        mismatches.push({ field: 'category', expected: updates.category, actual: retrievedProduct.category });
      }
      
      // Verify unchanged fields preserved original values
      if (updates.name === undefined && retrievedProduct.name !== originalProduct.name.trim()) {
        mismatches.push({ field: 'name (unchanged)', expected: originalProduct.name.trim(), actual: retrievedProduct.name });
      }
      if (updates.unit === undefined && retrievedProduct.unit !== originalProduct.unit.trim()) {
        mismatches.push({ field: 'unit (unchanged)', expected: originalProduct.unit.trim(), actual: retrievedProduct.unit });
      }
      
      // Code should never change
      if (retrievedProduct.code !== originalProduct.code) {
        mismatches.push({ field: 'code', expected: originalProduct.code, actual: retrievedProduct.code });
      }
      
      if (mismatches.length > 0) {
        return {
          success: false,
          message: 'Update consistency mismatch',
          mismatches: mismatches,
          original: originalProduct,
          updates: updates,
          retrieved: retrievedProduct
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 3: Product Deletion Completeness
 * Validates: Requirements 2.4
 * 
 * For any existing product, after deletion, retrieving the product by code should 
 * return null, and a transaction log entry of type 'DELETE' should exist for that product.
 */
function testProperty3_ProductDeletionCompleteness() {
  return TestFramework.propertyTest(
    'Property 3: Product Deletion Completeness (Validates: Requirements 2.4)',
    function() {
      // Generate and add a product
      var product = TestFramework.generateProduct();
      product.code = 'PBT3-' + TestFramework.randomString(8);
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for deletion test', 
          error: addResult.message 
        };
      }
      
      // Verify product exists before deletion
      var beforeDelete = ProductService.getProductByCode(product.code);
      if (!beforeDelete) {
        return { 
          success: false, 
          message: 'Product not found after adding' 
        };
      }
      
      // Delete the product
      var deleteResult = ProductService.deleteProduct(product.code, 'TestUser');
      
      if (!deleteResult.success) {
        // Try cleanup anyway
        ProductService.deleteProduct(product.code, 'TestCleanup');
        return { 
          success: false, 
          message: 'Delete operation failed', 
          error: deleteResult.message 
        };
      }
      
      // Verify product no longer exists
      var afterDelete = ProductService.getProductByCode(product.code);
      if (afterDelete !== null) {
        // Cleanup
        ProductService.deleteProduct(product.code, 'TestCleanup');
        return {
          success: false,
          message: 'Product still exists after deletion',
          productCode: product.code,
          retrievedProduct: afterDelete
        };
      }
      
      // Verify DELETE transaction log exists
      var logs = TransactionService.getTransactionLogs({ productCode: product.code });
      var deleteLog = logs.find(function(log) {
        return log.type === 'DELETE' && log.productCode === product.code;
      });
      
      if (!deleteLog) {
        return {
          success: false,
          message: 'DELETE transaction log not found',
          productCode: product.code,
          logs: logs
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 10: Low Stock Detection
 * Validates: Requirements 5.2, 5.3
 * 
 * For any set of products, getLowStockProducts should return exactly those products 
 * where quantity <= lowStockThreshold, and no products where quantity > lowStockThreshold.
 */
function testProperty10_LowStockDetection() {
  return TestFramework.propertyTest(
    'Property 10: Low Stock Detection (Validates: Requirements 5.2, 5.3)',
    function() {
      // Generate test products with varying stock levels
      var testProducts = [];
      var numProducts = TestFramework.randomInt(3, 6);
      
      for (var i = 0; i < numProducts; i++) {
        var product = TestFramework.generateProduct();
        product.code = 'PBT10-' + TestFramework.randomString(6) + '-' + i;
        
        // Randomly set quantity relative to threshold
        var threshold = TestFramework.randomInt(5, 20);
        product.lowStockThreshold = threshold;
        
        // 50% chance of being low stock
        if (Math.random() > 0.5) {
          // Low stock: quantity <= threshold
          product.quantity = TestFramework.randomInt(0, threshold);
        } else {
          // Normal stock: quantity > threshold
          product.quantity = threshold + TestFramework.randomInt(1, 50);
        }
        
        var addResult = ProductService.addProduct(product);
        if (addResult.success) {
          testProducts.push(product);
        }
      }
      
      if (testProducts.length === 0) {
        return { 
          success: false, 
          message: 'Failed to create any test products' 
        };
      }
      
      // Get low stock products
      var lowStockProducts = ProductService.getLowStockProducts();
      
      // Filter to only our test products
      var ourLowStockProducts = lowStockProducts.filter(function(p) {
        return p.code.indexOf('PBT10-') === 0;
      });
      
      // Calculate expected low stock products from our test set
      var expectedLowStock = testProducts.filter(function(p) {
        return p.quantity <= p.lowStockThreshold;
      });
      
      // Cleanup test products
      testProducts.forEach(function(p) {
        ProductService.deleteProduct(p.code, 'TestCleanup');
      });
      
      // Verify counts match
      if (ourLowStockProducts.length !== expectedLowStock.length) {
        return {
          success: false,
          message: 'Low stock count mismatch',
          expected: expectedLowStock.length,
          actual: ourLowStockProducts.length,
          expectedProducts: expectedLowStock.map(function(p) { 
            return { code: p.code, qty: p.quantity, threshold: p.lowStockThreshold }; 
          }),
          actualProducts: ourLowStockProducts.map(function(p) { 
            return { code: p.code, qty: p.quantity, threshold: p.lowStockThreshold }; 
          })
        };
      }
      
      // Verify all returned products are actually low stock
      for (var j = 0; j < ourLowStockProducts.length; j++) {
        var p = ourLowStockProducts[j];
        if (p.quantity > p.lowStockThreshold) {
          return {
            success: false,
            message: 'Product returned as low stock but quantity > threshold',
            product: { code: p.code, quantity: p.quantity, threshold: p.lowStockThreshold }
          };
        }
      }
      
      // Verify all expected low stock products are in the result
      for (var k = 0; k < expectedLowStock.length; k++) {
        var expected = expectedLowStock[k];
        var found = ourLowStockProducts.find(function(p) {
          return p.code === expected.code;
        });
        if (!found) {
          return {
            success: false,
            message: 'Expected low stock product not found in results',
            missingProduct: { code: expected.code, quantity: expected.quantity, threshold: expected.lowStockThreshold }
          };
        }
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 5: Withdrawal Stock Validation
 * Validates: Requirements 3.2, 3.3
 * 
 * For any withdrawal request where the requested quantity exceeds the current stock,
 * the system should reject the request (success=false) and the product quantity 
 * should remain unchanged.
 */
function testProperty5_WithdrawalStockValidation() {
  return TestFramework.propertyTest(
    'Property 5: Withdrawal Stock Validation (Validates: Requirements 3.2, 3.3)',
    function() {
      // Generate and add a product with known quantity
      var product = TestFramework.generateProduct();
      product.code = 'PBT5-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(1, 50); // Ensure some stock
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for withdrawal test', 
          error: addResult.message 
        };
      }
      
      // Get the actual product to confirm quantity
      var beforeProduct = ProductService.getProductByCode(product.code);
      var originalQuantity = beforeProduct.quantity;
      
      // Try to withdraw more than available stock
      var excessQuantity = originalQuantity + TestFramework.randomInt(1, 100);
      var withdrawResult = TransactionService.withdraw(product.code, excessQuantity, 'TestUser');
      
      // Get product after attempted withdrawal
      var afterProduct = ProductService.getProductByCode(product.code);
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify withdrawal was rejected
      if (withdrawResult.success) {
        return {
          success: false,
          message: 'Withdrawal should have been rejected when quantity exceeds stock',
          productCode: product.code,
          originalStock: originalQuantity,
          attemptedWithdrawal: excessQuantity,
          result: withdrawResult
        };
      }
      
      // Verify error code is E005 (exceeds stock)
      if (withdrawResult.errorCode !== 'E005') {
        return {
          success: false,
          message: 'Expected error code E005 for exceeding stock',
          actualErrorCode: withdrawResult.errorCode,
          actualMessage: withdrawResult.message
        };
      }
      
      // Verify quantity remained unchanged
      if (afterProduct.quantity !== originalQuantity) {
        return {
          success: false,
          message: 'Product quantity should remain unchanged after rejected withdrawal',
          originalQuantity: originalQuantity,
          afterQuantity: afterProduct.quantity
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 6: Withdrawal Quantity Deduction
 * Validates: Requirements 3.4
 * 
 * For any valid withdrawal (quantity <= stock), the product's quantity after withdrawal 
 * should equal (beforeQuantity - withdrawnQuantity), and a transaction log should be 
 * created with correct before/after values.
 */
function testProperty6_WithdrawalQuantityDeduction() {
  return TestFramework.propertyTest(
    'Property 6: Withdrawal Quantity Deduction (Validates: Requirements 3.4)',
    function() {
      // Generate and add a product with sufficient quantity
      var product = TestFramework.generateProduct();
      product.code = 'PBT6-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(20, 100); // Ensure enough stock
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for withdrawal test', 
          error: addResult.message 
        };
      }
      
      // Get the actual product to confirm quantity
      var beforeProduct = ProductService.getProductByCode(product.code);
      var beforeQuantity = beforeProduct.quantity;
      
      // Withdraw a valid amount (less than or equal to stock)
      var withdrawQuantity = TestFramework.randomInt(1, beforeQuantity);
      var expectedAfterQuantity = beforeQuantity - withdrawQuantity;
      
      var withdrawResult = TransactionService.withdraw(product.code, withdrawQuantity, 'TestUser');
      
      // Get product after withdrawal
      var afterProduct = ProductService.getProductByCode(product.code);
      
      // Get transaction log
      var logs = TransactionService.getTransactionLogs({ productCode: product.code });
      var withdrawLog = logs.find(function(log) {
        return log.type === 'WITHDRAW' && log.productCode === product.code;
      });
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify withdrawal was successful
      if (!withdrawResult.success) {
        return {
          success: false,
          message: 'Valid withdrawal should succeed',
          productCode: product.code,
          beforeQuantity: beforeQuantity,
          withdrawQuantity: withdrawQuantity,
          result: withdrawResult
        };
      }
      
      // Verify quantity was correctly deducted
      if (afterProduct.quantity !== expectedAfterQuantity) {
        return {
          success: false,
          message: 'Quantity deduction incorrect',
          beforeQuantity: beforeQuantity,
          withdrawQuantity: withdrawQuantity,
          expectedAfterQuantity: expectedAfterQuantity,
          actualAfterQuantity: afterProduct.quantity
        };
      }
      
      // Verify transaction log exists with correct values
      if (!withdrawLog) {
        return {
          success: false,
          message: 'WITHDRAW transaction log not found',
          productCode: product.code
        };
      }
      
      if (withdrawLog.beforeQuantity !== beforeQuantity) {
        return {
          success: false,
          message: 'Transaction log beforeQuantity incorrect',
          expected: beforeQuantity,
          actual: withdrawLog.beforeQuantity
        };
      }
      
      if (withdrawLog.afterQuantity !== expectedAfterQuantity) {
        return {
          success: false,
          message: 'Transaction log afterQuantity incorrect',
          expected: expectedAfterQuantity,
          actual: withdrawLog.afterQuantity
        };
      }
      
      if (withdrawLog.quantity !== withdrawQuantity) {
        return {
          success: false,
          message: 'Transaction log quantity incorrect',
          expected: withdrawQuantity,
          actual: withdrawLog.quantity
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 7: Receipt Quantity Addition
 * Validates: Requirements 4.2
 * 
 * For any valid receipt (positive quantity), the product's quantity after receipt 
 * should equal (beforeQuantity + receivedQuantity), and a transaction log should be 
 * created with correct before/after values.
 */
function testProperty7_ReceiptQuantityAddition() {
  return TestFramework.propertyTest(
    'Property 7: Receipt Quantity Addition (Validates: Requirements 4.2)',
    function() {
      // Generate and add a product
      var product = TestFramework.generateProduct();
      product.code = 'PBT7-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(0, 50);
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for receipt test', 
          error: addResult.message 
        };
      }
      
      // Get the actual product to confirm quantity
      var beforeProduct = ProductService.getProductByCode(product.code);
      var beforeQuantity = beforeProduct.quantity;
      
      // Receive a positive quantity
      var receiveQuantity = TestFramework.randomInt(1, 100);
      var expectedAfterQuantity = beforeQuantity + receiveQuantity;
      
      var receiveResult = TransactionService.receive(product.code, receiveQuantity, 'TestUser');
      
      // Get product after receipt
      var afterProduct = ProductService.getProductByCode(product.code);
      
      // Get transaction log
      var logs = TransactionService.getTransactionLogs({ productCode: product.code });
      var receiveLog = logs.find(function(log) {
        return log.type === 'RECEIVE' && log.productCode === product.code;
      });
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify receipt was successful
      if (!receiveResult.success) {
        return {
          success: false,
          message: 'Valid receipt should succeed',
          productCode: product.code,
          beforeQuantity: beforeQuantity,
          receiveQuantity: receiveQuantity,
          result: receiveResult
        };
      }
      
      // Verify quantity was correctly added
      if (afterProduct.quantity !== expectedAfterQuantity) {
        return {
          success: false,
          message: 'Quantity addition incorrect',
          beforeQuantity: beforeQuantity,
          receiveQuantity: receiveQuantity,
          expectedAfterQuantity: expectedAfterQuantity,
          actualAfterQuantity: afterProduct.quantity
        };
      }
      
      // Verify transaction log exists with correct values
      if (!receiveLog) {
        return {
          success: false,
          message: 'RECEIVE transaction log not found',
          productCode: product.code
        };
      }
      
      if (receiveLog.beforeQuantity !== beforeQuantity) {
        return {
          success: false,
          message: 'Transaction log beforeQuantity incorrect',
          expected: beforeQuantity,
          actual: receiveLog.beforeQuantity
        };
      }
      
      if (receiveLog.afterQuantity !== expectedAfterQuantity) {
        return {
          success: false,
          message: 'Transaction log afterQuantity incorrect',
          expected: expectedAfterQuantity,
          actual: receiveLog.afterQuantity
        };
      }
      
      if (receiveLog.quantity !== receiveQuantity) {
        return {
          success: false,
          message: 'Transaction log quantity incorrect',
          expected: receiveQuantity,
          actual: receiveLog.quantity
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 8: Transaction User Name Requirement
 * Validates: Requirements 3.5, 4.3, 9.1
 * 
 * For any withdrawal or receipt request with an empty or whitespace-only userName,
 * the system should reject the request (success=false) and no changes should be 
 * made to product quantity.
 */
function testProperty8_TransactionUserNameRequirement() {
  return TestFramework.propertyTest(
    'Property 8: Transaction User Name Requirement (Validates: Requirements 3.5, 4.3, 9.1)',
    function() {
      // Generate and add a product
      var product = TestFramework.generateProduct();
      product.code = 'PBT8-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(10, 100);
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for user name test', 
          error: addResult.message 
        };
      }
      
      // Get the actual product to confirm quantity
      var beforeProduct = ProductService.getProductByCode(product.code);
      var originalQuantity = beforeProduct.quantity;
      
      // Generate invalid user names (empty or whitespace-only)
      var invalidUserNames = ['', '   ', '\t', '\n', '  \t  '];
      var invalidUserName = invalidUserNames[TestFramework.randomInt(0, invalidUserNames.length - 1)];
      
      // Randomly test either withdraw or receive
      var testWithdraw = Math.random() > 0.5;
      var quantity = TestFramework.randomInt(1, 10);
      var result;
      
      if (testWithdraw) {
        result = TransactionService.withdraw(product.code, quantity, invalidUserName);
      } else {
        result = TransactionService.receive(product.code, quantity, invalidUserName);
      }
      
      // Get product after attempted transaction
      var afterProduct = ProductService.getProductByCode(product.code);
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify transaction was rejected
      if (result.success) {
        return {
          success: false,
          message: 'Transaction should have been rejected with empty/whitespace userName',
          transactionType: testWithdraw ? 'WITHDRAW' : 'RECEIVE',
          userName: JSON.stringify(invalidUserName),
          result: result
        };
      }
      
      // Verify error code is E006 (empty user name)
      if (result.errorCode !== 'E006') {
        return {
          success: false,
          message: 'Expected error code E006 for empty user name',
          actualErrorCode: result.errorCode,
          actualMessage: result.message
        };
      }
      
      // Verify quantity remained unchanged
      if (afterProduct.quantity !== originalQuantity) {
        return {
          success: false,
          message: 'Product quantity should remain unchanged after rejected transaction',
          originalQuantity: originalQuantity,
          afterQuantity: afterProduct.quantity
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 9: Positive Quantity Validation
 * Validates: Requirements 4.5
 * 
 * For any receipt request with quantity <= 0, the system should reject the request 
 * (success=false) and no changes should be made to product quantity.
 */
function testProperty9_PositiveQuantityValidation() {
  return TestFramework.propertyTest(
    'Property 9: Positive Quantity Validation (Validates: Requirements 4.5)',
    function() {
      // Generate and add a product
      var product = TestFramework.generateProduct();
      product.code = 'PBT9-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(10, 100);
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for quantity validation test', 
          error: addResult.message 
        };
      }
      
      // Get the actual product to confirm quantity
      var beforeProduct = ProductService.getProductByCode(product.code);
      var originalQuantity = beforeProduct.quantity;
      
      // Generate invalid quantities (zero or negative)
      var invalidQuantities = [0, -1, -10, -100];
      var invalidQuantity = invalidQuantities[TestFramework.randomInt(0, invalidQuantities.length - 1)];
      
      // Try to receive with invalid quantity
      var result = TransactionService.receive(product.code, invalidQuantity, 'TestUser');
      
      // Get product after attempted receipt
      var afterProduct = ProductService.getProductByCode(product.code);
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify receipt was rejected
      if (result.success) {
        return {
          success: false,
          message: 'Receipt should have been rejected with non-positive quantity',
          quantity: invalidQuantity,
          result: result
        };
      }
      
      // Verify error code is E004 (invalid quantity)
      if (result.errorCode !== 'E004') {
        return {
          success: false,
          message: 'Expected error code E004 for non-positive quantity',
          actualErrorCode: result.errorCode,
          actualMessage: result.message
        };
      }
      
      // Verify quantity remained unchanged
      if (afterProduct.quantity !== originalQuantity) {
        return {
          success: false,
          message: 'Product quantity should remain unchanged after rejected receipt',
          originalQuantity: originalQuantity,
          afterQuantity: afterProduct.quantity
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 12: Transaction Log Completeness
 * Validates: Requirements 6.1, 9.2
 * 
 * For any transaction (withdraw/receive/edit/delete), a log entry should exist 
 * containing: timestamp, type, productCode, productName, quantity, beforeQuantity, 
 * afterQuantity, and userName (all non-empty for required fields).
 */
function testProperty12_TransactionLogCompleteness() {
  return TestFramework.propertyTest(
    'Property 12: Transaction Log Completeness (Validates: Requirements 6.1, 9.2)',
    function() {
      // Generate and add a product
      var product = TestFramework.generateProduct();
      product.code = 'PBT12-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(20, 100);
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for log completeness test', 
          error: addResult.message 
        };
      }
      
      // Randomly choose a transaction type to test
      var transactionTypes = ['WITHDRAW', 'RECEIVE'];
      var transactionType = transactionTypes[TestFramework.randomInt(0, transactionTypes.length - 1)];
      var userName = 'TestUser' + TestFramework.randomString(4);
      var quantity = TestFramework.randomInt(1, 10);
      
      var result;
      if (transactionType === 'WITHDRAW') {
        result = TransactionService.withdraw(product.code, quantity, userName);
      } else {
        result = TransactionService.receive(product.code, quantity, userName);
      }
      
      if (!result.success) {
        ProductService.deleteProduct(product.code, 'TestCleanup');
        return { 
          success: false, 
          message: 'Transaction failed', 
          error: result.message 
        };
      }
      
      // Get the transaction log
      var logs = TransactionService.getTransactionLogs({ productCode: product.code });
      var transactionLog = logs.find(function(log) {
        return log.type === transactionType && log.productCode === product.code;
      });
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      // Verify log exists
      if (!transactionLog) {
        return {
          success: false,
          message: 'Transaction log not found',
          transactionType: transactionType,
          productCode: product.code
        };
      }
      
      // Verify all required fields are present and non-empty
      var requiredFields = ['id', 'timestamp', 'type', 'productCode', 'productName', 'userName'];
      var numericFields = ['quantity', 'beforeQuantity', 'afterQuantity'];
      
      for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (!transactionLog[field] || transactionLog[field] === '') {
          return {
            success: false,
            message: 'Required field is empty or missing',
            field: field,
            value: transactionLog[field],
            log: transactionLog
          };
        }
      }
      
      // Verify numeric fields are numbers
      for (var j = 0; j < numericFields.length; j++) {
        var numField = numericFields[j];
        if (typeof transactionLog[numField] !== 'number') {
          return {
            success: false,
            message: 'Numeric field is not a number',
            field: numField,
            value: transactionLog[numField],
            type: typeof transactionLog[numField]
          };
        }
      }
      
      // Verify type matches
      if (transactionLog.type !== transactionType) {
        return {
          success: false,
          message: 'Transaction type mismatch',
          expected: transactionType,
          actual: transactionLog.type
        };
      }
      
      // Verify userName matches
      if (transactionLog.userName !== userName) {
        return {
          success: false,
          message: 'User name mismatch',
          expected: userName,
          actual: transactionLog.userName
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Feature: line-inventory-management, Property 13: Log Filtering Correctness
 * Validates: Requirements 6.2, 6.3
 * 
 * For any filter criteria (date range, type, product, userName), getTransactionLogs 
 * should return only logs that match ALL specified filter criteria, sorted by 
 * timestamp in descending order.
 */
function testProperty13_LogFilteringCorrectness() {
  return TestFramework.propertyTest(
    'Property 13: Log Filtering Correctness (Validates: Requirements 6.2, 6.3)',
    function() {
      // Create multiple products and transactions for filtering test
      var products = [];
      var numProducts = 2;
      
      for (var i = 0; i < numProducts; i++) {
        var product = TestFramework.generateProduct();
        product.code = 'PBT13-' + TestFramework.randomString(6) + '-' + i;
        product.quantity = TestFramework.randomInt(50, 100);
        
        var addResult = ProductService.addProduct(product);
        if (addResult.success) {
          products.push(product);
        }
      }
      
      if (products.length < 2) {
        // Cleanup
        products.forEach(function(p) {
          ProductService.deleteProduct(p.code, 'TestCleanup');
        });
        return { 
          success: false, 
          message: 'Failed to create enough test products' 
        };
      }
      
      // Create transactions with different types and users
      var userNames = ['UserA', 'UserB'];
      var transactions = [];
      
      // Create WITHDRAW for product 0
      var w1 = TransactionService.withdraw(products[0].code, 5, userNames[0]);
      if (w1.success) transactions.push({ type: 'WITHDRAW', productCode: products[0].code, userName: userNames[0] });
      
      // Create RECEIVE for product 1
      var r1 = TransactionService.receive(products[1].code, 10, userNames[1]);
      if (r1.success) transactions.push({ type: 'RECEIVE', productCode: products[1].code, userName: userNames[1] });
      
      // Create another WITHDRAW for product 1
      var w2 = TransactionService.withdraw(products[1].code, 3, userNames[0]);
      if (w2.success) transactions.push({ type: 'WITHDRAW', productCode: products[1].code, userName: userNames[0] });
      
      // Test filtering by type
      var withdrawLogs = TransactionService.getTransactionLogs({ type: 'WITHDRAW' });
      var ourWithdrawLogs = withdrawLogs.filter(function(log) {
        return log.productCode.indexOf('PBT13-') === 0;
      });
      
      // Verify all returned logs are WITHDRAW type
      for (var j = 0; j < ourWithdrawLogs.length; j++) {
        if (ourWithdrawLogs[j].type !== 'WITHDRAW') {
          // Cleanup
          products.forEach(function(p) {
            ProductService.deleteProduct(p.code, 'TestCleanup');
          });
          return {
            success: false,
            message: 'Filter by type returned wrong type',
            expected: 'WITHDRAW',
            actual: ourWithdrawLogs[j].type
          };
        }
      }
      
      // Test filtering by productCode
      var product0Logs = TransactionService.getTransactionLogs({ productCode: products[0].code });
      for (var k = 0; k < product0Logs.length; k++) {
        if (product0Logs[k].productCode !== products[0].code) {
          // Cleanup
          products.forEach(function(p) {
            ProductService.deleteProduct(p.code, 'TestCleanup');
          });
          return {
            success: false,
            message: 'Filter by productCode returned wrong product',
            expected: products[0].code,
            actual: product0Logs[k].productCode
          };
        }
      }
      
      // Test filtering by userName
      var userALogs = TransactionService.getTransactionLogs({ userName: userNames[0] });
      var ourUserALogs = userALogs.filter(function(log) {
        return log.productCode.indexOf('PBT13-') === 0;
      });
      
      for (var m = 0; m < ourUserALogs.length; m++) {
        if (ourUserALogs[m].userName.indexOf(userNames[0]) === -1) {
          // Cleanup
          products.forEach(function(p) {
            ProductService.deleteProduct(p.code, 'TestCleanup');
          });
          return {
            success: false,
            message: 'Filter by userName returned wrong user',
            expected: userNames[0],
            actual: ourUserALogs[m].userName
          };
        }
      }
      
      // Test descending order by timestamp
      var allLogs = TransactionService.getTransactionLogs({ productCode: products[1].code });
      for (var n = 1; n < allLogs.length; n++) {
        var prevTimestamp = new Date(allLogs[n - 1].timestamp);
        var currTimestamp = new Date(allLogs[n].timestamp);
        if (prevTimestamp < currTimestamp) {
          // Cleanup
          products.forEach(function(p) {
            ProductService.deleteProduct(p.code, 'TestCleanup');
          });
          return {
            success: false,
            message: 'Logs not sorted by timestamp descending',
            prevTimestamp: allLogs[n - 1].timestamp,
            currTimestamp: allLogs[n].timestamp
          };
        }
      }
      
      // Cleanup
      products.forEach(function(p) {
        ProductService.deleteProduct(p.code, 'TestCleanup');
      });
      
      return true;
    },
    100 // Run 100 iterations
  );
}

/**
 * Run all property tests
 * Execute this function from the Apps Script editor to run all tests
 */
function runAllPropertyTests() {
  TestFramework.clearResults();
  
  Logger.log('Starting Property-Based Tests...\n');
  Logger.log('Each test runs 100 iterations with random inputs.\n');
  
  // Property 1: Product CRUD Round-Trip
  Logger.log('Running Property 1: Product CRUD Round-Trip...');
  var result1 = testProperty1_ProductCRUDRoundTrip();
  Logger.log('  Result: ' + (result1.success ? 'PASSED' : 'FAILED'));
  if (!result1.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result1.failingExample));
  }
  
  // Property 2: Product Update Consistency
  Logger.log('Running Property 2: Product Update Consistency...');
  var result2 = testProperty2_ProductUpdateConsistency();
  Logger.log('  Result: ' + (result2.success ? 'PASSED' : 'FAILED'));
  if (!result2.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result2.failingExample));
  }
  
  // Property 3: Product Deletion Completeness
  Logger.log('Running Property 3: Product Deletion Completeness...');
  var result3 = testProperty3_ProductDeletionCompleteness();
  Logger.log('  Result: ' + (result3.success ? 'PASSED' : 'FAILED'));
  if (!result3.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result3.failingExample));
  }
  
  // Property 4: Product Code Uniqueness
  Logger.log('Running Property 4: Product Code Uniqueness...');
  var result4 = testProperty4_ProductCodeUniqueness();
  Logger.log('  Result: ' + (result4.success ? 'PASSED' : 'FAILED'));
  if (!result4.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result4.failingExample));
  }
  
  // Property 10: Low Stock Detection
  Logger.log('Running Property 10: Low Stock Detection...');
  var result10 = testProperty10_LowStockDetection();
  Logger.log('  Result: ' + (result10.success ? 'PASSED' : 'FAILED'));
  if (!result10.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result10.failingExample));
  }
  
  // Property 5: Withdrawal Stock Validation
  Logger.log('Running Property 5: Withdrawal Stock Validation...');
  var result5 = testProperty5_WithdrawalStockValidation();
  Logger.log('  Result: ' + (result5.success ? 'PASSED' : 'FAILED'));
  if (!result5.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result5.failingExample));
  }
  
  // Property 6: Withdrawal Quantity Deduction
  Logger.log('Running Property 6: Withdrawal Quantity Deduction...');
  var result6 = testProperty6_WithdrawalQuantityDeduction();
  Logger.log('  Result: ' + (result6.success ? 'PASSED' : 'FAILED'));
  if (!result6.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result6.failingExample));
  }
  
  // Property 7: Receipt Quantity Addition
  Logger.log('Running Property 7: Receipt Quantity Addition...');
  var result7 = testProperty7_ReceiptQuantityAddition();
  Logger.log('  Result: ' + (result7.success ? 'PASSED' : 'FAILED'));
  if (!result7.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result7.failingExample));
  }
  
  // Property 8: Transaction User Name Requirement
  Logger.log('Running Property 8: Transaction User Name Requirement...');
  var result8 = testProperty8_TransactionUserNameRequirement();
  Logger.log('  Result: ' + (result8.success ? 'PASSED' : 'FAILED'));
  if (!result8.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result8.failingExample));
  }
  
  // Property 9: Positive Quantity Validation
  Logger.log('Running Property 9: Positive Quantity Validation...');
  var result9 = testProperty9_PositiveQuantityValidation();
  Logger.log('  Result: ' + (result9.success ? 'PASSED' : 'FAILED'));
  if (!result9.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result9.failingExample));
  }
  
  // Property 11: Dashboard Statistics Accuracy
  Logger.log('Running Property 11: Dashboard Statistics Accuracy...');
  var result11 = testProperty11_DashboardStatisticsAccuracy();
  Logger.log('  Result: ' + (result11.success ? 'PASSED' : 'FAILED'));
  if (!result11.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result11.failingExample));
  }
  
  // Property 12: Transaction Log Completeness
  Logger.log('Running Property 12: Transaction Log Completeness...');
  var result12 = testProperty12_TransactionLogCompleteness();
  Logger.log('  Result: ' + (result12.success ? 'PASSED' : 'FAILED'));
  if (!result12.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result12.failingExample));
  }
  
  // Property 13: Log Filtering Correctness
  Logger.log('Running Property 13: Log Filtering Correctness...');
  var result13 = testProperty13_LogFilteringCorrectness();
  Logger.log('  Result: ' + (result13.success ? 'PASSED' : 'FAILED'));
  if (!result13.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result13.failingExample));
  }
  
  // Property 14: Report Summary Accuracy
  Logger.log('Running Property 14: Report Summary Accuracy...');
  var result14 = testProperty14_ReportSummaryAccuracy();
  Logger.log('  Result: ' + (result14.success ? 'PASSED' : 'FAILED'));
  if (!result14.success) {
    Logger.log('  Failing Example: ' + JSON.stringify(result14.failingExample));
  }
  
  // Print summary
  Logger.log('\n' + TestFramework.formatResults());
  
  return TestFramework.getResults();
}

/**
 * Run a quick test (10 iterations) for development
 */
function runQuickPropertyTests() {
  TestFramework.clearResults();
  
  Logger.log('Running Quick Property Tests (10 iterations each)...\n');
  
  // Property 1 with fewer iterations
  var result1 = TestFramework.propertyTest(
    'Property 1: Product CRUD Round-Trip (Quick)',
    function() {
      var inputProduct = TestFramework.generateProduct();
      inputProduct.code = 'QUICK-' + TestFramework.randomString(8);
      
      var addResult = ProductService.addProduct(inputProduct);
      if (!addResult.success) {
        return { success: false, message: 'Add failed', error: addResult.message };
      }
      
      var retrieved = ProductService.getProductByCode(inputProduct.code);
      ProductService.deleteProduct(inputProduct.code, 'TestCleanup');
      
      if (!retrieved) {
        return { success: false, message: 'Retrieve failed' };
      }
      
      return retrieved.code === inputProduct.code &&
             retrieved.name === inputProduct.name.trim() &&
             retrieved.unit === inputProduct.unit.trim();
    },
    10
  );
  
  Logger.log(TestFramework.formatResults());
  return TestFramework.getResults();
}

/**
 * Clean up any leftover test products
 */
function cleanupTestProducts() {
  var products = ProductService.getAllProducts();
  var cleaned = 0;
  
  products.forEach(function(product) {
    if (product.code.indexOf('TEST-') === 0 || 
        product.code.indexOf('PBT') === 0 ||
        product.code.indexOf('QUICK-') === 0) {
      ProductService.deleteProduct(product.code, 'TestCleanup');
      cleaned++;
    }
  });
  
  Logger.log('Cleaned up ' + cleaned + ' test products');
  return cleaned;
}


/**
 * Feature: line-inventory-management, Property 11: Dashboard Statistics Accuracy
 * Validates: Requirements 5.1
 * 
 * For any set of products, the dashboard should show: totalProducts equal to product count,
 * and lowStockCount equal to the count of products where quantity <= threshold.
 */
function testProperty11_DashboardStatisticsAccuracy() {
  return TestFramework.propertyTest(
    'Property 11: Dashboard Statistics Accuracy (Validates: Requirements 5.1)',
    function() {
      // Generate test products with varying stock levels
      var testProducts = [];
      var numProducts = TestFramework.randomInt(2, 5);
      var expectedLowStockCount = 0;
      var expectedTotalQuantity = 0;
      
      for (var i = 0; i < numProducts; i++) {
        var product = TestFramework.generateProduct();
        product.code = 'PBT11-' + TestFramework.randomString(6) + '-' + i;
        
        // Randomly set quantity relative to threshold
        var threshold = TestFramework.randomInt(5, 20);
        product.lowStockThreshold = threshold;
        
        // 50% chance of being low stock
        if (Math.random() > 0.5) {
          // Low stock: quantity <= threshold
          product.quantity = TestFramework.randomInt(0, threshold);
          expectedLowStockCount++;
        } else {
          // Normal stock: quantity > threshold
          product.quantity = threshold + TestFramework.randomInt(1, 50);
        }
        
        expectedTotalQuantity += product.quantity;
        
        var addResult = ProductService.addProduct(product);
        if (addResult.success) {
          testProducts.push(product);
        }
      }
      
      if (testProducts.length === 0) {
        return { 
          success: false, 
          message: 'Failed to create any test products' 
        };
      }
      
      // Recalculate expected values based on actually created products
      expectedLowStockCount = 0;
      expectedTotalQuantity = 0;
      for (var j = 0; j < testProducts.length; j++) {
        var p = testProducts[j];
        expectedTotalQuantity += p.quantity;
        if (p.quantity <= p.lowStockThreshold) {
          expectedLowStockCount++;
        }
      }
      
      // Get dashboard data
      var dashboardResult = DashboardService.getDashboardData();
      
      if (!dashboardResult.success) {
        // Cleanup
        testProducts.forEach(function(p) {
          ProductService.deleteProduct(p.code, 'TestCleanup');
        });
        return {
          success: false,
          message: 'getDashboardData failed',
          error: dashboardResult.message
        };
      }
      
      var dashboard = dashboardResult.data;
      
      // Filter to only count our test products for verification
      var ourLowStockProducts = dashboard.lowStockProducts.filter(function(p) {
        return p.code.indexOf('PBT11-') === 0;
      });
      
      // Cleanup test products
      testProducts.forEach(function(p) {
        ProductService.deleteProduct(p.code, 'TestCleanup');
      });
      
      // Verify totalProducts includes at least our test products
      // (there may be other products in the system)
      if (dashboard.totalProducts < testProducts.length) {
        return {
          success: false,
          message: 'totalProducts is less than expected',
          expected: 'at least ' + testProducts.length,
          actual: dashboard.totalProducts
        };
      }
      
      // Verify lowStockCount for our test products
      if (ourLowStockProducts.length !== expectedLowStockCount) {
        return {
          success: false,
          message: 'lowStockCount mismatch for test products',
          expected: expectedLowStockCount,
          actual: ourLowStockProducts.length,
          testProducts: testProducts.map(function(p) {
            return { code: p.code, qty: p.quantity, threshold: p.lowStockThreshold };
          }),
          lowStockProducts: ourLowStockProducts.map(function(p) {
            return { code: p.code, qty: p.quantity, threshold: p.lowStockThreshold };
          })
        };
      }
      
      // Verify all low stock products in result are actually low stock
      for (var k = 0; k < ourLowStockProducts.length; k++) {
        var lsp = ourLowStockProducts[k];
        if (lsp.quantity > lsp.lowStockThreshold) {
          return {
            success: false,
            message: 'Product in lowStockProducts has quantity > threshold',
            product: { code: lsp.code, quantity: lsp.quantity, threshold: lsp.lowStockThreshold }
          };
        }
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}


/**
 * Feature: line-inventory-management, Property 14: Report Summary Accuracy
 * Validates: Requirements 7.2, 7.3
 * 
 * For any filtered transaction set, the report summary should show: totalWithdrawals 
 * equal to sum of WITHDRAW quantities, totalReceipts equal to sum of RECEIVE quantities, 
 * and netChange equal to (totalReceipts - totalWithdrawals).
 */
function testProperty14_ReportSummaryAccuracy() {
  return TestFramework.propertyTest(
    'Property 14: Report Summary Accuracy (Validates: Requirements 7.2, 7.3)',
    function() {
      // Generate and add a test product
      var product = TestFramework.generateProduct();
      product.code = 'PBT14-' + TestFramework.randomString(8);
      product.quantity = TestFramework.randomInt(50, 200); // Ensure enough stock for withdrawals
      
      var addResult = ProductService.addProduct(product);
      if (!addResult.success) {
        return { 
          success: false, 
          message: 'Failed to add product for report test', 
          error: addResult.message 
        };
      }
      
      // Create random transactions
      var numTransactions = TestFramework.randomInt(2, 5);
      var expectedWithdrawals = 0;
      var expectedReceipts = 0;
      var currentStock = product.quantity;
      
      for (var i = 0; i < numTransactions; i++) {
        var isWithdraw = Math.random() > 0.5;
        var quantity;
        
        if (isWithdraw && currentStock > 0) {
          // Withdraw - ensure we don't exceed current stock
          quantity = TestFramework.randomInt(1, Math.min(currentStock, 20));
          var withdrawResult = TransactionService.withdraw(product.code, quantity, 'TestUser');
          if (withdrawResult.success) {
            expectedWithdrawals += quantity;
            currentStock -= quantity;
          }
        } else {
          // Receive
          quantity = TestFramework.randomInt(1, 30);
          var receiveResult = TransactionService.receive(product.code, quantity, 'TestUser');
          if (receiveResult.success) {
            expectedReceipts += quantity;
            currentStock += quantity;
          }
        }
      }
      
      var expectedNetChange = expectedReceipts - expectedWithdrawals;
      
      // Get report filtered by this product
      var reportResult = DashboardService.getReport({ productCode: product.code });
      
      // Cleanup
      ProductService.deleteProduct(product.code, 'TestCleanup');
      
      if (!reportResult.success) {
        return {
          success: false,
          message: 'getReport failed',
          error: reportResult.message
        };
      }
      
      var summary = reportResult.data.summary;
      
      // Verify totalWithdrawals
      if (summary.totalWithdrawals !== expectedWithdrawals) {
        return {
          success: false,
          message: 'totalWithdrawals mismatch',
          expected: expectedWithdrawals,
          actual: summary.totalWithdrawals
        };
      }
      
      // Verify totalReceipts
      if (summary.totalReceipts !== expectedReceipts) {
        return {
          success: false,
          message: 'totalReceipts mismatch',
          expected: expectedReceipts,
          actual: summary.totalReceipts
        };
      }
      
      // Verify netChange = totalReceipts - totalWithdrawals
      if (summary.netChange !== expectedNetChange) {
        return {
          success: false,
          message: 'netChange mismatch',
          expected: expectedNetChange,
          actual: summary.netChange,
          formula: 'totalReceipts(' + expectedReceipts + ') - totalWithdrawals(' + expectedWithdrawals + ')'
        };
      }
      
      // Verify netChange calculation is correct
      var calculatedNetChange = summary.totalReceipts - summary.totalWithdrawals;
      if (summary.netChange !== calculatedNetChange) {
        return {
          success: false,
          message: 'netChange does not equal totalReceipts - totalWithdrawals',
          netChange: summary.netChange,
          calculatedNetChange: calculatedNetChange,
          totalReceipts: summary.totalReceipts,
          totalWithdrawals: summary.totalWithdrawals
        };
      }
      
      return true;
    },
    100 // Run 100 iterations
  );
}
