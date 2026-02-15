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
  const { userName: liffUserName, setUserName } = useLiff()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [message, setMessage] = useState(null)
  
  // Multi-select mode
  const [selectedItems, setSelectedItems] = useState([]) // [{ product, quantity }]
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)

  useEffect(() => {
    fetchProducts()
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

    const result = await withdraw(selectedProduct.code, quantity, userName)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setQuantity('')
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
                zIndex: 50
              }}>
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
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
                <input
                  type="number"
                  className="input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedProduct.quantity}
                  placeholder="ระบุจำนวน"
                  required
                />
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
