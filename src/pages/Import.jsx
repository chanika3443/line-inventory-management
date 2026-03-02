import { useState } from 'react'
import { useLiff } from '../contexts/LiffContext'
import { haptics } from '../utils/haptics'
import * as appsScriptService from '../services/appsScriptService'
import Papa from 'papaparse'
import './Import.css'

export default function Import() {
  const { userName, loginMode } = useLiff()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [importing, setImporting] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)

  const isLineLogin = loginMode === 'line'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'กรุณาเลือกไฟล์ CSV เท่านั้น' })
      return
    }

    setFile(selectedFile)
    
    // Parse CSV for preview
    Papa.parse(selectedFile, {
      complete: (results) => {
        setPreview(results.data.slice(0, 10)) // Show first 10 rows
      },
      error: (error) => {
        setMessage({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ได้: ' + error.message })
      }
    })
  }

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'กรุณาเลือกไฟล์ก่อน' })
      return
    }

    if (!isLineLogin) {
      setMessage({ type: 'error', text: 'ต้อง Login ด้วย LINE เท่านั้น' })
      return
    }

    haptics.medium()
    setImporting(true)
    setMessage(null)

    Papa.parse(file, {
      complete: async (results) => {
        try {
          const result = await appsScriptService.importWarehouseData(results.data, userName)
          
          if (result.success) {
            haptics.success()
            setMessage({ 
              type: 'success', 
              text: `นำเข้าข้อมูลสำเร็จ ${result.rowCount} แถว` 
            })
            setFile(null)
            setPreview(null)
            
            // Reset file input
            document.getElementById('csv-file').value = ''
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
      },
      error: (error) => {
        haptics.error()
        setMessage({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ได้: ' + error.message })
        setImporting(false)
      }
    })
  }

  // Show access denied if not LINE login or no permission
  if (!isLineLogin || !hasAccess) {
    return (
      <div className="import-page">
        <div className="header">
          <h1>นำเข้าข้อมูล</h1>
          <p className="header-subtitle">นำเข้าข้อมูลจากไฟล์ CSV</p>
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
        <p className="header-subtitle">นำเข้าข้อมูลจากไฟล์ CSV</p>
      </div>

      <div className="container">
        {message && (
          <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-danger'}>
            {message.text}
          </div>
        )}

        <div className="card">
          <div className="card-title">เลือกไฟล์ CSV</div>
          
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="file-label">
              <span className="file-icon">📁</span>
              <span>{file ? file.name : 'เลือกไฟล์ CSV'}</span>
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
