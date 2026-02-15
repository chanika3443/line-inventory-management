/**
 * Property-Based Testing Framework for Google Apps Script
 * Implements a simple PBT framework for testing inventory system
 */

var TestFramework = (function() {
  
  var testResults = [];
  
  /**
   * Generate a random string
   * @param {number} length - String length
   * @returns {string}
   */
  function randomString(length) {
    length = length || 8;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Generate a random integer
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number}
   */
  function randomInt(min, max) {
    min = min || 0;
    max = max || 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a random product for testing
   * @returns {Object}
   */
  function generateProduct() {
    return {
      code: 'TEST-' + randomString(6),
      name: 'Test Product ' + randomString(4),
      unit: ['ชิ้น', 'กล่อง', 'แพ็ค', 'ถุง'][randomInt(0, 3)],
      quantity: randomInt(0, 100),
      lowStockThreshold: randomInt(1, 20),
      category: ['อุปกรณ์', 'วัสดุ', 'เครื่องมือ', 'อื่นๆ'][randomInt(0, 3)],
      userName: 'TestUser'
    };
  }
  
  /**
   * Run a property test multiple times
   * @param {string} name - Test name
   * @param {Function} property - Property function that returns true/false
   * @param {number} iterations - Number of iterations (default: 100)
   * @returns {Object} Test result
   */
  function propertyTest(name, property, iterations) {
    iterations = iterations || 100;
    var passed = 0;
    var failed = 0;
    var failingExample = null;
    
    for (var i = 0; i < iterations; i++) {
      try {
        var result = property();
        if (result === true) {
          passed++;
        } else {
          failed++;
          if (!failingExample) {
            failingExample = result;
          }
        }
      } catch (error) {
        failed++;
        if (!failingExample) {
          failingExample = { error: error.message };
        }
      }
    }
    
    var testResult = {
      name: name,
      passed: passed,
      failed: failed,
      iterations: iterations,
      success: failed === 0,
      failingExample: failingExample
    };
    
    testResults.push(testResult);
    return testResult;
  }
  
  /**
   * Assert equality
   * @param {*} actual - Actual value
   * @param {*} expected - Expected value
   * @param {string} message - Error message
   * @returns {boolean}
   */
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      return { 
        success: false, 
        message: message || ('Expected ' + expected + ' but got ' + actual),
        actual: actual,
        expected: expected
      };
    }
    return true;
  }
  
  /**
   * Assert that value is truthy
   * @param {*} value - Value to check
   * @param {string} message - Error message
   * @returns {boolean}
   */
  function assertTrue(value, message) {
    if (!value) {
      return { success: false, message: message || 'Expected truthy value' };
    }
    return true;
  }
  
  /**
   * Assert that value is null
   * @param {*} value - Value to check
   * @param {string} message - Error message
   * @returns {boolean}
   */
  function assertNull(value, message) {
    if (value !== null) {
      return { success: false, message: message || 'Expected null', actual: value };
    }
    return true;
  }
  
  /**
   * Get all test results
   * @returns {Array}
   */
  function getResults() {
    return testResults;
  }
  
  /**
   * Clear test results
   */
  function clearResults() {
    testResults = [];
  }
  
  /**
   * Format test results as string
   * @returns {string}
   */
  function formatResults() {
    var output = '=== Test Results ===\n\n';
    var totalPassed = 0;
    var totalFailed = 0;
    
    testResults.forEach(function(result) {
      output += result.name + '\n';
      output += '  Status: ' + (result.success ? '✅ PASSED' : '❌ FAILED') + '\n';
      output += '  Iterations: ' + result.passed + '/' + result.iterations + ' passed\n';
      
      if (!result.success && result.failingExample) {
        output += '  Failing Example: ' + JSON.stringify(result.failingExample) + '\n';
      }
      output += '\n';
      
      if (result.success) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    });
    
    output += '=== Summary ===\n';
    output += 'Total: ' + testResults.length + ' tests\n';
    output += 'Passed: ' + totalPassed + '\n';
    output += 'Failed: ' + totalFailed + '\n';
    
    return output;
  }
  
  return {
    randomString: randomString,
    randomInt: randomInt,
    generateProduct: generateProduct,
    propertyTest: propertyTest,
    assertEqual: assertEqual,
    assertTrue: assertTrue,
    assertNull: assertNull,
    getResults: getResults,
    clearResults: clearResults,
    formatResults: formatResults
  };
  
})();
