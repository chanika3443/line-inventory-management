import { createContext, useContext, useState, useEffect } from 'react'
import * as liffService from '../services/liffService'

const LiffContext = createContext()

export function LiffProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [userName, setUserName] = useState('')
  const [loginMode, setLoginMode] = useState(null) // 'line' or 'manual'

  useEffect(() => {
    async function init() {
      // Check if user has chosen login mode before
      const savedMode = localStorage.getItem('login_mode')
      const savedManualName = localStorage.getItem('manual_user_name')
      
      // Treat Guest01 as not logged in
      if (savedMode === 'manual' && savedManualName && savedManualName !== 'Guest01') {
        // User previously chose manual mode with valid name
        setLoginMode('manual')
        setUserName(savedManualName)
        setIsLoggedIn(true)
        setUserProfile({ displayName: savedManualName, pictureUrl: null })
        setIsReady(true)
        return
      }
      
      // Initialize LIFF first
      const success = await liffService.initializeLiff()
      
      if (success) {
        const loggedIn = liffService.isLoggedIn()
        
        if (loggedIn) {
          // Logged in via LIFF, get fresh profile
          const profile = await liffService.getUserProfile()
          if (profile) {
            setLoginMode('line')
            setIsLoggedIn(true)
            setUserProfile(profile)
            setUserName(profile.displayName || '')
            
            // Update localStorage with fresh data
            localStorage.setItem('login_mode', 'line')
            localStorage.setItem('liff_user_profile', JSON.stringify(profile))
          } else {
            // Failed to get profile, not logged in
            setLoginMode(null)
            setIsLoggedIn(false)
            setUserName('Guest01')
          }
        } else {
          // Not logged in via LIFF
          setLoginMode(null)
          setIsLoggedIn(false)
          setUserProfile(null)
          setUserName('Guest01')
        }
      } else {
        // LIFF failed to initialize (not in LINE app)
        console.warn('LIFF not available')
        setLoginMode(null)
        setIsLoggedIn(false)
        setUserName('Guest01')
      }
      
      // Set ready after everything is done
      setIsReady(true)
    }
    
    init()
  }, [])

  const login = () => {
    liffService.login()
  }

  const loginWithManualName = (name) => {
    if (!name || !name.trim()) return false
    
    const trimmedName = name.trim()
    setLoginMode('manual')
    setIsLoggedIn(true)
    setUserName(trimmedName)
    setUserProfile({ displayName: trimmedName, pictureUrl: null })
    
    localStorage.setItem('login_mode', 'manual')
    localStorage.setItem('manual_user_name', trimmedName)
    
    return true
  }

  const logout = () => {
    console.log('Logout called')
    
    // Logout from LIFF first if in LINE mode
    if (loginMode === 'line') {
      try {
        liffService.logout()
      } catch (error) {
        console.error('LIFF logout error:', error)
      }
    }
    
    // Clear all localStorage
    localStorage.clear()
    
    // Set to Guest01 temporarily (will be treated as not logged in)
    setIsLoggedIn(false)
    setUserProfile(null)
    setUserName('Guest01')
    setLoginMode(null)
    
    // Force re-render to show login screen (not manual input form)
    // This is handled by Layout component checking isLoggedIn
  }

  const value = {
    isReady,
    isLoggedIn,
    userProfile,
    userName,
    loginMode,
    setUserName,
    login,
    loginWithManualName,
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
