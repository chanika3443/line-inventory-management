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
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [message, setMessage] = useState(null)
  
  // Multi-select mode
  const [selectedItems, setSelectedItems] = useState([]) // [{ product, quantity, note }]
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)

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

  // Filter only returnable products
  const returnableProducts = products.filter(p => p.returnable)

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

    const result = await returnProduct(selectedProduct.code, quantity, userName, note)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setQuantity('')
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
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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

            {returnableProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>ไม่พบวัสดุที่สามารถคืนได้</p>
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
                padding: '12px 16px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
                borderTop: '1px solid #e5e5e7',
                zIndex: 50
              }}>
                <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, fontSize: '14px', fontWeight: '600' }}>
                    เลือกแล้ว {selectedItems.length} รายการ
                  </div>
                  <button 
                    onClick={handleMultiReturn} 
                    className="btn btn-warning" 
                    style={{ minWidth: '120px' }}
                    disabled={loading}
                  >
                    <Icon name="return" size={20} color="white" />
                    {loading ? 'กำลังบันทึก...' : `คืน ${selectedItems.length} รายการ`}
                  </button>
                  <button 
                    onClick={cancelMultiSelect} 
                    className="btn btn-secondary"
                    style={{ minWidth: '70px' }}
                  >
                    ยกเลิก
                  </button>
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

              <div className="form-group">
                <label>หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น สภาพดี, ชำรุด, ฯลฯ"
                />
              </div>



              <button type="submit" className="btn btn-warning btn-block" disabled={loading}>
                <Icon name="return" size={20} color="white" />
                {loading ? 'กำลังบันทึก...' : 'ยืนยันคืนวัสดุ'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block mt-2"
                onClick={() => {
                  setSelectedProduct(null)
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
