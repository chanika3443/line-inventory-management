import { createContext, useContext, useState, useEffect } from 'react'
import * as liffService from '../services/liffService'

const LiffContext = createContext()

export function LiffProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function init() {
      // Try to load from localStorage first for immediate UI update
      const savedProfile = localStorage.getItem('liff_user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          setUserName(profile.displayName || '')
          setIsLoggedIn(true)
        } catch (e) {
          console.error('Failed to parse saved profile:', e)
          localStorage.removeItem('liff_user_profile')
        }
      }

      // Set ready immediately so UI can render
      setIsReady(true)

      // Initialize LIFF in background
      const success = await liffService.initializeLiff()
      
      if (success) {
        const loggedIn = liffService.isLoggedIn()
        
        if (loggedIn) {
          // Logged in, get fresh profile
          const profile = await liffService.getUserProfile()
          if (profile) {
            setIsLoggedIn(true)
            setUserProfile(profile)
            setUserName(profile.displayName || '')
            
            // Update localStorage with fresh data
            localStorage.setItem('liff_user_profile', JSON.stringify(profile))
          }
        } else {
          // Not logged in via LIFF
          // If we have saved profile, keep it (manual mode)
          // Otherwise clear everything
          if (!savedProfile) {
            setIsLoggedIn(false)
            setUserProfile(null)
            setUserName('')
          }
        }
      } else {
        // LIFF failed to initialize
        console.warn('LIFF not available, using manual input mode')
        // Keep saved profile if exists, otherwise use manual mode
      }
    }
    
    init()
  }, [])

  const login = () => {
    liffService.login()
  }

  const logout = () => {
    console.log('Logout called')
    
    // Clear localStorage first
    localStorage.removeItem('liff_user_profile')
    
    // Clear state
    setIsLoggedIn(false)
    setUserProfile(null)
    setUserName('')
    
    // Logout from LIFF (will reload page)
    try {
      liffService.logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Force reload anyway
      window.location.reload()
    }
  }

  const value = {
    isReady,
    isLoggedIn,
    userProfile,
    userName,
    setUserName, // Allow manual name input
    login,
    logout,
    isInClient: liffService.isInClient(),
    closeWindow: liffService.closeWindow,
    sendMessages: liffService.sendMessages
  }

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>
}

export function useLiff() {
  const context = useContext(LiffContext)
  if (!context) {
    throw new Error('useLiff must be used within LiffProvider')
  }
  return context
}
