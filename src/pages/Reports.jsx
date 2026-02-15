import { useState, useEffect, useCallback, useRef } from 'react'
import * as sheetsService from '../services/sheetsService'
import Loading from '../components/Loading'
import { useHeaderShrink } from '../hooks/useHeaderShrink'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  const exportToPDF = useCallback(() => {
    if (!report) return

    const doc = new jsPDF()
    
    // Add Thai font support (using default font for now)
    doc.setFont('helvetica')
    
    // Title
    doc.setFontSize(18)
    doc.text('รายงานการเคลื่อนไหววัสดุ', 14, 20)
    
    // Date range
    doc.setFontSize(10)
    doc.text(`ช่วงเวลา: ${filters.startDate} ถึง ${filters.endDate}`, 14, 28)
    
    // Summary section
    doc.setFontSize(12)
    doc.text('สรุป', 14, 38)
    
    const summaryData = [
      ['เบิกออก', report.summary.totalWithdrawals.toString()],
      ['รับเข้า', report.summary.totalReceipts.toString()],
      ['คืน', report.summary.totalReturns.toString()],
      ['สุทธิ', report.summary.netChange.toString()],
      ['รายการทั้งหมด', report.summary.transactionCount.toString()]
    ]
    
    autoTable(doc, {
      startY: 42,
      head: [['รายการ', 'จำนวน']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    })
    
    // Transaction details
    if (report.transactions.length > 0) {
      doc.setFontSize(12)
      doc.text('รายละเอียด', 14, doc.lastAutoTable.finalY + 10)
      
      const transactionData = report.transactions.map(t => {
        const type = t.type.toUpperCase()
        let typeLabel = t.type
        if (type === 'WITHDRAW' || type === 'เบิก') typeLabel = 'เบิก'
        else if (type === 'RETURN' || type === 'คืน') typeLabel = 'คืน'
        else if (type === 'RECEIVE' || type === 'รับเข้า') typeLabel = 'รับเข้า'
        else if (type === 'CREATE') typeLabel = 'สร้าง'
        else if (type === 'EDIT') typeLabel = 'แก้ไข'
        else if (type === 'DELETE') typeLabel = 'ลบ'
        
        return [
          t.productName,
          typeLabel,
          t.quantity.toString(),
          new Date(t.timestamp).toLocaleDateString('th-TH')
        ]
      })
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['วัสดุ', 'ประเภท', 'จำนวน', 'วันที่']],
        body: transactionData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] }
      })
    }
    
    // Save PDF
    const filename = `รายงาน_${filters.startDate}_${filters.endDate}.pdf`
    doc.save(filename)
  }, [report, filters])

  const exportToExcel = useCallback(() => {
    if (!report) return

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['รายงานการเคลื่อนไหววัสดุ'],
      ['ช่วงเวลา', `${filters.startDate} ถึง ${filters.endDate}`],
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
    
    // Transactions sheet
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
        
        return {
          'วัสดุ': t.productName,
          'ประเภท': typeLabel,
          'จำนวน': t.quantity,
          'วันที่': new Date(t.timestamp).toLocaleDateString('th-TH'),
          'เวลา': new Date(t.timestamp).toLocaleTimeString('th-TH')
        }
      })
      
      const transactionSheet = XLSX.utils.json_to_sheet(transactionData)
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
    csvContent += `ช่วงเวลา,${filters.startDate} ถึง ${filters.endDate}\n\n`
    
    // Summary
    csvContent += 'สรุป\n'
    csvContent += `เบิกออก,${report.summary.totalWithdrawals}\n`
    csvContent += `รับเข้า,${report.summary.totalReceipts}\n`
    csvContent += `คืน,${report.summary.totalReturns}\n`
    csvContent += `สุทธิ,${report.summary.netChange}\n`
    csvContent += `รายการทั้งหมด,${report.summary.transactionCount}\n\n`
    
    // Transaction details
    if (report.transactions.length > 0) {
      csvContent += 'รายละเอียด\n'
      csvContent += 'วัสดุ,ประเภท,จำนวน,วันที่,เวลา\n'
      
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
        csvContent += `${t.productName},${typeLabel},${t.quantity},${date.toLocaleDateString('th-TH')},${date.toLocaleTimeString('th-TH')}\n`
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
      </div>

      {report && (
        <>
          <div className="export-buttons">
            <button onClick={exportToPDF} className="btn btn-export btn-pdf">
              <span className="export-icon">📄</span>
              PDF
            </button>
            <button onClick={exportToExcel} className="btn btn-export btn-excel">
              <span className="export-icon">📊</span>
              Excel
            </button>
            <button onClick={exportToCSV} className="btn btn-export btn-csv">
              <span className="export-icon">📋</span>
              CSV
            </button>
          </div>

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
