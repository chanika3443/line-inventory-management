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
  if (!APPS_SCRIPT_URL) {
    console.error('Apps Script URL not configured')
    return {
      success: false,
      message: 'Apps Script URL ไม่ได้ตั้งค่า กรุณาตั้งค่า VITE_APPS_SCRIPT_URL ใน .env'
    }
  }

  try {
    console.log('Calling Apps Script:', APPS_SCRIPT_URL, data)
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(data)
    })
    
    console.log('Apps Script response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`Apps Script error: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Apps Script result:', result)
    
    return result
    
  } catch (error) {
    console.error('Error calling Apps Script:', error)
    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.message
    }
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
