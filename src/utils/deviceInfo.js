/**
 * Get device information for audit logging
 */

export function getDeviceInfo() {
  const ua = navigator.userAgent
  
  // Detect device type
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua)
  const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
  
  // Detect OS
  let os = 'Unknown'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'
  
  // Detect browser
  let browser = 'Unknown'
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge'
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE'
  
  // Screen info
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const screenSize = `${screenWidth}x${screenHeight}`
  
  // Language
  const language = navigator.language || navigator.userLanguage
  
  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  return {
    deviceType,
    os,
    browser,
    screenSize,
    language,
    timezone,
    userAgent: ua
  }
}

export function getDeviceInfoString() {
  const info = getDeviceInfo()
  return `${info.deviceType} | ${info.os} | ${info.browser} | ${info.screenSize}`
}
