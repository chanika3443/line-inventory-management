import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import { haptics } from '../utils/haptics'
import { ERROR_MESSAGES } from '../utils/errorMessages'
import { getExpiryStatus, getNearestExpiryDate, formatThaiDate } from '../utils/expiryDate'
import './Transaction.css'

export default function Withdraw() {
  const { products, fetchProducts, withdraw, loading } = useSheets()
  const { userName: liffUserName } = useLiff()
  

  
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('1')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [roomNumber, setRoomNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get default patient type based on current time
  const getDefaultPatientType = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeInMinutes = hours * 60 + minutes
    
    // 20:30 = 1230 minutes, 06:30 = 390 minutes
    // ดึก: 20:30-06:30 (1230-1440 and 0-390)
    // รับใหม่: 06:30-20:30 (390-1230)
    if (timeInMinutes >= 1230 || timeInMinutes < 390) {
      return 'ดึก'
    } else {
      return 'รับใหม่'
    }
  }
  
  const [patientType, setPatientType] = useState(getDefaultPatientType())
  const [message, setMessage] = useState(null)
  
  // Multi-select mode
  const [selectedItems, setSelectedItems] = useState([]) // [{ product, quantity }]
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isFooterExpanded, setIsFooterExpanded] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Lock scroll on mount, unlock on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [])

  // Refresh products when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchProducts])

  useEffect(() => {
    // Update local userName when LIFF userName changes
    if (liffUserName) {
      setLocalUserName(liffUserName)
    }
  }, [liffUserName])

  const toggleProductSelection = (product) => {
    haptics.selection()
    const isSelected = selectedItems.some(item => item.product.code === product.code)
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item.product.code !== product.code))
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }])
    }
    setIsMultiSelectMode(true)
  }

  const updateItemQuantity = (productCode, newQuantity) => {
    setSelectedItems(selectedItems.map(item => 
      item.product.code === productCode 
        ? { ...item, quantity: parseInt(newQuantity) || 1 }
        : item
    ))
  }

  const handleMultiWithdraw = async () => {
    haptics.medium()
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: ERROR_MESSAGES.REQUIRED_PRODUCT })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: ERROR_MESSAGES.REQUIRED_USER })
      return
    }

    // Withdraw each item
    let successCount = 0
    let failCount = 0

    for (const item of selectedItems) {
      const result = await withdraw(item.product.code, item.quantity, userName)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (failCount === 0) {
      haptics.success()
      setMessage({ type: 'success', text: `เบิกสำเร็จ ${successCount} รายการ` })
      setSelectedItems([])
      setIsMultiSelectMode(false)
    } else {
      haptics.error()
      setMessage({ type: 'error', text: `เบิกสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ` })
    }
  }

  const cancelMultiSelect = () => {
    setSelectedItems([])
    // Don't change mode - stay in multi-select mode
    // setIsMultiSelectMode(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    // Prevent concurrent submissions
    if (isSubmitting) {
      haptics.error()
      setMessage({ type: 'error', text: 'กำลังดำเนินการอยู่ กรุณารอสักครู่' })
      return
    }
    
    haptics.medium()
    
    if (!selectedProduct || !quantity) {
      setMessage({ type: 'error', text: ERROR_MESSAGES.REQUIRED_PRODUCT_AND_QUANTITY })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: ERROR_MESSAGES.REQUIRED_USER })
      return
    }

    // Check stock availability before submitting
    const currentProduct = products.find(p => p.code === selectedProduct.code)
    if (!currentProduct) {
      haptics.error()
      setMessage({ type: 'error', text: 'ไม่พบข้อมูลสินค้า กรุณารีเฟรชหน้าใหม่' })
      return
    }
    
    if (currentProduct.quantity < quantity) {
      haptics.error()
      setMessage({ 
        type: 'error', 
        text: `สต็อกไม่เพียงพอ (เหลือ ${currentProduct.quantity} ${currentProduct.unit})` 
      })
      return
    }

    // Create note with room and/or patient type (if provided)
    let noteParts = []
    if (roomNumber.trim()) {
      noteParts.push(`ห้อง: ${roomNumber}`)
    }
    if (selectedProduct.requirePatientType) {
      noteParts.push(`ประเภท: ${patientType}`)
    }
    const note = noteParts.join(', ')
    
    setIsSubmitting(true)
    const result = await withdraw(selectedProduct.code, quantity, userName, note)
    setIsSubmitting(false)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      
      setSelectedProduct(null)
      setQuantity('1')
      setRoomNumber('')
      setPatientType(getDefaultPatientType())
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>เบิกวัสดุ</h1>
          <p className="header-subtitle">เบิกวัสดุออกจากคลัง</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-page">
      <div className="header">
        <h1>เบิกวัสดุ</h1>
        <p className="header-subtitle">เบิกวัสดุออกจากคลัง</p>
      </div>

      <div className="container" style={{ paddingBottom: '100px' }}>
        {message && (
          <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-danger'}>
            {message.text}
          </div>
        )}

        {!selectedProduct ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => {
                  setIsMultiSelectMode(false)
                  setSelectedItems([])
                }}
                className={`btn ${!isMultiSelectMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
              >
                เบิกรายการเดียว
              </button>
              <button
                onClick={() => setIsMultiSelectMode(true)}
                className={`btn ${isMultiSelectMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
              >
                เบิกหลายรายการ
              </button>
            </div>

            <div className="product-list">
              {products.map((product) => {
                const isSelected = selectedItems.some(item => item.product.code === product.code)
                const nearestExpiry = getNearestExpiryDate(product.expiryDates)
                const expiryStatus = nearestExpiry ? getExpiryStatus(nearestExpiry) : null
                
                return (
                  <div
                    key={product.code}
                    className={`product-item ${isSelected ? 'selected' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => {
                      if (isMultiSelectMode) {
                        toggleProductSelection(product)
                      } else {
                        setSelectedProduct(product)
                      }
                    }}
                  >
                    {isMultiSelectMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0, pointerEvents: 'none' }}
                      />
                    )}
                    <div 
                      style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        {expiryStatus && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: expiryStatus.color,
                            fontWeight: '600',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>📅</span>
                            <span>{expiryStatus.text} ({formatThaiDate(nearestExpiry)})</span>
                          </div>
                        )}
                      </div>
                      <div className="product-quantity">
                        {product.quantity} {product.unit}
                        {product.quantity <= product.lowStockThreshold && (
                          <span className="badge badge-warning ml-sm">ใกล้หมด</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {isMultiSelectMode && selectedItems.length > 0 && (
              <div className="multi-select-footer" style={{ 
                position: 'fixed', 
                bottom: 'calc(60px + env(safe-area-inset-bottom))', 
                left: '0', 
                right: '0', 
                background: 'white', 
                padding: isFooterExpanded ? '16px' : '12px 16px',
                paddingBottom: isFooterExpanded ? 'calc(16px + env(safe-area-inset-bottom))' : 'calc(12px + env(safe-area-inset-bottom))',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
                borderTop: '1px solid #e5e5e7',
                zIndex: 50,
                maxHeight: isFooterExpanded ? '60vh' : 'auto',
                overflowY: isFooterExpanded ? 'auto' : 'hidden',
                transition: 'all 0.3s ease',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}>
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                  {/* Header - Always visible */}
                  <div 
                    onClick={() => setIsFooterExpanded(!isFooterExpanded)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      marginBottom: isFooterExpanded ? '16px' : '12px',
                      padding: '8px 12px',
                      background: isFooterExpanded ? 'transparent' : '#f5f5f7',
                      borderRadius: '12px',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      fontSize: '17px', 
                      fontWeight: '600', 
                      color: '#1d1d1f',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{isFooterExpanded ? '📋' : '📦'}</span>
                      <span>รายการที่เลือก</span>
                      <span style={{
                        background: '#007aff',
                        color: 'white',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                        {selectedItems.length}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#007aff',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <span>{isFooterExpanded ? 'ย่อลง' : 'ดูรายการ'}</span>
                      <div style={{
                        transform: isFooterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        fontSize: '12px'
                      }}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isFooterExpanded && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        {selectedItems.map((item) => {
                          const nearestExpiry = getNearestExpiryDate(item.product.expiryDates)
                          const expiryStatus = nearestExpiry ? getExpiryStatus(nearestExpiry) : null
                          
                          return (
                      <div key={item.product.code} style={{ 
                        background: 'var(--bg-secondary)', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            คงเหลือ: {item.product.quantity} {item.product.unit}
                          </div>
                          {expiryStatus && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: expiryStatus.color,
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              📅 {expiryStatus.text}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newQty = Math.max(1, item.quantity - 1)
                              updateItemQuantity(item.product.code, newQty)
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1.5px solid var(--border-strong)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '18px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.product.code, e.target.value)}
                            min="1"
                            max={item.product.quantity}
                            style={{
                              width: '60px',
                              padding: '8px',
                              border: '1.5px solid var(--border-strong)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '14px',
                              fontWeight: '600',
                              textAlign: 'center',
                              background: 'var(--bg-primary)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newQty = Math.min(item.product.quantity, item.quantity + 1)
                              updateItemQuantity(item.product.code, newQty)
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1.5px solid var(--border-strong)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '18px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleProductSelection(item.product)
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '20px',
                            padding: '4px 8px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                        })}
                  </div>


                  </>
                  )}

                  {/* Buttons - Always visible */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: isFooterExpanded ? '0' : '12px' }}>
                    <button 
                      onClick={handleMultiWithdraw} 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      <Icon name="withdraw" size={20} color="white" />
                      {loading ? 'กำลังบันทึก...' : `เบิก ${selectedItems.length} รายการ`}
                    </button>
                    <button 
                      onClick={cancelMultiSelect} 
                      className="btn btn-secondary"
                      style={{ minWidth: '80px' }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="card-title">รายละเอียดการเบิก</div>
            <form onSubmit={handleWithdraw}>
              <div className="selected-product">
                <div className="product-name">{selectedProduct.name}</div>
                {(() => {
                  const nearestExpiry = getNearestExpiryDate(selectedProduct.expiryDates)
                  const expiryStatus = nearestExpiry ? getExpiryStatus(nearestExpiry) : null
                  
                  if (expiryStatus) {
                    return (
                      <div style={{ 
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: `${expiryStatus.color}15`,
                        border: `1.5px solid ${expiryStatus.color}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600',
                            color: expiryStatus.color
                          }}>
                            {expiryStatus.text}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: expiryStatus.color,
                            opacity: 0.8,
                            marginTop: '2px'
                          }}>
                            หมดอายุ: {formatThaiDate(nearestExpiry)}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>จำนวนที่ต้องการเบิก</label>
                  <span style={{ 
                    padding: '4px 10px',
                    background: 'rgba(255, 159, 10, 0.15)',
                    color: '#ff9f0a',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    คงเหลือ {selectedProduct.quantity} {selectedProduct.unit}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, parseInt(quantity || 1) - 1).toString())}
                    style={{
                      width: '36px',
                      height: '40px',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    max={selectedProduct.quantity}
                    placeholder="ระบุจำนวน"
                    required
                    style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedProduct.quantity, parseInt(quantity || 0) + 1).toString())}
                    style={{
                      width: '36px',
                      height: '40px',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>



              {selectedProduct.requireRoom && (
                <div className="form-group">
                  <label>ห้องผู้ป่วย (ถ้ามี)</label>
                  <input
                    type="text"
                    className="input"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="เช่น 101, 102, 103"
                  />
                </div>
              )}

              {selectedProduct.requirePatientType && (
                <div className="form-group">
                  <label>ประเภท</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 16px',
                      border: `2px solid ${patientType === 'ดึก' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: patientType === 'ดึก' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="patientType"
                        value="ดึก"
                        checked={patientType === 'ดึก'}
                        onChange={(e) => setPatientType(e.target.value)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>ดึก</span>
                    </label>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 16px',
                      border: `2px solid ${patientType === 'รับใหม่' ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: patientType === 'รับใหม่' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="patientType"
                        value="รับใหม่"
                        checked={patientType === 'รับใหม่'}
                        onChange={(e) => setPatientType(e.target.value)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>รับใหม่</span>
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '16px' }}>
                <Icon name="withdraw" size={20} color="white" />
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการเบิก'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block mt-2"
                onClick={() => {
                  setSelectedProduct(null)
                  setQuantity('')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                ยกเลิก
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
