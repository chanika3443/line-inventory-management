import { useState, useEffect } from 'react'
import * as sheetsService from '../services/sheetsService'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Logs.css'

export default function Logs() {
  useHeaderShrink()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: ''
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    setLoading(true)
    const data = await sheetsService.getTransactionLogs(filters)
    setTransactions(data)
    setLoading(false)
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleApplyFilters() {
    loadTransactions()
  }

  function getTypeLabel(type) {
    const typeUpper = type.toUpperCase()
    const labels = {
      WITHDRAW: 'เบิก',
      RECEIVE: 'รับเข้า',
      RETURN: 'คืน',
      CREATE: 'สร้าง',
      EDIT: 'แก้ไข',
      DELETE: 'ลบ',
      'เบิก': 'เบิก',
      'รับเข้า': 'รับเข้า',
      'คืน': 'คืน'
    }
    return labels[typeUpper] || labels[type] || type
  }

  function getTypeBadgeClass(type) {
    const typeUpper = type.toUpperCase()
    const classes = {
      WITHDRAW: 'badge-danger',
      RECEIVE: 'badge-success',
      RETURN: 'badge-warning',
      CREATE: 'badge-success',
      EDIT: 'badge-info',
      DELETE: 'badge-danger',
      'เบิก': 'badge-danger',
      'รับเข้า': 'badge-success',
      'คืน': 'badge-warning'
    }
    return classes[typeUpper] || classes[type] || 'badge-secondary'
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="logs-page">
      <div className="header">
        <h1>ประวัติ</h1>
        <p className="header-subtitle">รายการทั้งหมดในระบบ</p>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-outline btn-block"
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {showFilters ? 'ซ่อนตัวกรอง' : 'ค้นหา / กรอง'}
        </button>

        {showFilters && (
          <div className="filters-card card" style={{ marginBottom: '16px' }}>
            <div className="input-group">
              <label className="input-label">วันที่เริ่มต้น</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">วันที่สิ้นสุด</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">ประเภท</label>
              <select
                className="select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="WITHDRAW">เบิก</option>
                <option value="RECEIVE">รับเข้า</option>
                <option value="RETURN">คืน</option>
                <option value="CREATE">สร้าง</option>
                <option value="EDIT">แก้ไข</option>
                <option value="DELETE">ลบ</option>
              </select>
            </div>

            <button onClick={handleApplyFilters} className="btn btn-primary btn-block">
              ค้นหา
            </button>
          </div>
        )}

      <div className="transaction-count">
        พบ {transactions.length} รายการ
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>ไม่พบประวัติการทำรายการ</p>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {transaction.productName}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {transaction.productCode}
                  </div>
                </div>
                <span className={`badge ${getTypeBadgeClass(transaction.type)}`}>
                  {getTypeLabel(transaction.type)}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '12px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>จำนวน</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>
                    {transaction.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>ก่อน</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {transaction.beforeQuantity}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>หลัง</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {transaction.afterQuantity}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                👤 {transaction.userName}
              </div>
              
              {transaction.note && (
                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px',
                  padding: '8px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--accent)'
                }}>
                  📝 {transaction.note}
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                🕐 {formatDate(transaction.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
