/**
 * Google Sheets API Service
 * Handles READ operations directly from Google Sheets API
 */

import { config } from '../config'

const SHEETS_API_BASE = config.sheetsApi.baseUrl
const SPREADSHEET_ID = config.sheetsApi.spreadsheetId
const API_KEY = config.sheetsApi.apiKey

/**
 * Fetch data from Google Sheets
 * @param {string} range - Sheet range (e.g., "Products!A2:I")
 * @returns {Promise<Array>} Array of rows
 */
async function fetchSheetData(range) {
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
  
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
 * Convert row data to Product object
 */
function rowToProduct(row) {
  return {
    code: row[0] || '',
    name: row[1] || '',
    unit: row[2] || '',
    quantity: parseInt(row[3]) || 0,
    lowStockThreshold: parseInt(row[4]) || 0,
    category: row[5] || '',
    returnable: row[6] === 'TRUE' || row[6] === true,
    createdAt: row[7] || '',
    updatedAt: row[8] || ''
  }
}

/**
 * Convert row data to Transaction object
 */
function rowToTransaction(row) {
  return {
    id: row[0] || '',
    timestamp: row[1] || '',
    type: row[2] || '',
    productCode: row[3] || '',
    productName: row[4] || '',
    quantity: parseInt(row[5]) || 0,
    beforeQuantity: parseInt(row[6]) || 0,
    afterQuantity: parseInt(row[7]) || 0,
    userName: row[8] || '',
    note: row[9] || ''
  }
}

/**
 * Get all products
 */
export async function getAllProducts() {
  try {
    const rows = await fetchSheetData('Products!A2:I')
    return rows.map(rowToProduct)
  } catch (error) {
    console.error('Error getting products:', error)
    return []
  }
}

/**
 * Get product by code
 */
export async function getProductByCode(code) {
  const products = await getAllProducts()
  return products.find(p => p.code === code) || null
}

/**
 * Search products by query
 */
export async function searchProducts(query) {
  const products = await getAllProducts()
  
  if (!query) return products
  
  const lowerQuery = query.toLowerCase()
  return products.filter(p => 
    p.code.toLowerCase().includes(lowerQuery) ||
    p.name.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get low stock products
 */
export async function getLowStockProducts() {
  const products = await getAllProducts()
  return products.filter(p => p.quantity <= p.lowStockThreshold)
}

/**
 * Get transaction logs
 */
export async function getTransactionLogs(filters = {}) {
  try {
    const rows = await fetchSheetData('Transactions!A2:J')
    console.log('Raw rows from Sheets:', rows.length, rows.slice(0, 2))
    
    let transactions = rows.map(rowToTransaction)
    console.log('Parsed transactions:', transactions.length, transactions.slice(0, 2))
    
    // Apply filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      console.log('Filtering by startDate:', startDate, 'Before:', transactions.length)
      transactions = transactions.filter(t => {
        const txDate = new Date(t.timestamp)
        return txDate >= startDate
      })
      console.log('After startDate filter:', transactions.length)
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      console.log('Filtering by endDate:', endDate, 'Before:', transactions.length)
      transactions = transactions.filter(t => {
        const txDate = new Date(t.timestamp)
        return txDate <= endDate
      })
      console.log('After endDate filter:', transactions.length)
    }
    
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type)
    }
    
    if (filters.productCode) {
      transactions = transactions.filter(t => t.productCode === filters.productCode)
    }
    
    if (filters.userName) {
      const lowerUserName = filters.userName.toLowerCase()
      transactions = transactions.filter(t => 
        t.userName.toLowerCase().includes(lowerUserName)
      )
    }
    
    // Sort by timestamp descending
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    console.log('Final transactions:', transactions.length)
    return transactions
  } catch (error) {
    console.error('Error getting transaction logs:', error)
    return []
  }
}
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    return transactions
  } catch (error) {
    console.error('Error getting transaction logs:', error)
    return []
  }
}

/**
 * Get dashboard data
 */
export async function getDashboardData() {
  try {
    const products = await getAllProducts()
    const lowStockProducts = await getLowStockProducts()
    
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0)
    
    return {
      totalProducts: products.length,
      totalQuantity,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    }
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    return {
      totalProducts: 0,
      totalQuantity: 0,
      lowStockCount: 0,
      lowStockProducts: []
    }
  }
}
