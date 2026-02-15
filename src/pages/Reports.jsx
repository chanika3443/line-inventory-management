import { useState, useEffect, useCallback, useRef } from 'react'
import * as sheetsService from '../services/sheetsService'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import './Reports.css'

export default function Reports() {
  useHeaderShrink()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })
  const isInitialMount = useRef(true)

  const loadReport = useCallback(async (filterParams) => {
    setLoading(true)
    const transactions = await sheetsService.getTransactionLogs(filterParams)
    
    console.log('Transactions loaded:', transactions.length, transactions.slice(0, 3))

    // Calculate summary
    let totalWithdrawals = 0
    let totalReceipts = 0
    let totalReturns = 0

    transactions.forEach(t => {
      const type = t.type.toUpperCase()
      if (type === 'WITHDRAW' || type === 'เบิก') {
        totalWithdrawals += t.quantity
      } else if (type === 'RECEIVE' || type === 'รับเข้า') {
        totalReceipts += t.quantity
      } else if (type === 'RETURN' || type === 'คืน') {
        totalReturns += t.quantity
      }
    })

    const netChange = totalReceipts + totalReturns - totalWithdrawals

    const reportData = {
      transactions,
      summary: {
        totalWithdrawals,
        totalReceipts,
        totalReturns,
        netChange,
        transactionCount: transactions.length
      }
    }
    
    console.log('Report data:', reportData)
    setReport(reportData)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      
      // Set default date range (last 30 days)
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const defaultFilters = {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }

      setFilters(defaultFilters)
      loadReport(defaultFilters)
    }
  }, [])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleApplyFilters() {
    loadReport(filters)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="reports-page">
      <div className="header">
        <h1>รายงาน</h1>
        <p className="header-subtitle">สรุปการเคลื่อนไหววัสดุ</p>
      </div>

      <div className="container" style={{ paddingTop: '16px' }}>
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

        <button onClick={handleApplyFilters} className="btn btn-primary btn-block">
          สร้างรายงาน
        </button>
      </div>

      {report && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-value text-danger">{report.summary.totalWithdrawals}</div>
              <div className="summary-label">เบิกออก</div>
            </div>

            <div className="summary-card">
              <div className="summary-value text-success">{report.summary.totalReceipts}</div>
              <div className="summary-label">รับเข้า</div>
            </div>

            <div className="summary-card">
              <div className="summary-value text-warning">{report.summary.totalReturns}</div>
              <div className="summary-label">คืน</div>
            </div>

            <div className="summary-card summary-net">
              <div className={`summary-value ${report.summary.netChange >= 0 ? 'text-success' : 'text-danger'}`}>
                {report.summary.netChange >= 0 ? '+' : ''}{report.summary.netChange}
              </div>
              <div className="summary-label">สุทธิ</div>
            </div>
          </div>

          <div className="transaction-count">
            รายการทั้งหมด: {report.summary.transactionCount} รายการ
          </div>

          {report.transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
            </div>
          ) : (
            <div className="report-details card">
              <h3>รายละเอียด</h3>
              <div className="report-list">
                {report.transactions.slice(0, 10).map((transaction) => {
                  const type = transaction.type.toUpperCase()
                  const isWithdraw = type === 'WITHDRAW' || type === 'เบิก'
                  const isReturn = type === 'RETURN' || type === 'คืน'
                  const isReceive = type === 'RECEIVE' || type === 'รับเข้า'
                  const isCreate = type === 'CREATE'
                  const isEdit = type === 'EDIT'
                  const isDelete = type === 'DELETE'
                  
                  let typeLabel = transaction.type
                  if (isWithdraw) typeLabel = 'เบิก'
                  else if (isReturn) typeLabel = 'คืน'
                  else if (isReceive) typeLabel = 'รับเข้า'
                  else if (isCreate) typeLabel = 'สร้าง'
                  else if (isEdit) typeLabel = 'แก้ไข'
                  else if (isDelete) typeLabel = 'ลบ'
                  
                  return (
                    <div key={transaction.id} className="report-item">
                      <div className="report-item-header">
                        <span className="report-item-name">{transaction.productName}</span>
                        <span className={`report-item-quantity ${
                          isWithdraw || isDelete ? 'text-danger' : 
                          isReceive || isReturn || isCreate ? 'text-success' : 
                          'text-muted'
                        }`}>
                          {isWithdraw || isDelete ? '-' : isReceive || isReturn || isCreate ? '+' : ''}{transaction.quantity}
                        </span>
                      </div>
                      <div className="report-item-meta">
                        <span>{typeLabel}</span>
                        <span>{new Date(transaction.timestamp).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {report.transactions.length > 10 && (
                <div className="text-center text-muted mt-md">
                  และอีก {report.transactions.length - 10} รายการ
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
