/**
 * Apps Script API Service
 * Handles WRITE operations through Apps Script backend
 */

import { config } from '../config'

const APPS_SCRIPT_URL = config.appsScript.url

/**
 * Call Apps Script API
 * @param {Object} data - Request data
 * @returns {Promise<Object>} Response data
 */
async function callAppsScript(data) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error calling Apps Script:', error)
    throw error
  }
}

/**
 * Add a new product
 */
export async function addProduct(product, userName) {
  return await callAppsScript({
    action: 'addProduct',
    product: {
      ...product,
      userName
    }
  })
}

/**
 * Update an existing product
 */
export async function updateProduct(code, updates, userName) {
  return await callAppsScript({
    action: 'updateProduct',
    code,
    updates: {
      ...updates,
      userName
    }
  })
}

/**
 * Delete a product
 */
export async function deleteProduct(code, userName) {
  return await callAppsScript({
    action: 'deleteProduct',
    code,
    userName
  })
}

/**
 * Withdraw product
 */
export async function withdraw(productCode, quantity, userName) {
  return await callAppsScript({
    action: 'withdraw',
    productCode,
    quantity: parseInt(quantity),
    userName
  })
}

/**
 * Receive product
 */
export async function receive(productCode, quantity, userName) {
  return await callAppsScript({
    action: 'receive',
    productCode,
    quantity: parseInt(quantity),
    userName
  })
}

/**
 * Return product
 */
export async function returnProduct(productCode, quantity, userName, note = '') {
  return await callAppsScript({
    action: 'return',
    productCode,
    quantity: parseInt(quantity),
    userName,
    note
  })
}

/**
 * Batch withdraw
 */
export async function batchWithdraw(items, userName) {
  return await callAppsScript({
    action: 'batchWithdraw',
    items,
    userName
  })
}
