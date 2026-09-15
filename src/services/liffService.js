/**
 * LINE LIFF Service
 * Handles LINE LIFF initialization and user profile
 */

import liff from '@line/liff'
import { config } from '../config/index.js'

let isInitialized = false
let userProfile = null

/**
 * Initialize LIFF with timeout
 */
export async function initializeLiff() {
  if (isInitialized) {
    return true
  }
  
  // Skip LIFF in localhost development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Skipping LIFF initialization in localhost')
    return false
  }
  
  try {
    // Add timeout to prevent hanging
    const initPromise = liff.init({ liffId: config.liff.id })
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('LIFF init timeout')), 5000)
    )
    
    await Promise.race([initPromise, timeoutPromise])
    isInitialized = true
    
    // Get user profile if logged in
    if (liff.isLoggedIn()) {
      userProfile = await liff.getProfile()
    }
    
    return true
  } catch (error) {
    console.error('LIFF initialization failed:', error)
    return false
  }
}

/**
 * Check if LIFF is in LINE client
 */
export function isInClient() {
  return liff.isInClient()
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return liff.isLoggedIn()
}

/**
 * Login with LINE (works on both mobile LINE app and PC web browsers)
 */
export async function login() {
  try {
    if (!isInitialized) {
      await initializeLiff()
    }
    const baseUrl = window.location.origin + window.location.pathname
    const redirectUri = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
    liff.login({ redirectUri })
  } catch (err) {
    console.warn('LIFF login with redirectUri error, falling back:', err)
    try {
      liff.login()
    } catch (e) {
      console.error('LIFF login failed:', e)
    }
  }
}

/**
 * Logout from LINE
 */
export function logout() {
  console.log('liffService.logout called')
  
  // Clear localStorage first
  localStorage.clear()
  
  // Clear profile
  userProfile = null
  
  // Logout from LIFF if initialized and logged in
  if (isInitialized && liff.isLoggedIn()) {
    console.log('Calling liff.logout()')
    try {
      // LIFF logout - this clears the access token
      liff.logout()
    } catch (error) {
      console.error('LIFF logout error:', error)
    }
  }
  
  // Don't reload or redirect - let React handle the state change
  console.log('Logout complete - state cleared')
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  if (userProfile) {
    return userProfile
  }
  
  if (!isLoggedIn()) {
    return null
  }
  
  try {
    userProfile = await liff.getProfile()
    return userProfile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Get user display name
 */
export async function getUserName() {
  const profile = await getUserProfile()
  return profile ? profile.displayName : 'Guest'
}

/**
 * Close LIFF window
 */
export function closeWindow() {
  if (isInClient()) {
    liff.closeWindow()
  }
}

/**
 * Send messages to LINE chat
 */
export async function sendMessages(messages) {
  if (!isInClient()) {
    console.warn('Not in LINE client, cannot send messages')
    return false
  }
  
  try {
    await liff.sendMessages(messages)
    return true
  } catch (error) {
    console.error('Error sending messages:', error)
    return false
  }
}
