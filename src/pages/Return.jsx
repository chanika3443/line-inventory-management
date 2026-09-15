import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import { haptics } from '../utils/haptics'
import './Transaction.css'

export default function Return() {
  const { products, fetchProducts, returnProduct, loading } = useSheets()
  const { userName: liffUserName } = useLiff()
  

  
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [stockType, setStockType] = useState('main')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [message, setMessage] = useState(null)
  
  // Multi-select mode
  const [selectedItems, setSelectedItems] = useState([]) // [{ product, quantity, note }]
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isFooterExpanded, setIsFooterExpanded] = useState(false)

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
      setSelectedItems([...selectedItems, { product, quantity: 1, note: '' }])
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

  const handleMultiReturn = async () => {
    haptics.medium()
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุที่ต้องการคืน' })
      return
    }

    let successCount = 0
    let failCount = 0

    for (const item of selectedItems) {
      const result = await returnProduct(item.product.code, item.quantity, userName, item.note)
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (failCount === 0) {
      haptics.success()
      setMessage({ type: 'success', text: `คืนสำเร็จ ${successCount} รายการ` })
      setSelectedItems([])
      setIsMultiSelectMode(false)
    } else {
      haptics.error()
      setMessage({ type: 'error', text: `คืนสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ` })
    }
  }

  const cancelMultiSelect = () => {
    setSelectedItems([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReturn = async (e) => {
    e.preventDefault()
    haptics.medium()
    
    if (!selectedProduct || !quantity) {
      haptics.error()
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุและระบุจำนวน' })
      return
    }

    if (!userName.trim()) {
      haptics.error()
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้คืน' })
      return
    }

    const batch = selectedBatch || (selectedProduct.batches && selectedProduct.batches[0]) || {}
    const result = await returnProduct(
      selectedProduct.materialCode || selectedProduct.code,
      quantity,
      userName,
      note,
      stockType,
      batch.batch || '',
      batch.sheetRow || null
    )
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setSelectedBatch(null)
      setStockType('main')
      setQuantity('1')
      setNote('')
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>คืนวัสดุ</h1>
          <p className="header-subtitle">คืนวัสดุเข้าคลัง</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  const [searchQuery, setSearchQuery] = useState('')

  // In the real sheet, all active materials can be returned
  const returnableProducts = products.filter(p => {
    if (p.returnable === false) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q))
    )
  })

  if (loading && products.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>คืนวัสดุ</h1>
          <p className="header-subtitle">คืนวัสดุเข้าคลัง</p>
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
        <h1>คืนวัสดุ</h1>
        <p className="header-subtitle">คืนวัสดุเข้าคลัง</p>
      </div>

      <div className="container">
        {message && (
          <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-danger'}>
            {message.text}
          </div>
        )}

        {!selectedProduct ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => {
                  setIsMultiSelectMode(false)
                  setSelectedItems([])
                }}
                className={`btn ${!isMultiSelectMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
              >
                คืนรายการเดียว
              </button>
              <button
                onClick={() => setIsMultiSelectMode(true)}
                className={`btn ${isMultiSelectMode ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '14px', padding: '10px 16px' }}
              >
                คืนหลายรายการ
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 ค้นหารหัส หรือ ชื่อวัสดุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d1d6',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: 'white'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#86868b',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {returnableProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>{searchQuery ? `ไม่พบวัสดุที่ตรงกับ "${searchQuery}"` : 'ไม่พบวัสดุที่สามารถคืนได้'}</p>
              </div>
            ) : (
              <div className="product-list">
                {returnableProducts.map((product) => {
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
                          <span className="badge badge-success ml-sm">คืนได้</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
                        background: '#ff9f0a',
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
                      color: '#ff9f0a',
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
                      onClick={handleMultiReturn} 
                      className="btn btn-warning" 
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      <Icon name="return" size={20} color="white" />
                      {loading ? 'กำลังบันทึก...' : `คืน ${selectedItems.length} รายการ`}
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
            <div className="card-title">รายละเอียดการคืน</div>
            <form onSubmit={handleReturn}>
              <div className="selected-product">
                <div className="product-name">{selectedProduct.name}</div>
              </div>

              {/* Batch selection if multiple batches exist */}
              {selectedProduct.batches && selectedProduct.batches.length > 1 && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>เลือก Batch / วันหมดอายุ</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {selectedProduct.batches.map((batch, idx) => (
                      <label key={batch.sheetRow || idx} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        border: `2px solid ${(selectedBatch?.sheetRow === batch.sheetRow || (!selectedBatch && idx === 0)) ? 'var(--accent, #ff9500)' : 'var(--border, #e5e5e7)'}`,
                        borderRadius: '10px',
                        background: (selectedBatch?.sheetRow === batch.sheetRow || (!selectedBatch && idx === 0)) ? 'rgba(255,149,0,0.08)' : 'var(--bg-secondary, #f5f5f7)',
                        cursor: 'pointer'
                      }}>
                        <input type="radio" name="batchSelect"
                          checked={selectedBatch ? selectedBatch.sheetRow === batch.sheetRow : idx === 0}
                          onChange={() => setSelectedBatch(batch)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>
                            Batch: {batch.batch || 'N/A'} · Plant: {batch.plant}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                            ใหญ่: {batch.mainStock?.remaining || 0} · เล็ก: {batch.subStock?.remaining || 0}
                            {batch.mainStockExpiry && ` · Exp: ${batch.mainStockExpiry}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock type selection */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>คืนเข้าสู่</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px',
                    border: `2px solid ${stockType === 'main' ? '#ff9500' : 'var(--border, #e5e5e7)'}`,
                    borderRadius: '10px',
                    background: stockType === 'main' ? 'rgba(255,149,0,0.08)' : 'var(--bg-secondary, #f5f5f7)',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" name="stockType" value="main"
                      checked={stockType === 'main'} onChange={(e) => setStockType(e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>สต๊อกใหญ่</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                        คงเหลือ: {(selectedBatch || selectedProduct.batches?.[0])?.mainStock?.remaining ?? selectedProduct.totalMainRemaining ?? 0}
                      </div>
                    </div>
                  </label>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px',
                    border: `2px solid ${stockType === 'sub' ? '#ff9500' : 'var(--border, #e5e5e7)'}`,
                    borderRadius: '10px',
                    background: stockType === 'sub' ? 'rgba(255,149,0,0.08)' : 'var(--bg-secondary, #f5f5f7)',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" name="stockType" value="sub"
                      checked={stockType === 'sub'} onChange={(e) => setStockType(e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>สต๊อกเล็ก</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #86868b)' }}>
                        คงเหลือ: {(selectedBatch || selectedProduct.batches?.[0])?.subStock?.remaining ?? selectedProduct.totalSubRemaining ?? 0}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>จำนวนที่คืน</label>
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





              <button type="submit" className="btn btn-warning btn-block" disabled={loading} style={{ marginTop: '16px' }}>
                <Icon name="return" size={20} color="white" />
                {loading ? 'กำลังบันทึก...' : 'ยืนยันคืนวัสดุ'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block mt-2"
                onClick={() => {
                  setSelectedProduct(null)
                  setSelectedBatch(null)
                  setStockType('main')
                  setQuantity('')
                  setNote('')
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
