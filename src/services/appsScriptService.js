/**
 * Apps Script API Service
 * Handles WRITE operations through Apps Script backend
 * Works with the real monthly stock count sheet
 */

import { config } from '../config'
import { getDeviceInfoString } from '../utils/deviceInfo'
import { getCurrentMonthTabName } from '../utils/sheetHelpers'

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

    const dataWithDevice = {
      ...data,
      deviceInfo: getDeviceInfoString()
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(dataWithDevice)
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
 * Withdraw material
 * @param {string} materialCode
 * @param {number} quantity
 * @param {string} userName
 * @param {string} note
 * @param {string} stockType - 'main' or 'sub'
 * @param {string} batch - specific batch
 * @param {number} sheetRow - 1-based row number in the sheet
 * @param {string} tabName - tab name (defaults to current month)
 */
export async function withdraw(materialCode, quantity, userName, note = '', stockType = 'main', batch = '', sheetRow = null, tabName = null) {
  return await callAppsScript({
    action: 'withdraw',
    materialCode,
    quantity: parseInt(quantity),
    userName,
    note,
    stockType,
    batch,
    sheetRow,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Receive material
 */
export async function receive(materialCode, quantity, userName, stockType = 'main', batch = '', sheetRow = null, tabName = null) {
  return await callAppsScript({
    action: 'receive',
    materialCode,
    quantity: parseInt(quantity),
    userName,
    stockType,
    batch,
    sheetRow,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Return material
 */
export async function returnMaterial(materialCode, quantity, userName, note = '', stockType = 'main', batch = '', sheetRow = null, tabName = null) {
  return await callAppsScript({
    action: 'return',
    materialCode,
    quantity: parseInt(quantity),
    userName,
    note,
    stockType,
    batch,
    sheetRow,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Add a new material
 */
export async function addMaterial(material, tabName = null) {
  return await callAppsScript({
    action: 'addMaterial',
    material,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Update material at a specific row
 */
export async function updateMaterial(sheetRow, updates, tabName = null) {
  return await callAppsScript({
    action: 'updateMaterial',
    sheetRow,
    updates,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Delete material at a specific row
 */
export async function deleteMaterial(sheetRow, userName, tabName = null) {
  return await callAppsScript({
    action: 'deleteMaterial',
    sheetRow,
    userName,
    tabName: tabName || getCurrentMonthTabName()
  })
}

/**
 * Batch withdraw multiple materials
 */
export async function batchWithdraw(items, userName, tabName = null) {
  return await callAppsScript({
    action: 'batchWithdraw',
    items,
    userName,
    tabName: tabName || getCurrentMonthTabName()
  })
}

// ============================================
// Legacy compatibility aliases
// ============================================
export const addProduct = (product, userName) => addMaterial({ ...product, userName })
export const updateProduct = (code, updates, userName) => updateMaterial(null, { ...updates, userName })
export const deleteProduct = (code, userName) => deleteMaterial(null, userName)
export const returnProduct = returnMaterial
