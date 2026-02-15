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
  const [cart, setCart] = useState([]) // Cart for multiple items
  const [showCart, setShowCart] = useState(false)
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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.code === product.code)
    if (existingItem) {
      setMessage({ type: 'error', text: 'รายการนี้อยู่ในตะกร้าแล้ว' })
      return
    }
    setCart([...cart, { ...product, withdrawQuantity: 1 }])
    setMessage({ type: 'success', text: `เพิ่ม ${product.name} ลงตะกร้าแล้ว` })
  }

  const removeFromCart = (code) => {
    setCart(cart.filter(item => item.code !== code))
  }

  const updateCartQuantity = (code, quantity) => {
    setCart(cart.map(item => 
      item.code === code ? { ...item, withdrawQuantity: parseInt(quantity) || 1 } : item
    ))
  }

  const handleWithdrawAll = async (e) => {
    e.preventDefault()
    
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวัสดุที่ต้องการเบิก' })
      return
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้เบิก' })
      return
    }

    // Validate quantities
    for (const item of cart) {
      if (item.withdrawQuantity > item.quantity) {
        setMessage({ type: 'error', text: `${item.name} มีไม่เพียงพอ (คงเหลือ ${item.quantity})` })
        return
      }
    }

    // Withdraw all items
    let successCount = 0
    let failedItems = []

    for (const item of cart) {
      const result = await withdraw(item.code, item.withdrawQuantity, userName)
      if (result.success) {
        successCount++
      } else {
        failedItems.push(item.name)
      }
    }

    if (successCount === cart.length) {
      setMessage({ type: 'success', text: `เบิกสำเร็จ ${successCount} รายการ` })
      setCart([])
      setShowCart(false)
      setSearchQuery('')
    } else if (successCount > 0) {
      setMessage({ type: 'error', text: `เบิกสำเร็จ ${successCount} รายการ, ล้มเหลว: ${failedItems.join(', ')}` })
    } else {
      setMessage({ type: 'error', text: 'เบิกล้มเหลวทั้งหมด' })
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

        {/* Cart Button */}
        {cart.length > 0 && (
          <div style={{ position: 'fixed', bottom: '90px', right: '20px', zIndex: 1000 }}>
            <button
              onClick={() => setShowCart(true)}
              className="btn btn-primary"
              style={{ 
                borderRadius: '50%', 
                width: '60px', 
                height: '60px', 
                padding: '0',
                boxShadow: '0 4px 12px rgba(0,122,255,0.4)',
                position: 'relative'
              }}
            >
              🛒
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {cart.length}
              </span>
            </button>
          </div>
        )}

        {!showCart ? (
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
                  onClick={() => addToCart(product)}
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
                    {cart.find(item => item.code === product.code) && (
                      <span className="badge badge-success ml-sm">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
        ) : (
          <div className="card">
            <div className="card-title">ตะกร้าเบิกวัสดุ ({cart.length} รายการ)</div>
            <form onSubmit={handleWithdrawAll}>
              {cart.length === 0 ? (
                <div className="empty-state">
                  <p>ไม่มีรายการในตะกร้า</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.code} style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{item.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.code} • คงเหลือ: {item.quantity} {item.unit}
                        </div>
                      </div>
                      <input
                        type="number"
                        className="input"
                        value={item.withdrawQuantity}
                        onChange={(e) => updateCartQuantity(item.code, e.target.value)}
                        min="1"
                        max={item.quantity}
                        style={{ width: '80px', padding: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.code)}
                        style={{
                          background: 'var(--danger-light)',
                          color: 'var(--danger)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}

                  <div className="form-group" style={{ marginTop: '16px' }}>
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
                    {loading ? 'กำลังบันทึก...' : `ยืนยันเบิก ${cart.length} รายการ`}
                  </button>
                </>
              )}
              
              <button
                type="button"
                className="btn btn-outline btn-block mt-2"
                onClick={() => setShowCart(false)}
              >
                กลับไปเลือกวัสดุ
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
