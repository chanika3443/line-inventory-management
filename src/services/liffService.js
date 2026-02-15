/**
 * LINE LIFF Service
 * Handles LINE LIFF initialization and user profile
 */

import liff from '@line/liff'
import { config } from '../config'

let isInitialized = false
let userProfile = null

/**
 * Initialize LIFF
 */
export async function initializeLiff() {
  if (isInitialized) {
    return true
  }
  
  try {
    await liff.init({ liffId: config.liff.id })
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
 * Login with LINE
 */
export function login() {
  // Save current page to return after login
  const currentPath = window.location.pathname + window.location.search
  liff.login({ redirectUri: window.location.origin + currentPath })
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
