/**
 * Sheet Helpers
 * Utility functions for working with the real Google Sheet's column layout
 * and monthly tab structure
 */
import { cleanDateStr } from './expiryDate.js'

/**
 * Month names for matching tab names
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Legacy tab name prefix used in cell headers
 */
export const TAB_PREFIX = 'Display Warehouse Stocks of Material (For Monthly Count) '

/**
 * Get the tab name for the current month
 * Matches real Google Sheet tabs like "September26" (Month + 2-digit year)
 */
export function getCurrentMonthTabName() {
  const now = new Date()
  const month = MONTH_NAMES[now.getMonth()]
  const yy = String(now.getFullYear()).slice(-2)
  return `${month}${yy}`
}

/**
 * Parse month/year from a tab name
 * Supports: "September26", "September 2026", "Display Warehouse Stocks of Material... September 2026"
 * @param {string} tabName
 * @returns {{ month: string, year: number, monthIndex: number, date: Date } | null}
 */
export function parseMonthFromTabName(tabName) {
  if (!tabName || typeof tabName !== 'string') return null

  const match = tabName.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{2,4})/i)
  if (!match) return null

  const matchedName = match[1]
  const monthName = MONTH_NAMES.find(m => m.toLowerCase() === matchedName.toLowerCase())
  if (!monthName) return null

  const monthIndex = MONTH_NAMES.indexOf(monthName)
  let year = parseInt(match[2], 10)
  if (year < 100) {
    year += 2000
  }

  return {
    month: monthName,
    year,
    monthIndex,
    date: new Date(year, monthIndex, 1)
  }
}

/**
 * Check if a tab name is a valid monthly stock tab
 */
export function isMonthlyStockTab(tabName) {
  return parseMonthFromTabName(tabName) !== null
}

/**
 * Get a short label for a tab (e.g., "ก.ย. 2026")
 */
const SHORT_THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export function getTabShortLabel(tabName) {
  const parsed = parseMonthFromTabName(tabName)
  if (!parsed) return tabName
  return `${SHORT_THAI_MONTHS[parsed.monthIndex]} ${parsed.year}`
}

/**
 * Column index mapping for the real sheet
 * Row data is 0-indexed from column A
 */
export const COL = {
  NO: 0,           // A: No.
  CODE: 1,         // B: material code
  DESCRIPTION: 2,  // C: Material Description
  PLANT: 3,        // D: Plant
  BATCH: 4,        // E: Batch
  UNIT: 5,         // F: B.Un (หน่วย)
  WD_DATE: 6,      // G: เบิก - วันที่
  WD_QTY: 7,       // H: เบิก - จำนวน
  MAIN_PREV: 8,    // I: สต๊อกใหญ่ - เดิม
  MAIN_IN: 9,      // J: สต๊อกใหญ่ - รับเข้า
  MAIN_OUT: 10,    // K: สต๊อกใหญ่ - ออก
  MAIN_REM: 11,    // L: สต๊อกใหญ่ - คงเหลือ
  MAIN_SYS: 12,    // M: สต๊อกใหญ่ - ระบบ
  MAIN_EXP: 13,    // N: Exp.สต๊อกใหญ่
  SUB_EXP: 14,     // O: Exp.สต๊อกเล็ก (location + expiry)
  SUB_PREV: 15,    // P: สต๊อกเล็ก - เดิม
  SUB_IN: 16,      // Q: สต๊อกเล็ก - รับเข้า
  SUB_REM: 17,     // R: สต๊อกเล็ก - คงเหลือ
  PRICE: 18,       // S: ราคา (บาท)
}

/**
 * Number of header rows to skip (row 1 = title, row 2 = main header, row 3 = sub-header)
 */
export const HEADER_ROWS = 3

/**
 * Map a raw sheet row (array) to a Material object
 * @param {Array} row - Raw row data from Sheets API
 * @param {number} sheetRowIndex - The row index in the sheet (0-based from data, add HEADER_ROWS+1 for actual sheet row)
 * @param {string} tabName - The tab this row came from
 */
