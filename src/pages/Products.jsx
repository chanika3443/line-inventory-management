import { useState, useEffect } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { useLiff } from '../contexts/LiffContext'
import * as sheetsService from '../services/sheetsService'
import SkeletonLoader from '../components/SkeletonLoader'
import ConfirmDialog from '../components/ConfirmDialog'
import { haptics } from '../utils/haptics'
import { getExpiryStatus, getNearestExpiryDate, formatThaiDate } from '../utils/expiryDate'
import './Products.css'

export default function Products() {
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct, loading } = useSheets()
  const { userName, loginMode } = useLiff()
  

  
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    quantity: '',
    lowStockThreshold: '',
    category: '',
    returnable: false,
    requireRoom: false,
    requirePatientType: false,
    expiryDates: []
  })
  const [message, setMessage] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, product: null, input: '' })
  const [allowedUsers, setAllowedUsers] = useState([])
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch allowed users from Google Sheets
  useEffect(() => {
    async function loadAllowedUsers() {
      setCheckingAccess(true)
      const users = await sheetsService.getAllowedUsers()
      setAllowedUsers(users)
      setCheckingAccess(false)
    }
    loadAllowedUsers()
  }, [])

  // Check access: must login with LINE AND (name must be in allowed list OR "ALL" is in the list)
  const isLineLogin = loginMode === 'line'
  const hasAccess = isLineLogin && (allowedUsers.includes(userName) || allowedUsers.includes('ALL'))

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
      returnable: false,
      requireRoom: false,
      requirePatientType: false,
      expiryDates: []
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
      returnable: product.returnable,
      requireRoom: product.requireRoom || false,
      requirePatientType: product.requirePatientType || false,
      expiryDates: product.expiryDates || []
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    haptics.medium()
    setSubmitting(true)

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

    setSubmitting(false)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
      setShowModal(false)
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
  }

  async function handleDelete(product) {
    haptics.light()
    setDeleteConfirm({ show: true, product, input: '' })
  }

  async function confirmDelete() {
    if (deleteConfirm.input !== 'delete') {
      haptics.error()
      setMessage({ type: 'error', text: 'กรุณาพิมพ์ "delete" เพื่อยืนยัน' })
      return
    }

    haptics.medium()
    setSubmitting(true)
    const result = await deleteProduct(deleteConfirm.product.code, userName)
    setSubmitting(false)
    
    if (result.success) {
      haptics.success()
      setMessage({ type: 'success', text: result.message })
    } else {
      haptics.error()
      setMessage({ type: 'error', text: result.message })
    }
    
    setDeleteConfirm({ show: false, product: null, input: '' })
  }

  if (loading && products.length === 0) {
    return (
      <div className="products-page">
        <div className="header">
          <h1>วัสดุ</h1>
          <p className="header-subtitle">จัดการรายการวัสดุทั้งหมด</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="products-page">
        <div className="header">
          <h1>จัดการวัสดุ</h1>
          <p className="header-subtitle">เพิ่ม แก้ไข ลบวัสดุ</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  // Show access denied if user is not authorized
  if (!hasAccess) {
    return (
      <div className="products-page">
        <div className="header">
          <h1>จัดการวัสดุ</h1>
          <p className="header-subtitle">เพิ่ม แก้ไข ลบวัสดุ</p>
        </div>

        <div className="container">
          <div className="access-denied-card">
            <div className="access-denied-icon">🔒</div>
            <h2 className="access-denied-title">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="access-denied-message">
              {!isLineLogin ? (
                <>
                  หน้านี้ต้อง Login with LINE เท่านั้น
                  <br />
                  กรุณา Logout และ Login ด้วย LINE อีกครั้ง
                </>
              ) : (
                <>
                  คุณไม่มีสิทธิ์ในการจัดการวัสดุ
                  <br />
                  กรุณาติดต่อผู้ดูแลระบบ
                </>
              )}
            </p>
            <div className="access-denied-info">
              <p className="access-denied-user">ผู้ใช้: {userName}</p>
              <p className="access-denied-user" style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
                Login mode: {isLineLogin ? 'LINE' : 'ชื่อเล่น'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="products-page">
      <div className="header">
        <h1>วัสดุ</h1>
        <p className="header-subtitle">จัดการรายการวัสดุทั้งหมด</p>
      </div>

      <div className="container">
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
          placeholder="ค้นหาวัสดุ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="product-list">
        {filteredProducts.map((product) => {
          const nearestExpiry = getNearestExpiryDate(product.expiryDates)
          const expiryStatus = nearestExpiry ? getExpiryStatus(nearestExpiry) : null
          
          return (
          <div key={product.code} className="product-card card">
            <div className="product-header">
              <div>
                <div className="product-name" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{product.name}</div>
                <div className="product-code" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.code}</div>
                {expiryStatus && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: expiryStatus.color,
                    fontWeight: '600',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>📅</span>
                    <span>{expiryStatus.text}</span>
                  </div>
                )}
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
        )
        })}
      </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}>
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

              <div className="input-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requireRoom}
                    onChange={(e) => setFormData({ ...formData, requireRoom: e.target.checked })}
                  />
                  <span>ต้องระบุห้องผู้ป่วยเมื่อเบิก</span>
                </label>
              </div>

              <div className="input-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requirePatientType}
                    onChange={(e) => setFormData({ ...formData, requirePatientType: e.target.checked })}
                  />
                  <span>ต้องระบุประเภทผู้ป่วยเมื่อเบิก</span>
                </label>
              </div>

              <div className="input-group">
                <label className="input-label">วันหมดอายุ</label>
                <div style={{ marginBottom: '8px' }}>
                  {formData.expiryDates && formData.expiryDates.map((date, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '8px',
                      alignItems: 'center'
                    }}>
                      <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={(e) => {
                          const newDates = [...formData.expiryDates]
                          newDates[index] = e.target.value
                          setFormData({ ...formData, expiryDates: newDates })
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newDates = formData.expiryDates.filter((_, i) => i !== index)
                          setFormData({ ...formData, expiryDates: newDates })
                        }}
                        style={{
                          padding: '8px 12px',
                          background: '#ff3b30',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ 
                      ...formData, 
                      expiryDates: [...(formData.expiryDates || []), ''] 
                    })
                  }}
                  style={{
                    padding: '10px 16px',
                    background: '#007aff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    fontWeight: '600'
                  }}
                >
                  + เพิ่มวันหมดอายุ
                </button>
              </div>

              <div className="button-group">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-block" 
                  disabled={submitting}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setShowModal(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={deleteConfirm.show}
        title="⚠️ ยืนยันการลบ"
        message={`คุณกำลังจะลบวัสดุ "${deleteConfirm.product?.name}"\n\nการลบจะไม่สามารถกู้คืนได้ กรุณาพิมพ์ "delete" เพื่อยืนยัน`}
        confirmText={submitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
        cancelText="ยกเลิก"
        confirmStyle="danger"
        requireInput={true}
        inputPlaceholder='พิมพ์ "delete" เพื่อยืนยัน'
        inputValue={deleteConfirm.input}
        onInputChange={(value) => setDeleteConfirm({ ...deleteConfirm, input: value })}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, product: null, input: '' })}
      />
    </div>
  )
}
