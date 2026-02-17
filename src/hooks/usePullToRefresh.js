import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const isRefreshing = useRef(false)

  useEffect(() => {
    let touchStartY = 0
    let currentY = 0

    const handleTouchStart = (e) => {
      // Only trigger if at top of page
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY
        startY.current = touchStartY
      }
    }

    const handleTouchMove = (e) => {
      if (window.scrollY === 0 && !isRefreshing.current) {
        currentY = e.touches[0].clientY
        const distance = currentY - touchStartY

        if (distance > 0 && distance < 150) {
          setIsPulling(true)
          setPullDistance(distance)
          // Prevent default scroll
          if (distance > 10) {
            e.preventDefault()
          }
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > 80 && !isRefreshing.current) {
        isRefreshing.current = true
        setIsPulling(true)
        setPullDistance(80)
        
        try {
          await onRefresh()
        } finally {
          setTimeout(() => {
            setIsPulling(false)
            setPullDistance(0)
            isRefreshing.current = false
          }, 300)
        }
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, pullDistance])

  return { isPulling, pullDistance }
}
