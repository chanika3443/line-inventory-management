/**
 * Google Sheets API Service
 * Handles READ operations directly from Google Sheets API
 * Reads from the real monthly stock count sheet
 */

import { config } from '../config'
import { callAppsScript } from './appsScriptService'
import {
  rowToMaterial,
  mergeBatches,
  filterActiveMaterials,
  getCurrentMonthTabName,
  isMonthlyStockTab,
  HEADER_ROWS
} from '../utils/sheetHelpers'

const SHEETS_API_BASE = config.sheetsApi.baseUrl
const SPREADSHEET_ID = config.sheetsApi.spreadsheetId
const API_KEY = config.sheetsApi.apiKey

/**
 * Fetch data from Google Sheets
 * @param {string} range - Sheet range (e.g., "TabName!A4:S")
 * @returns {Promise<Array>} Array of rows
 */
async function fetchSheetData(range) {
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`)
    }

    const data = await response.json()
    return data.values || []
  } catch (error) {
    console.error('Error fetching sheet data:', error)
    throw error
  }
}

/**
 * Fetch spreadsheet metadata to get list of tabs
 * @returns {Promise<Array>} Array of sheet tab objects { title, sheetId, index }
 */
async function fetchSpreadsheetMeta() {
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}?fields=sheets.properties&key=${API_KEY}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Sheets API metadata error: ${response.status}`)
    }

    const data = await response.json()
    return (data.sheets || []).map(s => ({
      title: s.properties.title,
      sheetId: s.properties.sheetId,
      index: s.properties.index,
    }))
  } catch (error) {
    console.error('Error fetching spreadsheet metadata:', error)
    throw error
  }
}

/**
 * Get list of available monthly stock tabs
 * @returns {Promise<Array>} Array of { title, sheetId, index } for monthly tabs, sorted newest first
 */
export async function getAvailableTabs() {
  if (API_KEY) {
    try {
      const allTabs = await fetchSpreadsheetMeta()
      const monthlyTabs = allTabs.filter(tab => isMonthlyStockTab(tab.title))
      monthlyTabs.sort((a, b) => b.index - a.index)
      if (monthlyTabs.length > 0) return monthlyTabs
    } catch (error) {
      console.warn('Sheets API tabs fetch failed, trying Apps Script fallback...', error)
    }
  }

  // Fallback to Apps Script
  try {
    const res = await callAppsScript({ action: 'getAvailableTabs' })
    if (res && res.success && Array.isArray(res.tabs) && res.tabs.length > 0) {
      return res.tabs
    }
  } catch (err) {
    console.error('Apps Script getAvailableTabs error:', err)
  }

  return []
}

/**
 * Get all materials from a specific tab
 * @param {string} tabName - Tab name to read from (defaults to current month)
 * @returns {Promise<Array>} Array of Material objects
 */
export async function getAllMaterials(tabName = null) {
  const tab = tabName || getCurrentMonthTabName()

  // 1. Try Google Sheets API if API_KEY is available
  if (API_KEY) {
    try {
      const range = `'${tab}'!A${HEADER_ROWS + 1}:S`
      const rows = await fetchSheetData(range)
      const materials = rows
        .map((row, index) => rowToMaterial(row, index, tab))
        .filter(m => m !== null)

      return filterActiveMaterials(materials)
    } catch (error) {
      console.warn('Sheets API getAllMaterials failed, trying Apps Script fallback...', error)
    }
  }

  // 2. Fallback to Apps Script
  try {
    const res = await callAppsScript({ action: 'getMaterials', tabName: tab })
    if (res && res.success && Array.isArray(res.rows)) {
      const materials = res.rows
        .map((row, index) => rowToMaterial(row, index, res.tabName || tab))
        .filter(m => m !== null)

      return filterActiveMaterials(materials)
    }
  } catch (err) {
    console.error('Apps Script getMaterials error:', err)
  }

  return []
}

/**
 * Get merged materials (batches combined) for display
 * @param {string} tabName - Tab name
 * @returns {Promise<Array>} Array of merged Material objects
 */
export async function getMergedMaterials(tabName = null) {
  const materials = await getAllMaterials(tabName)
  return mergeBatches(materials)
}

/**
 * Search materials by query (code or description)
 * @param {string} query - Search term
 * @param {string} tabName - Tab name
 * @returns {Promise<Array>} Filtered merged materials
 */
