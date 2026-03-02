import { useState } from 'react'
import { useSheets } from '../contexts/SheetsContext'
import { haptics } from '../utils/haptics'
import Papa from 'papaparse'
import './Import.css'

export default function Import() {
  const { loading } = useSheets()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [importing, setImporting] = useState(false)

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

    haptics.medium()
    setImporting(true)

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // Send to backend for processing
          const response = await fetch('/api/import-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: results.data })
          })

          const result = await response.json()
          
          if (result.success) {
            haptics.success()
            setMessage({ type: 'success', text: 'นำเข้าข้อมูลสำเร็จ' })
            setFile(null)
            setPreview(null)
          } else {
            haptics.error()
            setMessage({ type: 'error', text: result.message })
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
              disabled={!file || importing || loading}
            >
              {importing ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
