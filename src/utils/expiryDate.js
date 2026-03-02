/**
 * Calculate expiry status and color
 * @param {string} expiryDate - Date string in YYYY-MM-DD format
 * @returns {Object} { status, color, daysLeft }
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return { status: 'none', color: '#999', daysLeft: null }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry - today
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) {
    return { status: 'expired', color: '#8e8e93', daysLeft, text: 'หมดอายุแล้ว' }
  } else if (daysLeft <= 7) {
    return { status: 'critical', color: '#ff3b30', daysLeft, text: `เหลือ ${daysLeft} วัน` }
  } else if (daysLeft <= 30) {
    return { status: 'warning', color: '#ff9f0a', daysLeft, text: `เหลือ ${daysLeft} วัน` }
  } else {
    return { status: 'good', color: '#34c759', daysLeft, text: `เหลือ ${daysLeft} วัน` }
  }
}

/**
 * Get the nearest expiry date from an array of dates
 * @param {Array<string>} expiryDates - Array of date strings
 * @returns {string|null} Nearest expiry date
 */
export function getNearestExpiryDate(expiryDates) {
  if (!expiryDates || expiryDates.length === 0) {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Filter out expired dates and sort by date
  const validDates = expiryDates
    .filter(date => date && new Date(date) >= today)
    .sort((a, b) => new Date(a) - new Date(b))
  
  return validDates[0] || expiryDates.sort((a, b) => new Date(b) - new Date(a))[0]
}

/**
 * Format date to Thai format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export function formatThaiDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear() + 543 // Convert to Buddhist year
  
  return `${day}/${month}/${year}`
}
