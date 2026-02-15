import { createContext, useContext, useState, useCallback } from 'react'
import * as sheetsService from '../services/sheetsService'
import * as appsScriptService from '../services/appsScriptService'

const SheetsContext = createContext()

export function SheetsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await sheetsService.getAllProducts()
      setProducts(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch transactions
  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await sheetsService.getTransactionLogs(filters)
      setTransactions(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Add product
  const addProduct = useCallback(async (product, userName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.addProduct(product, userName)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  // Update product
  const updateProduct = useCallback(async (code, updates, userName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.updateProduct(code, updates, userName)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  // Delete product
  const deleteProduct = useCallback(async (code, userName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.deleteProduct(code, userName)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  // Withdraw
  const withdraw = useCallback(async (productCode, quantity, userName, note = '') => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.withdraw(productCode, quantity, userName, note)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  // Receive
  const receive = useCallback(async (productCode, quantity, userName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.receive(productCode, quantity, userName)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  // Return product
  const returnProduct = useCallback(async (productCode, quantity, userName, note) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.returnProduct(productCode, quantity, userName, note)
      if (result.success) {
        await fetchProducts() // Refresh products
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  const value = {
    products,
    transactions,
    loading,
    error,
    fetchProducts,
    fetchTransactions,
    addProduct,
    updateProduct,
    deleteProduct,
    withdraw,
    receive,
    returnProduct
  }

  return <SheetsContext.Provider value={value}>{children}</SheetsContext.Provider>
}

export function useSheets() {
  const context = useContext(SheetsContext)
  if (!context) {
    throw new Error('useSheets must be used within SheetsProvider')
  }
  return context
}
