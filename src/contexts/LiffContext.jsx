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
      const success = await liffService.initializeLiff()
      
      if (success) {
        const loggedIn = liffService.isLoggedIn()
        
        if (!loggedIn) {
          // Not logged in, redirect to LINE login
          console.log('Not logged in, redirecting to LINE login...')
          liffService.login()
          return // Don't set isReady yet
        }
        
        // Logged in, get profile
        setIsLoggedIn(true)
        const profile = await liffService.getUserProfile()
        setUserProfile(profile)
        setUserName(profile?.displayName || '')
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
