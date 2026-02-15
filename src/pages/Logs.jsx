import { useState, useEffect } from 'react'
import * as sheetsService from '../services/sheetsService'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Logs.css'

export default function Logs() {
  useHeaderShrink()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
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
    const labels = {
      WITHDRAW: 'เบิก',
      RECEIVE: 'รับเข้า',
      RETURN: 'คืน',
      CREATE: 'สร้าง',
      EDIT: 'แก้ไข',
      DELETE: 'ลบ'
    }
    return labels[type] || type
  }

  function getTypeBadgeClass(type) {
    const classes = {
      WITHDRAW: 'badge-primary',
      RECEIVE: 'badge-success',
      RETURN: 'badge-warning',
      CREATE: 'badge-success',
      EDIT: 'badge-warning',
      DELETE: 'badge-danger'
    }
    return classes[type] || 'badge-secondary'
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
        <div className="filters-card card">
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
              <div className="transaction-header">
                <span className={`badge ${getTypeBadgeClass(transaction.type)}`}>
                  {getTypeLabel(transaction.type)}
                </span>
                <span className="transaction-date">{formatDate(transaction.timestamp)}</span>
              </div>

              <div className="transaction-product">
                <div className="product-name">{transaction.productName}</div>
                <div className="product-code">{transaction.productCode}</div>
              </div>

              <div className="transaction-details">
                <div className="detail-row">
                  <span>จำนวน:</span>
                  <span className="detail-value">{transaction.quantity}</span>
                </div>
                <div className="detail-row">
                  <span>ก่อน:</span>
                  <span className="detail-value">{transaction.beforeQuantity}</span>
                </div>
                <div className="detail-row">
                  <span>หลัง:</span>
                  <span className="detail-value">{transaction.afterQuantity}</span>
                </div>
                <div className="detail-row">
                  <span>ผู้ทำรายการ:</span>
                  <span className="detail-value">{transaction.userName}</span>
                </div>
                {transaction.note && (
                  <div className="detail-row">
                    <span>หมายเหตุ:</span>
                    <span className="detail-value">{transaction.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
