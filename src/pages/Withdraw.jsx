import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import { haptics } from '../utils/haptics'
import { ERROR_MESSAGES } from '../utils/errorMessages'
import { getNearestExpiryDate, getExpiryStatus } from '../utils/expiryDate'
import { getTabShortLabel } from '../utils/sheetHelpers'
import './Transaction.css'

export default function Withdraw() {
  const {
    mergedMaterials,
    fetchMaterials,
    withdraw,
    loading,
    currentTab,
    availableTabs,
    switchTab,
    fetchTabs
  } = useSheets()
  const { userName: liffUserName } = useLiff()
  
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null) // selected batch entry
  const [stockType, setStockType] = useState('main') // 'main' or 'sub'
  const [quantity, setQuantity] = useState('1')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [roomNumber, setRoomNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
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
    fetchTabs()
    fetchMaterials()
  }, [fetchTabs, fetchMaterials])

  // Refresh materials when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMaterials()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchMaterials])

  useEffect(() => {
    // Update local userName when LIFF userName changes
    if (liffUserName) {
      setLocalUserName(liffUserName)
    }
  }, [liffUserName])

  const toggleProductSelection = (product) => {
    haptics.selection()
    const isSelected = selectedItems.some(item => item.product.materialCode === product.materialCode)
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item.product.materialCode !== product.materialCode))
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1, stockType: 'main', batch: product.batches[0] }])
    }
    setIsMultiSelectMode(true)
  }

  const updateItemQuantity = (materialCode, newQuantity) => {
    setSelectedItems(selectedItems.map(item => 
      item.product.materialCode === materialCode 
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
      const batch = item.batch || item.product.batches[0]
      const result = await withdraw(
        item.product.materialCode, item.quantity, userName, '',
        item.stockType || 'main', batch.batch || '', batch.sheetRow || null
      )
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

    // Check stock availability
    const batch = selectedBatch || selectedProduct.batches[0]
    if (!batch) {
      haptics.error()
      setMessage({ type: 'error', text: 'ไม่พบข้อมูลวัสดุ กรุณารีเฟรชหน้าใหม่' })
      return
    }

    const available = stockType === 'sub' ? batch.subStock.remaining : batch.mainStock.remaining
    if (available < parseInt(quantity)) {
      haptics.error()
      setMessage({ 
        type: 'error', 
        text: `สต็อกไม่เพียงพอ (เหลือ ${available} ${batch.unit || selectedProduct.unit})` 
      })
      return
    }

    // Create note with room and/or patient type (if provided)
    let noteParts = []
    if (roomNumber.trim()) {
      noteParts.push(`ห้อง: ${roomNumber}`)
    }
    if (patientType) {
      noteParts.push(`ประเภท: ${patientType}`)
    }
    const note = noteParts.join(', ')
    
    setIsSubmitting(true)
    const result = await withdraw(
      selectedProduct.materialCode, quantity, userName, note,
      stockType, batch.batch || '', batch.sheetRow || null,
      roomNumber.trim(), patientType
    )
    setIsSubmitting(false)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      
      setSelectedProduct(null)
      setSelectedBatch(null)
      setStockType('main')
      setQuantity('1')
      setRoomNumber('')
      setPatientType(getDefaultPatientType())
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
  }

  const filteredMaterials = mergedMaterials.filter(material => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      (material.materialCode && material.materialCode.toLowerCase().includes(q)) ||
      (material.description && material.description.toLowerCase().includes(q))
    )
  })

  if (loading && mergedMaterials.length === 0) {
    return (
      <div className="transaction-page">
        <div className="header">
          <h1>เบิกวัสดุ</h1>
          <p className="header-subtitle">เบิกวัสดุออกจากคลัง</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={6} />
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
            {/* Tab / Month Selector */}
            {availableTabs.length > 0 && (
              <div style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '10px 14px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                border: '1px solid #f0f0f2'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary, #86868b)', fontWeight: '600' }}>
                  📅 รอบเดือนสต็อก:
                </span>
                <select
                  value={currentTab}
                  onChange={(e) => switchTab(e.target.value)}
                  style={{
                    border: '1px solid #d1d1d6',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#007aff',
                    background: '#f9f9fb',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {availableTabs.map(tab => (
                    <option key={tab.title} value={tab.title}>
                      {getTabShortLabel(tab.title)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode selection buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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

            {filteredMaterials.length === 0 ? (
              <div className="card text-center" style={{ padding: '36px 16px', textAlign: 'center', background: 'white', borderRadius: '16px' }}>
                <p style={{ fontSize: '36px', margin: '0 0 10px 0' }}>📦</p>
                <p style={{ color: '#1d1d1f', fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
                  {searchQuery ? `ไม่พบวัสดุที่ค้นหา "${searchQuery}"` : 'ไม่พบรายการวัสดุในรอบเดือนนี้'}
                </p>
                <p style={{ color: '#86868b', fontSize: '13px', marginBottom: '16px' }}>
                  {searchQuery ? 'ลองพิมพ์คำค้นหาอื่น เช่น กรรไกร หรือรหัสวัสดุ' : 'ลองเลือกเดือนอื่น หรือกดปุ่มรีเฟรช'}
                </p>
                <button
                  onClick={() => fetchMaterials()}
                  className="btn btn-outline"
                  style={{ display: 'inline-block', fontSize: '13px', padding: '8px 16px' }}
                >
                  🔄 รีเฟรชข้อมูล
                </button>
              </div>
            ) : (
              <div className="product-list">
                {filteredMaterials.map((material) => {
                const isSelected = selectedItems.some(item => item.product.materialCode === material.materialCode)
                const totalStock = material.totalMainRemaining + material.totalSubRemaining
                
                return (
                  <div
                    key={material.materialCode}
                    className={`product-item ${isSelected ? 'selected' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => {
                      if (isMultiSelectMode) {
                        toggleProductSelection(material)
                      } else {
                        setSelectedProduct(material)
                        setSelectedBatch(material.batches[0])
                        setStockType('main')
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
                    <div 
                      style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div className="product-info">
                        <div className="product-name">{material.description}</div>
                        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>
                          {material.materialCode}
                          {material.batches.length > 1 && ` · ${material.batches.length} batches`}
                        </div>
                        {material.mainStockExpiry && (
                          <div style={{ fontSize: '11px', color: '#ff9500', marginTop: '2px' }}>
                            📅 {material.mainStockExpiry}
                          </div>
                        )}
                      </div>
                      <div className="product-quantity" style={{ textAlign: 'right' }}>
                        <div>ใหญ่: {material.totalMainRemaining}</div>
                        <div style={{ fontSize: '11px', color: '#86868b' }}>เล็ก: {material.totalSubRemaining}</div>
                        {totalStock <= 0 && (
                          <span className="badge badge-warning ml-sm" style={{ background: '#ffebee', color: '#ff3b30' }}>หมด</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            )}

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
                      <div key={item.product.materialCode || item.product.code} style={{ 
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
                            {item.product.description || item.product.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            คงเหลือ: {item.product.totalMainRemaining ?? item.product.quantity} {item.product.unit}
                          </div>
                          {expiryStatus && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: expiryStatus.color,
                              fontWeight: '600',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>📅</span>
                              <span>{expiryStatus.text}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newQty = Math.max(1, item.quantity - 1)
                              updateItemQuantity(item.product.materialCode || item.product.code, newQty)
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
                            onChange={(e) => updateItemQuantity(item.product.materialCode || item.product.code, e.target.value)}
                            min="1"
                            max={item.product.totalMainRemaining ?? item.product.quantity}
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
                              const max = item.product.totalMainRemaining ?? item.product.quantity
                              const newQty = Math.min(max, item.quantity + 1)
                              updateItemQuantity(item.product.materialCode || item.product.code, newQty)
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
                <div className="product-name">{selectedProduct.description}</div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
                  รหัส: {selectedProduct.materialCode} · หน่วย: {selectedProduct.unit}
                </div>
              </div>

              {/* Batch selection (if multiple batches) */}
              {selectedProduct.batches.length > 1 && (
                <div className="form-group">
                  <label>เลือก Batch</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {selectedProduct.batches.map((batch, idx) => (
                      <label
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          border: `2px solid ${selectedBatch === batch ? '#007aff' : '#e5e5e7'}`,
                          borderRadius: '10px',
                          background: selectedBatch === batch ? 'rgba(0,122,255,0.05)' : '#f5f5f7',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="radio"
                          name="batch"
                          checked={selectedBatch === batch}
                          onChange={() => setSelectedBatch(batch)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>
                            Batch: {batch.batch || 'N/A'} · Plant: {batch.plant}
                          </div>
                          <div style={{ fontSize: '12px', color: '#86868b' }}>
                            ใหญ่: {batch.mainStock.remaining} · เล็ก: {batch.subStock.remaining}
                            {batch.mainStockExpiry && ` · Exp: ${batch.mainStockExpiry}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock type selection */}
              <div className="form-group">
                <label>เบิกจาก</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px',
                    border: `2px solid ${stockType === 'main' ? '#007aff' : '#e5e5e7'}`,
                    borderRadius: '10px',
                    background: stockType === 'main' ? 'rgba(0,122,255,0.05)' : '#f5f5f7',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" name="stockType" value="main"
                      checked={stockType === 'main'} onChange={(e) => setStockType(e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>สต๊อกใหญ่</div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>
                        คงเหลือ: {(selectedBatch || selectedProduct.batches[0])?.mainStock.remaining || 0}
                      </div>
                    </div>
                  </label>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px',
                    border: `2px solid ${stockType === 'sub' ? '#007aff' : '#e5e5e7'}`,
                    borderRadius: '10px',
                    background: stockType === 'sub' ? 'rgba(0,122,255,0.05)' : '#f5f5f7',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" name="stockType" value="sub"
                      checked={stockType === 'sub'} onChange={(e) => setStockType(e.target.value)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>สต๊อกเล็ก</div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>
                        คงเหลือ: {(selectedBatch || selectedProduct.batches[0])?.subStock.remaining || 0}
                      </div>
                    </div>
                  </label>
                </div>
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
                    คงเหลือ {stockType === 'sub' 
                      ? (selectedBatch || selectedProduct.batches[0])?.subStock.remaining 
                      : (selectedBatch || selectedProduct.batches[0])?.mainStock.remaining
                    } {selectedProduct.unit}
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
                    max={stockType === 'sub' ? (selectedBatch || selectedProduct.batches[0])?.subStock.remaining : (selectedBatch || selectedProduct.batches[0])?.mainStock.remaining}
                    placeholder="ระบุจำนวน"
                    required
                    style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const max = stockType === 'sub' ? (selectedBatch || selectedProduct.batches[0])?.subStock.remaining : (selectedBatch || selectedProduct.batches[0])?.mainStock.remaining
                      setQuantity(Math.min(max || 999, parseInt(quantity || 0) + 1).toString())
                    }}
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
                <label>ห้องผู้ป่วย (ถ้ามี)</label>
                <input
                  type="text"
                  className="input"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="เช่น 101, 102, 103"
                />
              </div>

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
