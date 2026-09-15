import { createContext, useContext, useState, useCallback } from 'react'
import * as sheetsService from '../services/sheetsService'
import * as appsScriptService from '../services/appsScriptService'
import { getCurrentMonthTabName, mergeBatches } from '../utils/sheetHelpers'

const SheetsContext = createContext()

export function SheetsProvider({ children }) {
  // Materials state (replaces products)
  const [materials, setMaterials] = useState([])        // raw materials (all batches)
  const [mergedMaterials, setMergedMaterials] = useState([]) // merged by material code
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Tab management
  const [currentTab, setCurrentTab] = useState(getCurrentMonthTabName())
  const [availableTabs, setAvailableTabs] = useState([])

  // Fetch available tabs
  const fetchTabs = useCallback(async () => {
    try {
      const tabs = await sheetsService.getAvailableTabs()
      setAvailableTabs(tabs)
      return tabs
    } catch (err) {
      console.error('Error fetching tabs:', err)
      return []
    }
  }, [])

  // Fetch materials from a specific tab
  const fetchMaterials = useCallback(async (tabName = null) => {
    setLoading(true)
    setError(null)
    try {
      const tab = tabName || currentTab
      const rawData = await sheetsService.getAllMaterials(tab)
      setMaterials(rawData)

      const merged = mergeBatches(rawData)
      setMergedMaterials(merged)

      return merged
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentTab])

  // Switch tab
  const switchTab = useCallback(async (tabName) => {
    setCurrentTab(tabName)
    return await fetchMaterials(tabName)
  }, [fetchMaterials])

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

  // Withdraw
  const withdraw = useCallback(async (materialCode, quantity, userName, note = '', stockType = 'main', batch = '', sheetRow = null) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.withdraw(
        materialCode, quantity, userName, note, stockType, batch, sheetRow, currentTab
      )
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  // Receive
  const receive = useCallback(async (materialCode, quantity, userName, stockType = 'main', batch = '', sheetRow = null) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.receive(
        materialCode, quantity, userName, stockType, batch, sheetRow, currentTab
      )
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  // Return material
  const returnMaterial = useCallback(async (materialCode, quantity, userName, note = '', stockType = 'main', batch = '', sheetRow = null) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.returnMaterial(
        materialCode, quantity, userName, note, stockType, batch, sheetRow, currentTab
      )
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  // Add material
  const addMaterial = useCallback(async (material) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.addMaterial(material, currentTab)
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  // Update material
  const updateMaterial = useCallback(async (sheetRow, updates) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.updateMaterial(sheetRow, updates, currentTab)
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  // Delete material
  const deleteMaterial = useCallback(async (sheetRow, userName) => {
    setLoading(true)
    setError(null)
    try {
      const result = await appsScriptService.deleteMaterial(sheetRow, userName, currentTab)
      if (result.success) {
        await fetchMaterials(currentTab)
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [currentTab, fetchMaterials])

  const value = {
    // Data
    materials,
    mergedMaterials,
    transactions,
    loading,
    error,
    // Tab management
    currentTab,
    availableTabs,
    fetchTabs,
    switchTab,
    // Read
    fetchMaterials,
    fetchTransactions,
    // Write
    withdraw,
    receive,
    returnMaterial,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    // Legacy aliases
    products: mergedMaterials,
    fetchProducts: fetchMaterials,
    addProduct: addMaterial,
    updateProduct: (code, updates, userName) => updateMaterial(null, { ...updates, userName }),
    deleteProduct: (code, userName) => deleteMaterial(null, userName),
    returnProduct: returnMaterial,
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
