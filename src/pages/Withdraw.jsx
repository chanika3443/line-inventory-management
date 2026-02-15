import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Transaction.css'

export default function Withdraw() {
  useHeaderShrink()
  const { products, fetchProducts, withdraw, loading } = useSheets()
  const { userName: liffUserName } = useLiff()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [roomNumber, setRoomNumber] = useState('')
  
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
    // Update local userName when LIFF userName changes
    if (liffUserName) {
      setLocalUserName(liffUserName)
    }
  }, [liffUserName])

  const filteredProducts = products.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleProductSelection = (product) => {
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
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุที่ต้องการเบิก' })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้เบิก' })
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
      setMessage({ type: 'success', text: `เบิกสำเร็จ ${successCount} รายการ` })
      setSelectedItems([])
      setIsMultiSelectMode(false)
      setSearchQuery('')
    } else {
      setMessage({ type: 'error', text: `เบิกสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ` })
    }
  }

  const cancelMultiSelect = () => {
    setSelectedItems([])
    setIsMultiSelectMode(false)
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    if (!selectedProduct || !quantity) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุและระบุจำนวน' })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้เบิก' })
      return
    }

    // Room number is optional now - no validation needed

    // Create note with room and/or patient type (if provided)
    let noteParts = []
    if (roomNumber.trim()) {
      noteParts.push(`ห้อง: ${roomNumber}`)
    }
    if (selectedProduct.requirePatientType) {
      noteParts.push(`ประเภท: ${patientType}`)
    }
    const note = noteParts.join(', ')
    
    const result = await withdraw(selectedProduct.code, quantity, userName, note)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setQuantity('')
      setRoomNumber('')
      setPatientType(getDefaultPatientType()) // Reset to default based on time
      setSearchQuery('')
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  if (loading && products.length === 0) {
    return <Loading />
  }

  return (
    <div className="transaction-page">
      <div className="header">
        <h1>เบิกวัสดุ</h1>
        <p className="header-subtitle">เบิกวัสดุออกจากคลัง</p>
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

            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="ค้นหาวัสดุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isMultiSelectMode && selectedItems.length > 0 && (
              <div className="alert" style={{ background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '16px' }}>
                เลือกแล้ว {selectedItems.length} รายการ
              </div>
            )}

            <div className="product-list">
              {filteredProducts.map((product) => {
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
                        onChange={() => {}} // Handled by parent onClick
                        style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0, pointerEvents: 'none' }}
                      />
                    )}
                    <div 
                      style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-code">{product.code}</div>
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
                bottom: '80px', 
                left: '0', 
                right: '0', 
                background: 'var(--bg-elevated)', 
                padding: '16px 20px',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                borderTop: '1px solid var(--border)',
                zIndex: 50,
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                      รายการที่เลือก ({selectedItems.length})
                    </div>
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
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      ชื่อผู้เบิก
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={userName}
                      onChange={(e) => setLocalUserName(e.target.value)}
                      placeholder={liffUserName ? "ดึงจาก LINE แล้ว" : "กรุณากรอกชื่อของคุณ"}
                      disabled={!!liffUserName}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
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
                <div className="product-code">{selectedProduct.code}</div>
              </div>

              <div className="alert alert-warning">
                คงเหลือ: {selectedProduct.quantity} {selectedProduct.unit}
              </div>

              <div className="form-group">
                <label>จำนวนที่ต้องการเบิก</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, parseInt(quantity || 1) - 1).toString())}
                    style={{
                      width: '40px',
                      height: '48px',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '20px',
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
                    style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedProduct.quantity, parseInt(quantity || 0) + 1).toString())}
                    style={{
                      width: '40px',
                      height: '48px',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '20px',
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
                <label>ชื่อผู้เบิก</label>
                <input
                  type="text"
                  className="input"
                  value={userName}
                  onChange={(e) => setLocalUserName(e.target.value)}
                  placeholder={liffUserName ? "ดึงจาก LINE แล้ว" : "กรุณากรอกชื่อของคุณ"}
                  disabled={!!liffUserName}
                  required
                />
                {!liffUserName && (
                  <small style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                    ไม่สามารถดึงชื่อจาก LINE ได้ กรุณากรอกชื่อ
                  </small>
                )}
              </div>

              {selectedProduct.requireRoom && (
                <div className="form-group">
                  <label>ห้องผู้ป่วย *</label>
                  <input
                    type="text"
                    className="input"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="เช่น 101, 102, 103"
                    required
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

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <Icon name="withdraw" size={20} color="white" />
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการเบิก'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block mt-2"
                onClick={() => {
                  setSelectedProduct(null)
                  setQuantity('')
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
