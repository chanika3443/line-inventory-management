import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Transaction.css'

export default function Return() {
  useHeaderShrink()
  const { products, fetchProducts, returnProduct, loading } = useSheets()
  const { userName: liffUserName } = useLiff()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [userName, setLocalUserName] = useState(liffUserName || '')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (liffUserName) {
      setLocalUserName(liffUserName)
    }
  }, [liffUserName])

  // Filter only returnable products
  const returnableProducts = products.filter(p => p.returnable)
  
  const filteredProducts = returnableProducts.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleReturn = async (e) => {
    e.preventDefault()
    
    if (!selectedProduct || !quantity) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุและระบุจำนวน' })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้คืน' })
      return
    }

    const result = await returnProduct(selectedProduct.code, quantity, userName, note)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setSelectedProduct(null)
      setQuantity('')
      setNote('')
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
            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="ค้นหาวัสดุที่สามารถคืนได้..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>ไม่พบวัสดุที่สามารถคืนได้</p>
              </div>
            ) : (
              <div className="product-list">
                {filteredProducts.map((product) => (
                  <div
                    key={product.code}
                    className="product-item"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-code">{product.code}</div>
                    </div>
                    <div className="product-quantity">
                      {product.quantity} {product.unit}
                      <span className="badge badge-success ml-sm">คืนได้</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="card-title">รายละเอียดการคืน</div>
            <form onSubmit={handleReturn}>
              <div className="selected-product">
                <div className="product-name">{selectedProduct.name}</div>
                <div className="product-code">{selectedProduct.code}</div>
              </div>

              <div className="alert alert-info">
                คงเหลือปัจจุบัน: {selectedProduct.quantity} {selectedProduct.unit}
              </div>

              <div className="form-group">
                <label>จำนวนที่คืน</label>
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
                    placeholder="ระบุจำนวน"
                    required
                    style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((parseInt(quantity || 0) + 1).toString())}
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
                <label>หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น สภาพดี, ชำรุด, ฯลฯ"
                />
              </div>

              <div className="form-group">
                <label>ชื่อผู้คืน</label>
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
