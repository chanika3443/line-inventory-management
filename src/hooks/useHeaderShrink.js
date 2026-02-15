import { useEffect } from 'react'

export function useHeaderShrink() {
  useEffect(() => {
    const header = document.querySelector('.header')
    if (!header) return

    let ticking = false
    const scrollThreshold = 20

    function updateHeader() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('header-compact')
      } else {
        header.classList.remove('header-compact')
      }
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}
