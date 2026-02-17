import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for polling data at regular intervals
 * Provides real-time updates without WebSocket
 */
export function usePolling(fetchFn, interval = 30000, enabled = true) {
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)

  const startPolling = useCallback(() => {
    if (!enabled) return

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(async () => {
      if (isMountedRef.current) {
        try {
          await fetchFn()
        } catch (error) {
          console.error('Polling error:', error)
        }
      }
    }, interval)
  }, [fetchFn, interval, enabled])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    
    if (enabled) {
      startPolling()
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Pause polling when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (enabled) {
        // Fetch immediately when page becomes visible
        fetchFn()
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, fetchFn, startPolling, stopPolling])

  return { startPolling, stopPolling }
}
