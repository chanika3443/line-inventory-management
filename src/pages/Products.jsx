import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Products.css'

export default function Products() {
  useHeaderShrink()
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct, loading } = useSheets()
  const { userName } = useLiff()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    quantity: '',
    lowStockThreshold: '',
    category: '',
    returnable: false
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function handleAdd() {
    setEditingProduct(null)
    setFormData({
      name: '',
      unit: '',
      quantity: '',
      lowStockThreshold: '',
      category: '',
      returnable: false
    })
    setShowModal(true)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      unit: product.unit,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      category: product.category,
      returnable: product.returnable
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Convert empty strings to 0 for numeric fields
    const submitData = {
      ...formData,
      quantity: formData.quantity === '' ? 0 : parseInt(formData.quantity) || 0,
      lowStockThreshold: formData.lowStockThreshold === '' ? 0 : parseInt(formData.lowStockThreshold) || 0
    }

    let result
    if (editingProduct) {
      result = await updateProduct(editingProduct.code, submitData, userName)
    } else {
      result = await addProduct(submitData, userName)
    }

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setShowModal(false)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  async function handleDelete(product) {
    if (!confirm(`ต้องการลบ "${product.name}" ใช่หรือไม่?`)) {
      return
    }

    const result = await deleteProduct(product.code, userName)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  if (loading && products.length === 0) {
    return <Loading />
  }

  return (
    <div className="products-page">
      <div className="header">
        <h1>วัสดุ</h1>
        <p className="header-subtitle">จัดการรายการวัสดุทั้งหมด</p>
      </div>

      <div className="container" style={{ paddingTop: '16px' }}>
        <button 
          onClick={handleAdd} 
          className="btn btn-primary" 
          style={{ 
            fontSize: '14px', 
            padding: '12px 20px',
            width: '100%',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '700' }}>+</span>
          เพิ่มวัสดุ
        </button>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'} style={{ fontSize: '13px', padding: '10px', marginBottom: '10px' }}>
          {message.text}
        </div>
      )}

      <div className="input-group" style={{ marginBottom: '12px' }}>
        <input
          type="text"
          className="input"
          style={{ fontSize: '14px', padding: '10px 12px' }}
          placeholder="ค้นหาวัสดุ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.code} className="product-card card">
            <div className="product-header">
              <div>
                <div className="product-name" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{product.name}</div>
                <div className="product-code" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.code}</div>
              </div>
              <div className="product-actions">
                <button onClick={() => handleEdit(product)} className="btn-icon">
                  ✏️
                </button>
                <button onClick={() => handleDelete(product)} className="btn-icon">
                  🗑️
                </button>
              </div>
            </div>

            <div className="product-details">
              <div className="detail-row">
                <span>คงเหลือ:</span>
                <span className="detail-value" style={{ fontWeight: '600' }}>
                  {product.quantity} {product.unit}
                  {product.quantity <= product.lowStockThreshold && (
                    <span className="badge badge-warning ml-sm" style={{ fontSize: '11px', padding: '2px 8px' }}>ใกล้หมด</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span>เกณฑ์:</span>
                <span className="detail-value" style={{ fontWeight: '600' }}>{product.lowStockThreshold}</span>
              </div>
              {product.category && (
                <div className="detail-row">
                  <span>หมวดหมู่:</span>
                  <span className="detail-value">{product.category}</span>
                </div>
              )}
            </div>
            <div style={{ 
              marginTop: '10px', 
              padding: '8px 12px', 
              background: product.returnable ? 'rgba(81, 207, 102, 0.1)' : '#f0f0f0', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '12px',
              color: product.returnable ? '#51cf66' : '#999',
              opacity: product.returnable ? 1 : 0.7,
              fontWeight: product.returnable ? '600' : '400',
              border: product.returnable ? '1px solid #51cf66' : '1px solid #ddd'
            }}>
              {product.returnable ? '✓ คืนได้' : '✗ คืนไม่ได้'}
            </div>
          </div>
        ))}
      </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProduct ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุใหม่'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">ชื่อวัสดุ *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="เช่น ปากกา, กระดาษ A4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">หน่วย *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="เช่น ชิ้น, แพ็ค, กล่อง"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">จำนวน</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label className="input-label">เกณฑ์สต็อกต่ำ</label>
                <input
                  type="number"
                  className="input"
                  placeholder="เช่น 10"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label className="input-label">หมวดหมู่</label>
                <input
                  type="text"
                  className="input"
                  placeholder="เช่น เครื่องเขียน, อุปกรณ์สำนักงาน"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.returnable}
                    onChange={(e) => setFormData({ ...formData, returnable: e.target.checked })}
                  />
                  <span>สามารถคืนได้</span>
                </label>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
