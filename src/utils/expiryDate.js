/**
 * Clean and format date strings
 * Shortens long ISO date strings (e.g. "2030-07-31T17:00:00.000Z" -> "01/08/2030")
 * @param {string|Date} val
 * @returns {string}
 */
export function cleanDateStr(val) {
  if (!val) return ''
  let str = String(val).trim()
  return str.replace(/(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g, (match) => {
    const d = new Date(match)
    if (!isNaN(d.getTime())) {
      const day = d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'Asia/Bangkok' })
      const month = d.toLocaleDateString('en-GB', { month: '2-digit', timeZone: 'Asia/Bangkok' })
      const year = d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Asia/Bangkok' })
      return `${day}/${month}/${year}`
    }
    return match
  })
}

/**
 * Flexible date parser for various date formats (ISO, dd/MM/yyyy, MM/yyyy, dd/MM/yy)
 * @param {string|Date} dateVal
 * @returns {Date|null}
 */
export function parseDateFlexible(dateVal) {
  if (!dateVal) return null
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal

  const str = cleanDateStr(dateVal)

  // dd/MM/yyyy or dd/MM/yy
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10)
    let month = parseInt(dmyMatch[2], 10) - 1
    let year = parseInt(dmyMatch[3], 10)
    if (year < 100) year += 2000
    if (year > 2500) year -= 543
    return new Date(year, month, day)
  }

  // MM/yyyy or MM/yy
  const myMatch = str.match(/^(\d{1,2})\/(\d{2,4})/)
  if (myMatch) {
    let month = parseInt(myMatch[1], 10) - 1
    let year = parseInt(myMatch[2], 10)
    if (year < 100) year += 2000
    if (year > 2500) year -= 543
    return new Date(year, month, 1)
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Calculate expiry status and color
 * @param {string} expiryDate - Date string in various formats
 * @returns {Object} { status, color, daysLeft, text }
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return { status: 'none', color: '#999', daysLeft: null }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = parseDateFlexible(expiryDate)
  if (!expiry) {
    return { status: 'none', color: '#999', daysLeft: null }
  }
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
    .map(date => ({ raw: cleanDateStr(date), parsed: parseDateFlexible(date) }))
    .filter(item => item.parsed && item.parsed >= today)
    .sort((a, b) => a.parsed - b.parsed)
  
  if (validDates.length > 0) {
    return validDates[0].raw
  }

  const allParsed = expiryDates
    .map(date => ({ raw: cleanDateStr(date), parsed: parseDateFlexible(date) }))
    .filter(item => item.parsed)
    .sort((a, b) => b.parsed - a.parsed)

  return allParsed[0]?.raw || null
}

/**
 * Format date to Thai format
 * @param {string} dateString - Date string in various formats
 * @returns {string} Formatted date (d/m/yyyy BE)
 */
export function formatThaiDate(dateString) {
  if (!dateString) return ''
  
  const date = parseDateFlexible(dateString)
  if (!date) return cleanDateStr(dateString)

  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear() + 543 // Convert to Buddhist year
  
  return `${day}/${month}/${year}`
}
