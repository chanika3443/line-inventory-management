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
            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="ค้นหาวัสดุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
                    {product.quantity <= product.lowStockThreshold && (
                      <span className="badge badge-warning ml-sm">ใกล้หมด</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
