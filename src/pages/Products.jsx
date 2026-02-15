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
    quantity: 0,
    lowStockThreshold: 0,
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
      quantity: 0,
      lowStockThreshold: 0,
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

    let result
    if (editingProduct) {
      result = await updateProduct(editingProduct.code, formData, userName)
    } else {
      result = await addProduct(formData, userName)
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

      <div className="container" style={{ paddingTop: 0 }}>
        <div className="page-header">
        <button onClick={handleAdd} className="btn btn-primary">
          + เพิ่มวัสดุ
        </button>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="input-group">
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
          <div key={product.code} className="product-card card">
            <div className="product-header">
              <div>
                <div className="product-name">{product.name}</div>
                <div className="product-code">{product.code}</div>
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
                <span className="detail-value">
                  {product.quantity} {product.unit}
                  {product.quantity <= product.lowStockThreshold && (
                    <span className="badge badge-warning ml-sm">ใกล้หมด</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span>เกณฑ์:</span>
                <span className="detail-value">{product.lowStockThreshold}</span>
              </div>
              {product.category && (
                <div className="detail-row">
                  <span>หมวดหมู่:</span>
                  <span className="detail-value">{product.category}</span>
                </div>
              )}
              <div className="detail-row">
                <span>คืนได้:</span>
                <span className="detail-value">
                  {product.returnable ? (
                    <span className="badge badge-success">ใช่</span>
                  ) : (
                    <span className="badge badge-secondary">ไม่ได้</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
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
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label className="input-label">เกณฑ์สต็อกต่ำ</label>
                <input
                  type="number"
                  className="input"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="input-group">
                <label className="input-label">หมวดหมู่</label>
                <input
                  type="text"
                  className="input"
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
    </div>
  )
}
