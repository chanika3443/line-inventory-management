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
      // Try to load from localStorage first
      const savedProfile = localStorage.getItem('liff_user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          setUserName(profile.displayName || '')
          setIsLoggedIn(true)
        } catch (e) {
          console.error('Failed to parse saved profile:', e)
        }
      }

      const success = await liffService.initializeLiff()
      
      if (success) {
        const loggedIn = liffService.isLoggedIn()
        
        if (loggedIn) {
          // Logged in, get profile
          setIsLoggedIn(true)
          const profile = await liffService.getUserProfile()
          setUserProfile(profile)
          setUserName(profile?.displayName || '')
          
          // Save to localStorage
          if (profile) {
            localStorage.setItem('liff_user_profile', JSON.stringify(profile))
          }
        }
      } else {
        // LIFF failed to initialize, use fallback mode
        console.warn('LIFF not available, using manual input mode')
      }
      
      setIsReady(true)
    }
    
    init()
  }, [])

  const login = () => {
    liffService.login()
  }

  const logout = () => {
    liffService.logout()
    setIsLoggedIn(false)
    setUserProfile(null)
    setUserName('')
    // Clear localStorage
    localStorage.removeItem('liff_user_profile')
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
