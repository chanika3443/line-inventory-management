/**
 * Google Sheets API Service
 * Handles READ operations directly from Google Sheets API
 * Reads from the real monthly stock count sheet
 */

import Papa from 'papaparse'
import { config } from '../config/index.js'
import { callAppsScript } from './appsScriptService.js'
import {
  rowToMaterial,
  mergeBatches,
  filterActiveMaterials,
  getCurrentMonthTabName,
  isMonthlyStockTab,
  parseMonthFromTabName,
  HEADER_ROWS
} from '../utils/sheetHelpers.js'

const SHEETS_API_BASE = config.sheetsApi.baseUrl
const SPREADSHEET_ID = config.sheetsApi.spreadsheetId
const LOG_SPREADSHEET_ID = config.logSheet?.spreadsheetId || '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8'
const API_KEY = config.sheetsApi.apiKey

/**
 * Fetch sheet data via Google Sheets GViz CSV export
 * Instant, public, zero API key required, full CORS support from browser
 * @param {string} tabName
 * @returns {Promise<Array>} Array of rows
 */
export async function fetchSheetDataViaGviz(tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GViz CSV error: ${response.status}`)
  }
  const csvText = await response.text()
  const parsed = Papa.parse(csvText, { skipEmptyLines: false })
  return parsed.data || []
}

/**
 * Fetch data from Google Sheets API
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
  // 1. Fetch from htmlview (instant, CORS supported, public)
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`
    const response = await fetch(url)
    if (response.ok) {
      const html = await response.text()
      const matches = [...html.matchAll(/items\.push\({\s*name:\s*"([^"]+)",[^}]*gid:\s*"([^"]+)"/g)]
      if (matches.length > 0) {
        const tabs = matches
          .map((m, idx) => ({ title: m[1], sheetId: m[2], index: idx }))
          .filter(t => isMonthlyStockTab(t.title))

        if (tabs.length > 0) {
          // Sort newest month first
          tabs.sort((a, b) => {
            const dateA = parseMonthFromTabName(a.title)?.date || 0
            const dateB = parseMonthFromTabName(b.title)?.date || 0
            return dateB - dateA
          })
          return tabs
        }
      }
    }
  } catch (err) {
    console.warn('htmlview tabs fetch failed:', err)
  }

  // 2. Google Sheets API metadata if API_KEY is available
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

  // 3. Fallback to Apps Script
  try {
    const res = await callAppsScript({ action: 'getAvailableTabs' })
    if (res && res.success && Array.isArray(res.tabs) && res.tabs.length > 0) {
      return res.tabs
    }
  } catch (err) {
    console.error('Apps Script getAvailableTabs error:', err)
  }

  // 4. Fallback: generate default tabs for recent months
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const now = new Date()
  const fallbackTabs = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = MONTH_NAMES[d.getMonth()]
    const yy = String(d.getFullYear()).slice(-2)
    fallbackTabs.push({
      title: `${month}${yy}`,
      sheetId: 0,
      index: 11 - i
    })
  }
  return fallbackTabs
}

/**
 * Get all materials from a specific tab
 * @param {string} tabName - Tab name to read from (defaults to current month)
 * @returns {Promise<Array>} Array of Material objects
 */