export function rowToMaterial(row, sheetRowIndex, tabName = '') {
  const code = String(row[COL.CODE] || '').trim()
  const description = String(row[COL.DESCRIPTION] || '').trim()

  // Skip rows without material code or description (empty rows, section headers)
  if (!code || !description) return null
  // Skip non-numeric material codes (section headers like "เพิ่มแผน Case Emergency")
  if (!/^\d+$/.test(code)) return null

  return {
    // Identity
    rowIndex: sheetRowIndex,  // 0-based from data start (after headers)
    sheetRow: sheetRowIndex + HEADER_ROWS + 1, // 1-based actual sheet row number
    tabName,
    no: parseInt(row[COL.NO]) || 0,
    materialCode: code,
    description,
    plant: String(row[COL.PLANT] || '').trim(),
    batch: String(row[COL.BATCH] || '').trim(),
    unit: String(row[COL.UNIT] || '').trim(),

    // Withdraw info
    withdrawDate: cleanDateStr(row[COL.WD_DATE]),
    withdrawQty: parseInt(row[COL.WD_QTY]) || 0,

    // Main stock (สต๊อกใหญ่)
    mainStock: {
      previous: parseInt(row[COL.MAIN_PREV]) || 0,
      received: parseInt(row[COL.MAIN_IN]) || 0,
      issued: parseInt(row[COL.MAIN_OUT]) || 0,
      remaining: parseInt(row[COL.MAIN_REM]) || 0,
      system: parseInt(row[COL.MAIN_SYS]) || 0,
    },
    mainStockExpiry: cleanDateStr(row[COL.MAIN_EXP]),

    // Sub stock (สต๊อกเล็ก)
    subStockExpiry: cleanDateStr(row[COL.SUB_EXP]),
    subStock: {
      previous: parseInt(row[COL.SUB_PREV]) || 0,
      received: parseInt(row[COL.SUB_IN]) || 0,
      remaining: parseInt(row[COL.SUB_REM]) || 0,
    },

    // Price
    price: String(row[COL.PRICE] || '').trim(),

    // Legacy compatibility aliases for existing UI components
    code,
    name: description,
    quantity: (parseInt(row[COL.MAIN_REM]) || 0) + (parseInt(row[COL.SUB_REM]) || 0),
    minStock: 5,
    category: 'วัสดุ',
    expiryDates: [cleanDateStr(row[COL.MAIN_EXP]), cleanDateStr(row[COL.SUB_EXP])].filter(Boolean),
  }
}

/**
 * Merge materials with the same material code (different batches)
 * For display purposes - shows combined totals
 * Keeps individual batch entries accessible for write operations
 *
 * @param {Array} materials - Array of Material objects
 * @returns {Array} Array of merged Material objects with `batches` property
 */
export function mergeBatches(materials) {
  const grouped = {}

  materials.forEach(m => {
    if (!grouped[m.materialCode]) {
      const expDates = [...m.expiryDates]
      grouped[m.materialCode] = {
        ...m,
        // Combined totals
        totalMainRemaining: m.mainStock.remaining,
        totalSubRemaining: m.subStock.remaining,
        totalMainReceived: m.mainStock.received,
        totalSubReceived: m.subStock.received,
        totalMainIssued: m.mainStock.issued,
        quantity: m.mainStock.remaining + m.subStock.remaining,
        expiryDates: expDates,
        // All individual batch entries
        batches: [m],
      }
    } else {
      const existing = grouped[m.materialCode]
      existing.totalMainRemaining += m.mainStock.remaining
      existing.totalSubRemaining += m.subStock.remaining
      existing.totalMainReceived += m.mainStock.received
      existing.totalSubReceived += m.subStock.received
      existing.totalMainIssued += m.mainStock.issued
      existing.quantity += (m.mainStock.remaining + m.subStock.remaining)
      
      m.expiryDates.forEach(d => {
        if (!existing.expiryDates.includes(d)) {
          existing.expiryDates.push(d)
        }
      })
      existing.batches.push(m)
    }
  })

  return Object.values(grouped)
}

/**
 * Filter out cancelled/emergency section items
 * The sheet has sections "เพิ่มแผน Case Emergency" and "ยกเลิกแล้ว" at the bottom
 */
export function filterActiveMaterials(materials) {
  return materials.filter(m => {
    // Skip items with "ยกเลิก" in withdraw date
    if (m.withdrawDate && m.withdrawDate.includes('ยกเลิก')) return false
    return true
  })
}
