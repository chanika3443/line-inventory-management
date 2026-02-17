import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import * as sheetsService from '../services/sheetsService'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import { haptics } from '../utils/haptics'
import './Transaction.css'

export default function Receive() {
  const { products, fetchProducts, receive, loading } = useSheets()
  const { userName: liffUserName, loginMode } = useLiff()
  

  
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [message, setMessage] = useState(null)
  
  // Multi-select mode
  const [selectedItems, setSelectedItems] = useState([]) // [{ product, quantity }]
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isFooterExpanded, setIsFooterExpanded] = useState(false)
  
  // Auth
  const [allowedUsers, setAllowedUsers] = useState([])
  const [checkingAccess, setCheckingAccess] = useState(true)

  // Fetch allowed users from Google Sheets
  useEffect(() => {
    async function loadAllowedUsers() {
      setCheckingAccess(true)
      const users = await sheetsService.getAllowedUsers()
      setAllowedUsers(users)
      setCheckingAccess(false)
    }
    loadAllowedUsers()
  }, [])

  // Check access: must login with LINE AND (name must be in allowed list OR "ALL" is in the list)
  const isLineLogin = loginMode === 'line'
  const hasAccess = isLineLogin && (allowedUsers.includes(liffUserName) || allowedUsers.includes('ALL'))

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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

  const handleMultiReceive = async () => {
    haptics.medium()
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุที่ต้องการรับเข้า' })
      return
    }

    let successCount = 0
    let failCount = 0

    for (const item of selectedItems) {
      const result = await receive(item.product.code, item.quantity, userName)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (failCount === 0) {
      haptics.success()
      setMessage({ type: 'success', text: `รับเข้าสำเร็จ ${successCount} รายการ` })
      setSelectedItems([])
      setIsMultiSelectMode(false)
    } else {
      haptics.error()
      setMessage({ type: 'error', text: `รับเข้าสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ` })
    }
  }

  const cancelMultiSelect = () => {
    setSelectedItems([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReceive = async (e) => {
    e.preventDefault()
    haptics.medium()
    
    if (!selectedProduct || !quantity) {
      haptics.error()
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุและระบุจำนวน' })
      return
    }

    if (!userName.trim()) {
      haptics.error()
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้รับเข้า' })
      return
    }

    const result = await receive(selectedProduct.code, quantity, userName)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setQuantity('')
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>รับเข้าวัสดุ</h1>
          <p className="header-subtitle">รับวัสดุเข้าคลัง</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  // Show checking access state
  if (checkingAccess) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>รับเข้าวัสดุ</h1>
          <p className="header-subtitle">รับวัสดุเข้าคลัง</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={3} />
        </div>
      </div>
    )
  }

  // Show access denied if user is not authorized
  if (!hasAccess) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>รับเข้าวัสดุ</h1>
          <p className="header-subtitle">รับวัสดุเข้าคลัง</p>
        </div>

        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', marginTop: '20px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'shake 0.5s ease-in-out' }}>🔒</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--danger)' }}>
              ไม่มีสิทธิ์เข้าถึง
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              {!isLineLogin ? (
                <>
                  หน้านี้ต้อง Login with LINE เท่านั้น
                  <br />
                  กรุณา Logout และ Login ด้วย LINE อีกครั้ง
                </>
              ) : (
                <>
                  คุณไม่มีสิทธิ์ในการรับเข้าวัสดุ
                  <br />
                  กรุณาติดต่อผู้ดูแลระบบ
                </>
              )}
            </p>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                ผู้ใช้: {liffUserName}
              </p>
              <p style={{ marginTop: '4px', fontSize: '13px', color: '#86868b' }}>
                Login Mode: {isLineLogin ? 'LINE' : 'Manual'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && products.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>รับเข้าวัสดุ</h1>
          <p className="header-subtitle">รับวัสดุเข้าคลัง</p>
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
        <h1>รับเข้าวัสดุ</h1>
        <p className="header-subtitle">รับวัสดุเข้าคลัง</p>
      </div>

      <div className="container">
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
                รับเข้ารายการเดียว
              </button>
              <button
                onClick={() => setIsMultiSelectMode(true)}
                className={`btn ${isMultiSelectMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
              >
                รับเข้าหลายรายการ
              </button>
            </div>

            <div className="product-list">
              {products.map((product) => {
                const isSelected = selectedItems.some(item => item.product.code === product.code)
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
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0, pointerEvents: 'none' }}
                      />
                    )}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                      </div>
                      <div className="product-quantity">
                        {product.quantity} {product.unit}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {isMultiSelectMode && selectedItems.length > 0 && (
              <div style={{ 
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
                        background: '#30d158',
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
                      color: '#30d158',
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
                    <div style={{ marginBottom: '16px' }}>
                      {selectedItems.map((item) => (
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
                                const newQty = item.quantity + 1
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
                      ))}
                    </div>
                  )}

                  {/* Buttons - Always visible */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: isFooterExpanded ? '0' : '12px' }}>
                    <button 
                      onClick={handleMultiReceive} 
                      className="btn btn-success" 
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      <Icon name="receive" size={20} color="white" />
                      {loading ? 'กำลังบันทึก...' : `รับเข้า ${selectedItems.length} รายการ`}
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
            <div className="card-title">รายละเอียดการรับเข้า</div>
            <form onSubmit={handleReceive}>
              <div className="selected-product">
                <div className="product-name">{selectedProduct.name}</div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>จำนวนที่รับเข้า</label>
                  <span style={{ 
                    padding: '4px 10px',
                    background: 'rgba(0, 122, 255, 0.15)',
                    color: '#007aff',
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
                    placeholder="ระบุจำนวน"
                    required
                    style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((parseInt(quantity || 0) + 1).toString())}
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



              <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                <Icon name="receive" size={20} color="white" />
                {loading ? 'กำลังบันทึก...' : 'ยืนยันรับเข้า'}
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