export async function getAllMaterials(tabName = null) {
  const tab = tabName || getCurrentMonthTabName()

  // 1. First priority: Google Sheets GViz CSV export
  // Instant, public, zero API key required, full CORS support, ~200ms
  try {
    const rows = await fetchSheetDataViaGviz(tab)
    if (Array.isArray(rows) && rows.length > 1) {
      // Row 0 is the table headers in GViz CSV; data rows start from index 1 (sheetRow 4)
      const dataRows = rows.slice(1)
      const materials = dataRows
        .map((row, index) => rowToMaterial(row, index, tab))
        .filter(m => m !== null)

      if (materials.length > 0) {
        return filterActiveMaterials(materials)
      }
    }
  } catch (gvizError) {
    console.warn('GViz CSV fetch failed, trying fallbacks...', gvizError)
  }

  // 2. Try Google Sheets API if API_KEY is available
  if (API_KEY) {
    try {
      const range = `'${tab}'!A${HEADER_ROWS + 1}:S`
      const rows = await fetchSheetData(range)
      const materials = rows
        .map((row, index) => rowToMaterial(row, index, tab))
        .filter(m => m !== null)

      if (materials.length > 0) {
        return filterActiveMaterials(materials)
      }
    } catch (error) {
      console.warn('Sheets API getAllMaterials failed, trying Apps Script fallback...', error)
    }
  }

  // 3. Fallback to Apps Script
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
 * Get transaction logs from the Transactions tab in the Log sheet (ชีทเก่า)
 */
export async function getTransactionLogs(filters = {}) {
  try {
    let rows = []

    // 1. Fetch directly from the Log Sheet (ชีทเก่า) via GViz CSV
    try {
      const url = `https://docs.google.com/spreadsheets/d/${LOG_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Transactions`
      const res = await fetch(url)
      if (res.ok) {
        const csv = await res.text()
        const parsed = Papa.parse(csv, { skipEmptyLines: true })
        if (parsed.data && parsed.data.length > 1) {
          rows = parsed.data.slice(1)
        }
      }
    } catch (err) {
      console.warn('GViz getTransactionLogs from log sheet failed, trying fallbacks...', err)
    }

    // 2. Fallback to Apps Script
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

    // 3. Fallback to Google Sheets API
    if ((!rows || rows.length === 0) && API_KEY) {
      try {
        rows = await fetchSheetData('Transactions!A2:J')
      } catch (err) {
        console.warn('Sheets API getTransactionLogs failed...', err)
      }
    }

    let transactions = (rows || []).map((row) => {
      // Parse timestamp
      let timestamp = String(row[1] || '').trim()
      if (timestamp && (timestamp.includes('/') || timestamp.includes('-'))) {
        try {
          const m = timestamp.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
          if (m) {
            const day = m[1].padStart(2, '0')
            const month = m[2].padStart(2, '0')
            let year = m[3]
            if (year.length === 2) year = '20' + year
            const hour = (m[4] || '00').padStart(2, '0')
            const minute = (m[5] || '00').padStart(2, '0')
            const second = (m[6] || '00').padStart(2, '0')
            timestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}`
          }
        } catch (e) {
          console.error('Error parsing timestamp:', row[1], e)
        }
      }

      const noteStr = row[9] || ''
      let roomNumber = row[10] || ''
      let patientType = row[11] || ''

      // Auto parse from note if not in dedicated columns
      if (!roomNumber && noteStr) {
        const mRoom = String(noteStr).match(/ห้อง:\s*([^,]+)/)
        if (mRoom) roomNumber = mRoom[1].trim()
      }
      if (!patientType && noteStr) {
        const mType = String(noteStr).match(/ประเภท:\s*([^,]+)/)
        if (mType) patientType = mType[1].trim()
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
        beforeQuantity: row[6] || '',
        afterQuantity: row[7] || '',
        userName: row[8] || '',
        note: noteStr,
        notes: noteStr,
        roomNumber,
        patientType,
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
      const filterType = filters.type.toUpperCase()
      transactions = transactions.filter(t => {
        const tType = (t.type || '').toUpperCase()
        if (filterType === 'WITHDRAW' && (tType === 'WITHDRAW' || tType === 'เบิก')) return true
        if (filterType === 'RECEIVE' && (tType === 'RECEIVE' || tType === 'รับเข้า')) return true
        if (filterType === 'RETURN' && (tType === 'RETURN' || tType === 'คืน')) return true
        return tType === filterType
      })
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
 * Get allowed users for product management from the AllowedUsers tab in the Log sheet (ชีทเก่า)
 */
export async function getAllowedUsers() {
  // 1. Fetch directly from the Log Sheet (ชีทเก่า) via GViz CSV
  try {
    const url = `https://docs.google.com/spreadsheets/d/${LOG_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=AllowedUsers`
    const res = await fetch(url)
    if (res.ok) {
      const csv = await res.text()
      const parsed = Papa.parse(csv, { skipEmptyLines: true })
      if (parsed.data && parsed.data.length > 1) {
        const users = parsed.data.slice(1).map(r => r[0]?.trim()).filter(Boolean)
        if (users.length > 0) return users
      }
    }
  } catch (err) {
    console.warn('GViz getAllowedUsers from log sheet failed...', err)
  }

  // 2. Apps Script fallback
  try {
    const res = await callAppsScript({ action: 'getAllowedUsers' })
    if (res && res.success && Array.isArray(res.users) && res.users.length > 0) {
      return res.users
    }
  } catch (e) {
    console.warn('Apps Script getAllowedUsers failed:', e)
  }

  // 3. Fallback to Sheets API if API_KEY is set
  if (API_KEY) {
    try {
      const rows = await fetchSheetData('AllowedUsers!A2:A')
      return rows.map(row => row[0]).filter(name => name && name.trim())
    } catch (error) {
      console.error('Error getting allowed users:', error)
    }
  }

  return ['ขิมขิมขิม', 'Mon Aekarin', 'ม่อน', 'admin']
}

// ============================================
// Legacy compatibility aliases
// ============================================
export const getAllProducts = getAllMaterials
export const getProductByCode = getMaterialByCode
export const searchProducts = searchMaterials
export const getLowStockProducts = getLowStockMaterials
export { cleanupOldSheet, splitTransactionsToMonthlyTabs } from './appsScriptService.js'


