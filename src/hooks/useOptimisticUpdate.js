import { useState, useCallback } from 'react'

/**
 * Hook for optimistic UI updates with rollback on error
 * Prevents race conditions and provides instant feedback
 */
export function useOptimisticUpdate(initialData, updateFn) {
  const [data, setData] = useState(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)

  const update = useCallback(async (optimisticData, serverUpdateFn) => {
    // Prevent concurrent updates
    if (isUpdating) {
      return { success: false, message: 'กำลังดำเนินการอยู่ กรุณารอสักครู่' }
    }

    setIsUpdating(true)
    setError(null)
    
    // Store original data for rollback
    const originalData = data
    
    // Apply optimistic update immediately
    setData(optimisticData)
    
    try {
      // Perform server update
      const result = await serverUpdateFn()
      
      if (!result.success) {
        // Rollback on error
        setData(originalData)
        setError(result.message)
      }
      
      return result
    } catch (err) {
      // Rollback on exception
      setData(originalData)
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setIsUpdating(false)
    }
  }, [data, isUpdating])

  return { data, setData, update, isUpdating, error }
}