export async function searchMaterials(query, tabName = null) {
  const merged = await getMergedMaterials(tabName)

  if (!query) return merged

  const lowerQuery = query.toLowerCase()
  return merged.filter(m =>
    m.materialCode.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get material by code (returns all batches)
 * @param {string} code - Material code
 * @param {string} tabName - Tab name
 * @returns {Promise<Object|null>} Merged material with batches or null
 */
export async function getMaterialByCode(code, tabName = null) {
  const merged = await getMergedMaterials(tabName)
  return merged.find(m => m.materialCode === code) || null
}

/**
 * Get low stock materials
 * Materials where mainStock.remaining + subStock.remaining is very low
 * We define "low" as total remaining <= 5 but > 0
 * @param {string} tabName
 */
export async function getLowStockMaterials(tabName = null) {
  const merged = await getMergedMaterials(tabName)
  return merged.filter(m => {
    const total = m.totalMainRemaining + m.totalSubRemaining
    return total > 0 && total <= 5
  })
}

/**
 * Get out-of-stock materials
 * @param {string} tabName
 */
export async function getOutOfStockMaterials(tabName = null) {
  const merged = await getMergedMaterials(tabName)
  return merged.filter(m => {
    const total = m.totalMainRemaining + m.totalSubRemaining
    return total <= 0
  })
}

/**
 * Get dashboard data
 * @param {string} tabName
 */
export async function getDashboardData(tabName = null) {
  try {
    const merged = await getMergedMaterials(tabName)

    let totalMainRemaining = 0
    let totalSubRemaining = 0
    let outOfStockCount = 0
    let lowStockCount = 0

    merged.forEach(m => {
      totalMainRemaining += m.totalMainRemaining
      totalSubRemaining += m.totalSubRemaining
      const total = m.totalMainRemaining + m.totalSubRemaining
      if (total <= 0) outOfStockCount++
      else if (total <= 5) lowStockCount++
    })

    const lowStockList = merged.filter(m => {
      const total = m.totalMainRemaining + m.totalSubRemaining
      return total > 0 && total <= 5
    })
    const outOfStockList = merged.filter(m => {
      const total = m.totalMainRemaining + m.totalSubRemaining
      return total <= 0
    })

    return {
      // New schema
      totalMaterials: merged.length,
      totalMainRemaining,
      totalSubRemaining,
      totalRemaining: totalMainRemaining + totalSubRemaining,
      outOfStockCount,
      lowStockCount,
      lowStockMaterials: lowStockList,
      outOfStockMaterials: outOfStockList,
      // Legacy compatibility
      totalProducts: merged.length,
      totalQuantity: totalMainRemaining + totalSubRemaining,
      lowStockProducts: lowStockList,
      outOfStockProducts: outOfStockList,
    }
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    return {
      totalMaterials: 0,
      totalMainRemaining: 0,
      totalSubRemaining: 0,
      totalRemaining: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
      lowStockMaterials: [],
      outOfStockMaterials: [],
      totalProducts: 0,
      totalQuantity: 0,
      lowStockProducts: [],
      outOfStockProducts: [],
    }
  }
}

/**
 * Get transaction logs from the Transactions tab
 * (This tab needs to be created manually in the real sheet)
 */
export async function getTransactionLogs(filters = {}) {
  try {
    let rows = []

    if (API_KEY) {
      try {
        rows = await fetchSheetData('Transactions!A2:J')
      } catch (err) {
        console.warn('Sheets API getTransactionLogs failed, trying Apps Script fallback...', err)
      }
    }

    if (!rows || rows.length === 0) {
      try {
        const res = await callAppsScript({ action: 'getTransactionLogs' })
        if (res && res.success && Array.isArray(res.rows)) {
          rows = res.rows
        }
      } catch (err) {
        console.error('Apps Script getTransactionLogs error:', err)
      }
    }

    let transactions = (rows || []).map((row) => {
      // Parse timestamp
      let timestamp = row[1] || ''
      if (timestamp && timestamp.includes('/')) {
        try {
          const [datePart, timePart] = timestamp.split(', ')
          const [day, month, year] = datePart.split('/')
          const [hour, minute, second] = (timePart || '0:0:0').split(':')
          timestamp = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${(hour || '0').padStart(2, '0')}:${(minute || '0').padStart(2, '0')}:${(second || '0').padStart(2, '0')}`
        } catch (e) {
          console.error('Error parsing timestamp:', row[1], e)
        }
      }

      return {
        id: row[0] || '',
        timestamp,
        type: row[2] || '',
        materialCode: row[3] || '',
        productCode: row[3] || '',
        description: row[4] || '',
        productName: row[4] || '',
        quantity: parseInt(row[5]) || 0,
        stockType: row[6] || '',
        batch: row[7] || '',
        userName: row[8] || '',
        note: row[9] || '',
        notes: row[9] || '',
      }
    })

    // Apply filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      transactions = transactions.filter(t => new Date(t.timestamp) >= startDate)
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      transactions = transactions.filter(t => new Date(t.timestamp) <= endDate)
    }
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type)
    }
    if (filters.materialCode) {
      transactions = transactions.filter(t => t.materialCode === filters.materialCode)
    }
    if (filters.userName) {
      const lower = filters.userName.toLowerCase()
      transactions = transactions.filter(t => t.userName.toLowerCase().includes(lower))
    }

    // Sort newest first
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return transactions
  } catch (error) {
    console.error('Error getting transaction logs:', error)
    return []
  }
}

/**
 * Get allowed users for product management
 * Reads from "AllowedUsers" sheet with columns: Name
 */
export async function getAllowedUsers() {
  try {
    const rows = await fetchSheetData('AllowedUsers!A2:A')
    return rows.map(row => row[0]).filter(name => name && name.trim())
  } catch (error) {
    console.error('Error getting allowed users:', error)
    return []
  }
}

// ============================================
// Legacy compatibility aliases
// ============================================
export const getAllProducts = getAllMaterials
export const getProductByCode = getMaterialByCode
export const searchProducts = searchMaterials
export const getLowStockProducts = getLowStockMaterials
