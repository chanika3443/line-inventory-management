/**
 * User-friendly error messages
 * แปลง error messages ให้เป็นมิตรและเข้าใจง่าย
 */

export const ERROR_MESSAGES = {
  // Validation errors
  REQUIRED_PRODUCT: '🔍 กรุณาเลือกวัสดุที่ต้องการก่อนนะ',
  REQUIRED_QUANTITY: '🔢 อย่าลืมใส่จำนวนด้วยนะ',
  REQUIRED_USER: '👤 กรุณาระบุชื่อของคุณด้วย',
  REQUIRED_PRODUCT_AND_QUANTITY: '📦 กรุณาเลือกวัสดุและระบุจำนวนด้วยนะ',
  
  // Stock errors
  INSUFFICIENT_STOCK: '⚠️ วัสดุไม่เพียงพอ กรุณาตรวจสอบจำนวนคงเหลือ',
  OUT_OF_STOCK: '❌ วัสดุหมดแล้ว กรุณารับเข้าก่อนนะ',
  
  // Product errors
  PRODUCT_NOT_FOUND: '🔍 ไม่พบวัสดุที่คุณต้องการ ลองค้นหาใหม่ดูนะ',
  PRODUCT_EXISTS: '⚠️ มีวัสดุนี้อยู่แล้ว ลองใช้รหัสอื่นดูนะ',
  CANNOT_RETURN: '🚫 วัสดุนี้ไม่สามารถคืนได้',
  
  // Delete confirmation
  DELETE_CONFIRM_FAILED: '⚠️ กรุณาพิมพ์ "delete" เพื่อยืนยันการลบ',
  
  // Network errors
  NETWORK_ERROR: '📡 เกิดปัญหาการเชื่อมต่อ ลองอีกครั้งนะ',
  SERVER_ERROR: '⚙️ เซิร์ฟเวอร์มีปัญหา กรุณารอสักครู่แล้วลองใหม่',
  TIMEOUT_ERROR: '⏱️ ใช้เวลานานเกินไป ลองอีกครั้งนะ',
  
  // Permission errors
  NO_PERMISSION: '🔒 คุณไม่มีสิทธิ์ทำรายการนี้',
  LOGIN_REQUIRED: '🔐 กรุณา login ก่อนใช้งาน',
  LINE_LOGIN_REQUIRED: '📱 หน้านี้ต้อง Login with LINE เท่านั้น',
  
  // Export errors
  EXPORT_IN_LINE: '⚠️ ไม่สามารถ Export ใน LINE ได้\n\nกรุณาเปิดในเบราว์เซอร์ภายนอก',
  
  // Empty states
  NO_PRODUCTS: '📦 ยังไม่มีวัสดุในระบบ เพิ่มวัสดุใหม่ได้เลย',
  NO_RETURNABLE_PRODUCTS: '📦 ไม่พบวัสดุที่สามารถคืนได้',
  NO_TRANSACTIONS: '📋 ยังไม่มีประวัติการทำรายการ',
  NO_DATA: '📊 ไม่พบข้อมูลในช่วงเวลาที่เลือก ลองเลือกช่วงเวลาอื่นดูนะ',
  
  // Success messages
  SUCCESS_WITHDRAW: '✅ เบิกวัสดุสำเร็จแล้ว',
  SUCCESS_RECEIVE: '✅ รับเข้าวัสดุสำเร็จแล้ว',
  SUCCESS_RETURN: '✅ คืนวัสดุสำเร็จแล้ว',
  SUCCESS_ADD: '✅ เพิ่มวัสดุสำเร็จแล้ว',
  SUCCESS_UPDATE: '✅ แก้ไขวัสดุสำเร็จแล้ว',
  SUCCESS_DELETE: '✅ ลบวัสดุสำเร็จแล้ว'
}

/**
 * Get friendly error message
 * @param {string} errorCode - Error code or original message
 * @returns {string} User-friendly message
 */
export function getFriendlyMessage(errorCode) {
  // If it's a known error code, return friendly message
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode]
  }
  
  // Try to make generic errors more friendly
  const message = errorCode.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  if (message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR
  }
  
  if (message.includes('server') || message.includes('500')) {
    return ERROR_MESSAGES.SERVER_ERROR
  }
  
  if (message.includes('permission') || message.includes('403')) {
    return ERROR_MESSAGES.NO_PERMISSION
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return ERROR_MESSAGES.PRODUCT_NOT_FOUND
  }
  
  // Return original message with friendly prefix
  return '⚠️ ' + errorCode
}

/**
 * Show success message with icon
 * @param {string} action - Action type (withdraw, receive, return, add, update, delete)
 * @returns {string} Success message
 */
export function getSuccessMessage(action) {
  const key = `SUCCESS_${action.toUpperCase()}`
  return ERROR_MESSAGES[key] || '✅ ดำเนินการสำเร็จแล้ว'
}
