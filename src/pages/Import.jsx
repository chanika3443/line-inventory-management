import { useState } from 'react'
import { useLiff } from '../contexts/LiffContext'
import { haptics } from '../utils/haptics'
import * as appsScriptService from '../services/appsScriptService'
import * as XLSX from 'xlsx'
import './Import.css'

export default function Import() {
  const { userName, loginMode } = useLiff()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [importing, setImporting] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)

  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isLineLogin = loginMode === 'line'
  
  // On localhost, only check username. On production, require LINE login
  const requiresLineLogin = !isLocalhost && !isLineLogin

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setMessage({ type: 'error', text: 'กรุณาเลือกไฟล์ CSV หรือ Excel เท่านั้น' })
      return
    }

    setFile(selectedFile)
    
    // Parse file for preview
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        if (fileExtension === 'csv') {
          // Parse CSV
          const text = event.target.result
          const rows = text.split('\n').map(row => row.split(','))
          setPreview(rows.slice(0, 10))
        } else {
          // Parse Excel
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
          setPreview(jsonData.slice(0, 10))
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ได้: ' + error.message })
      }
    }
    
    if (fileExtension === 'csv') {
      reader.readAsText(selectedFile)
    } else {
      reader.readAsArrayBuffer(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'กรุณาเลือกไฟล์ก่อน' })
      return
    }

    if (requiresLineLogin) {
      setMessage({ type: 'error', text: 'ต้อง Login ด้วย LINE เท่านั้น' })
      return
    }

    haptics.medium()
    setImporting(true)
    setMessage(null)

    const reader = new FileReader()
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    reader.onload = async (event) => {
      try {
        let parsedData
        
        if (fileExtension === 'csv') {
          // Parse CSV
          const text = event.target.result
          parsedData = text.split('\n').map(row => row.split(','))
        } else {
          // Parse Excel
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          parsedData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        }
        
        const result = await appsScriptService.importWarehouseData(parsedData, userName)
        
        if (result.success) {
          haptics.success()
          let successMessage = result.message
          if (result.updatedCount !== undefined && result.addedCount !== undefined) {
            successMessage = `นำเข้าข้อมูลสำเร็จ\n• อัปเดต: ${result.updatedCount} แถว\n• เพิ่มใหม่: ${result.addedCount} แถว`
          }
          setMessage({ 
            type: 'success', 
            text: successMessage
          })
          setFile(null)
          setPreview(null)
          
          // Reset file input
          document.getElementById('file-input').value = ''
        } else {
          haptics.error()
          setMessage({ type: 'error', text: result.message })
          
          // Check if access denied
          if (result.message.includes('ไม่มีสิทธิ์')) {
            setHasAccess(false)
          }
        }
      } catch (error) {
        haptics.error()
        setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message })
      } finally {
        setImporting(false)
      }
    }
    
    reader.onerror = () => {
      haptics.error()
      setMessage({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ได้' })
      setImporting(false)
    }
    
    if (fileExtension === 'csv') {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  // Show access denied if requires LINE login or no permission
  if (requiresLineLogin || !hasAccess) {
    return (
      <div className="import-page">
        <div className="header">
          <h1>นำเข้าข้อมูล</h1>
          <p className="header-subtitle">นำเข้าข้อมูลจากไฟล์ CSV หรือ Excel</p>
        </div>

        <div className="container">
          <div className="access-denied-card">
            <div className="access-denied-icon">🔒</div>
            <h2 className="access-denied-title">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="access-denied-message">
              {requiresLineLogin ? (
                <>
                  หน้านี้ต้อง Login with LINE เท่านั้น
                  <br />
                  กรุณา Logout และ Login ด้วย LINE อีกครั้ง
                </>
              ) : (
                <>
                  คุณไม่มีสิทธิ์นำเข้าข้อมูล
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
              {isLocalhost && (
                <p className="access-denied-user" style={{ fontSize: '13px', color: '#34c759', marginTop: '4px' }}>
                  🏠 Localhost mode - ไม่ต้อง LINE login
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="import-page">
      <div className="header">
        <h1>นำเข้าข้อมูล</h1>
        <p className="header-subtitle">นำเข้าข้อมูลจากไฟล์ CSV หรือ Excel</p>
      </div>

      <div className="container">
        {message && (
          <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-danger'} style={{ whiteSpace: 'pre-line' }}>
            {message.text}
          </div>
        )}

        <div className="card">
          <div className="card-title">เลือกไฟล์ CSV หรือ Excel</div>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              <span className="file-icon">📁</span>
              <span>{file ? file.name : 'เลือกไฟล์ CSV หรือ Excel'}</span>
            </label>
          </div>

          {preview && (
            <div className="preview-section">
              <h3>ตัวอย่างข้อมูล (10 แถวแรก)</h3>
              <div className="table-wrapper">
                <table className="preview-table">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="button-group">
            <button
              onClick={handleImport}
              className="btn btn-primary btn-block"
              disabled={!file || importing}
            >
              {importing ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
