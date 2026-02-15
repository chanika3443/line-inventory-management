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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [dateRange, setDateRange] = useState('today') // Default to today
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc') // 'asc' or 'desc'
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: ''
  })

  useEffect(() => {
    applyDateRange(dateRange)
  }, [])

  function applyDateRange(range) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let startDate = new Date(today)
    let endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    
    switch(range) {
      case '3days':
        startDate.setDate(today.getDate() - 2)
        break
      case '7days':
        startDate.setDate(today.getDate() - 6)
        break
      case '14days':
        startDate.setDate(today.getDate() - 13)
        break
      case '30days':
        startDate.setDate(today.getDate() - 29)
        break
      case 'today':
      default:
        // Already set to today
        break
    }
    
    setDateRange(range)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    setFilters(prev => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr
    }))
    setCurrentPage(1)
    
    // Load with new dates
    loadTransactionsWithDates(startDateStr, endDateStr)
  }

  async function loadTransactionsWithDates(start, end) {
    setLoading(true)
    const data = await sheetsService.getTransactionLogs({
      startDate: start,
      endDate: end,
      type: filters.type
    })
    setTransactions(data)
    setLoading(false)
  }

  async function loadTransactions() {
    setLoading(true)
    const data = await sheetsService.getTransactionLogs(filters)
    console.log('Loaded transactions:', data.length, data.slice(0, 3))
    setTransactions(data)
    setLoading(false)
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleApplyFilters() {
    setCurrentPage(1)
    loadTransactions()
  }

  function handleSort(field) {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal, bVal
    
    switch(sortField) {
      case 'type':
        aVal = a.type
        bVal = b.type
        break
      case 'productName':
        aVal = a.productName
        bVal = b.productName
        break
      case 'quantity':
        aVal = a.quantity
        bVal = b.quantity
        break
      case 'userName':
        aVal = a.userName
        bVal = b.userName
        break
      case 'timestamp':
      default:
        aVal = new Date(a.timestamp)
        bVal = new Date(b.timestamp)
        break
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)

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
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month} ${hour}:${minute}`
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
        {/* Date Range Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginBottom: '12px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { value: 'today', label: 'วันนี้' },
            { value: '3days', label: '3 วัน' },
            { value: '7days', label: '7 วัน' },
            { value: '14days', label: '14 วัน' },
            { value: '30days', label: '1 เดือน' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => applyDateRange(range.value)}
              className={`btn ${dateRange === range.value ? 'btn-primary' : 'btn-outline'}`}
              style={{ 
                fontSize: '13px', 
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-outline btn-block"
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', padding: '10px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {showFilters ? 'ซ่อนตัวกรอง' : 'ค้นหาเพิ่มเติม'}
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

      <div className="transaction-count" style={{ marginBottom: '12px', fontSize: '14px' }}>
        พบ {transactions.length} รายการ {totalPages > 1 && `(หน้า ${currentPage}/${totalPages})`}
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>ไม่พบประวัติการทำรายการ</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ overflowX: 'auto', marginBottom: '16px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <table style={{ 
              width: '100%', 
              fontSize: '13px',
              borderCollapse: 'collapse',
              background: 'var(--bg-elevated)'
            }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', borderBottom: '2px solid var(--border-strong)' }}>
                  <th 
                    onClick={() => handleSort('type')}
                    style={{ 
                      padding: '14px 10px', 
                      textAlign: 'left', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    ประเภท {sortField === 'type' && <span style={{ color: 'var(--accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th 
                    onClick={() => handleSort('productName')}
                    style={{ 
                      padding: '14px 10px', 
                      textAlign: 'left', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    วัสดุ {sortField === 'productName' && <span style={{ color: 'var(--accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th 
                    onClick={() => handleSort('quantity')}
                    style={{ 
                      padding: '14px 10px', 
                      textAlign: 'center', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    จำนวน {sortField === 'quantity' && <span style={{ color: 'var(--accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th 
                    onClick={() => handleSort('userName')}
                    style={{ 
                      padding: '14px 10px', 
                      textAlign: 'left', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    ผู้ทำรายการ {sortField === 'userName' && <span style={{ color: 'var(--accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th 
                    onClick={() => handleSort('timestamp')}
                    style={{ 
                      padding: '14px 10px', 
                      textAlign: 'left', 
                      fontWeight: '700', 
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    เวลา {sortField === 'timestamp' && <span style={{ color: 'var(--accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map((transaction, index) => (
                  <tr key={transaction.id} style={{ 
                    borderBottom: '1px solid var(--border)',
                    background: index % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-primary)'}
                  >
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${getTypeBadgeClass(transaction.type)}`} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                      {transaction.productName}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '16px' }}>
                        {transaction.quantity}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {transaction.beforeQuantity}→{transaction.afterQuantity}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontSize: '13px' }}>
                      {transaction.userName}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(transaction.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                ← ก่อนหน้า
              </button>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '13px',
                          minWidth: '40px'
                        }}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ padding: '8px 4px', color: 'var(--text-tertiary)' }}>...</span>
                  }
                  return null
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
