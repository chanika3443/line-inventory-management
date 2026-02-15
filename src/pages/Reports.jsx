import { useState, useEffect, useCallback, useRef } from 'react'
import * as sheetsService from '../services/sheetsService'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import * as XLSX from 'xlsx'
import './Reports.css'

export default function Reports() {
  useHeaderShrink()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })
  const [showExportMenu, setShowExportMenu] = useState(false)
  const isInitialMount = useRef(true)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-section')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

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

  const handleExport = (format) => {
    if (format === 'excel') {
      exportToExcel()
    } else if (format === 'csv') {
      exportToCSV()
    }
    setShowExportMenu(false)
  }

  const exportToExcel = useCallback(() => {
    if (!report) return

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['รายงานการเคลื่อนไหววัสดุ'],
      ['ช่วงเวลา', `${filters.startDate} ถึง ${filters.endDate}`],
      ['วันที่สร้างรายงาน', new Date().toLocaleString('th-TH')],
      [],
      ['สรุป'],
      ['เบิกออก', report.summary.totalWithdrawals],
      ['รับเข้า', report.summary.totalReceipts],
      ['คืน', report.summary.totalReturns],
      ['สุทธิ', report.summary.netChange],
      ['รายการทั้งหมด', report.summary.transactionCount]
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'สรุป')
    
    // Transactions sheet with detailed information
    if (report.transactions.length > 0) {
      const transactionData = report.transactions.map(t => {
        const type = t.type.toUpperCase()
        let typeLabel = t.type
        if (type === 'WITHDRAW' || type === 'เบิก') typeLabel = 'เบิก'
        else if (type === 'RETURN' || type === 'คืน') typeLabel = 'คืน'
        else if (type === 'RECEIVE' || type === 'รับเข้า') typeLabel = 'รับเข้า'
        else if (type === 'CREATE') typeLabel = 'สร้าง'
        else if (type === 'EDIT') typeLabel = 'แก้ไข'
        else if (type === 'DELETE') typeLabel = 'ลบ'
        
        const date = new Date(t.timestamp)
        
        return {
          'วันที่': date.toLocaleDateString('th-TH'),
          'เวลา': date.toLocaleTimeString('th-TH'),
          'วัสดุ': t.productName,
          'รหัสวัสดุ': t.productCode || '-',
          'ประเภท': typeLabel,
          'จำนวน': t.quantity,
          'หน่วย': t.unit || '-',
          'ผู้ทำรายการ': t.userName || '-',
          'ห้องผู้ป่วย': t.roomNumber || '-',
          'ประเภทผู้ป่วย': t.patientType || '-',
          'หมายเหตุ': t.notes || '-'
        }
      })
      
      const transactionSheet = XLSX.utils.json_to_sheet(transactionData)
      
      // Set column widths
      transactionSheet['!cols'] = [
        { wch: 12 }, // วันที่
        { wch: 10 }, // เวลา
        { wch: 25 }, // วัสดุ
        { wch: 12 }, // รหัสวัสดุ
        { wch: 10 }, // ประเภท
        { wch: 8 },  // จำนวน
        { wch: 8 },  // หน่วย
        { wch: 20 }, // ผู้ทำรายการ
        { wch: 12 }, // ห้องผู้ป่วย
        { wch: 15 }, // ประเภทผู้ป่วย
        { wch: 30 }  // หมายเหตุ
      ]
      
      XLSX.utils.book_append_sheet(wb, transactionSheet, 'รายละเอียด')
    }
    
    // Save Excel file
    const filename = `รายงาน_${filters.startDate}_${filters.endDate}.xlsx`
    XLSX.writeFile(wb, filename)
  }, [report, filters])

  const exportToCSV = useCallback(() => {
    if (!report) return

    let csvContent = '\uFEFF' // UTF-8 BOM for Thai characters
    
    // Header
    csvContent += 'รายงานการเคลื่อนไหววัสดุ\n'
    csvContent += `ช่วงเวลา,${filters.startDate} ถึง ${filters.endDate}\n`
    csvContent += `วันที่สร้างรายงาน,${new Date().toLocaleString('th-TH')}\n\n`
    
    // Summary
    csvContent += 'สรุป\n'
    csvContent += `เบิกออก,${report.summary.totalWithdrawals}\n`
    csvContent += `รับเข้า,${report.summary.totalReceipts}\n`
    csvContent += `คืน,${report.summary.totalReturns}\n`
    csvContent += `สุทธิ,${report.summary.netChange}\n`
    csvContent += `รายการทั้งหมด,${report.summary.transactionCount}\n\n`
    
    // Transaction details with all information
    if (report.transactions.length > 0) {
      csvContent += 'รายละเอียด\n'
      csvContent += 'วันที่,เวลา,วัสดุ,รหัสวัสดุ,ประเภท,จำนวน,หน่วย,ผู้ทำรายการ,ห้องผู้ป่วย,ประเภทผู้ป่วย,หมายเหตุ\n'
      
      report.transactions.forEach(t => {
        const type = t.type.toUpperCase()
        let typeLabel = t.type
        if (type === 'WITHDRAW' || type === 'เบิก') typeLabel = 'เบิก'
        else if (type === 'RETURN' || type === 'คืน') typeLabel = 'คืน'
        else if (type === 'RECEIVE' || type === 'รับเข้า') typeLabel = 'รับเข้า'
        else if (type === 'CREATE') typeLabel = 'สร้าง'
        else if (type === 'EDIT') typeLabel = 'แก้ไข'
        else if (type === 'DELETE') typeLabel = 'ลบ'
        
        const date = new Date(t.timestamp)
        const dateStr = date.toLocaleDateString('th-TH')
        const timeStr = date.toLocaleTimeString('th-TH')
        const productCode = t.productCode || '-'
        const unit = t.unit || '-'
        const userName = t.userName || '-'
        const roomNumber = t.roomNumber || '-'
        const patientType = t.patientType || '-'
        const notes = (t.notes || '-').replace(/,/g, ';') // Replace commas in notes
        
        csvContent += `${dateStr},${timeStr},${t.productName},${productCode},${typeLabel},${t.quantity},${unit},${userName},${roomNumber},${patientType},${notes}\n`
      })
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `รายงาน_${filters.startDate}_${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [report, filters])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="reports-page">
      <div className="header">
        <h1>รายงาน</h1>
        <p className="header-subtitle">สรุปการเคลื่อนไหววัสดุ</p>
      </div>

      <div className="container" style={{ paddingTop: '12px' }}>
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

        {report && (
          <div className="export-section">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="btn btn-export-main btn-block"
            >
              <span>📥</span>
              Export รายงาน
            </button>
            
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={() => handleExport('excel')} className="export-menu-item">
                  <span className="export-menu-icon">📗</span>
                  <div className="export-menu-text">
                    <div className="export-menu-title">Excel</div>
                    <div className="export-menu-subtitle">ไฟล์ .xlsx</div>
                  </div>
                </button>
                <button onClick={() => handleExport('csv')} className="export-menu-item">
                  <span className="export-menu-icon">📄</span>
                  <div className="export-menu-text">
                    <div className="export-menu-title">CSV</div>
                    <div className="export-menu-subtitle">ไฟล์ .csv</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
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
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>วัสดุ</th>
                      <th>ประเภท</th>
                      <th>จำนวน</th>
                      <th>วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((transaction) => {
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
                        <tr key={transaction.id}>
                          <td className="product-name">{transaction.productName}</td>
                          <td className="transaction-type">
                            <span className={`type-badge ${
                              isWithdraw ? 'badge-withdraw' :
                              isReturn ? 'badge-return' :
                              isReceive ? 'badge-receive' :
                              isCreate ? 'badge-create' :
                              isEdit ? 'badge-edit' :
                              isDelete ? 'badge-delete' : ''
                            }`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className={`quantity ${
                            isWithdraw || isDelete ? 'text-danger' : 
                            isReceive || isReturn || isCreate ? 'text-success' : 
                            'text-muted'
                          }`}>
                            {isWithdraw || isDelete ? '-' : isReceive || isReturn || isCreate ? '+' : ''}{transaction.quantity}
                          </td>
                          <td className="date">{new Date(transaction.timestamp).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
