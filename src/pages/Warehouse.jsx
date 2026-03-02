import { useState, useEffect } from 'react'
import { useLiff } from '../contexts/LiffContext'
import * as appsScriptService from '../services/appsScriptService'
import SkeletonLoader from '../components/SkeletonLoader'
import './Warehouse.css'

export default function Warehouse() {
  const [warehouseData, setWarehouseData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWarehouseData()
  }, [])

  const fetchWarehouseData = async () => {
    setLoading(true)
    try {
      const result = await appsScriptService.getWarehouseData()
      
      if (result.success) {
        // Parse the data - assuming CSV structure
        const parsedData = result.data.map((row, index) => ({
          no: row['No.'] || index + 1,
          material: row['material'] || '',
          description: row['Material Description'] || '',
          plant: row['Plant'] || '',
          batch: row['Batch'] || '',
          unit: row['B.Un'] || '',
          withdrawDate: row['วันที่'] || '',
          withdrawQty: row['จำนวน'] || '',
          mainStockOld: row['เดิม'] || '',
          mainStockIn: row['รับเข้า'] || '',
          mainStockOut: row['ออก'] || '',
          mainStockRemain: row['คงเหลือ'] || '',
          mainStockSystem: row['ระบบ'] || '',
          mainStockExpiry: row['Exp.สต๊อกใหญ่'] || '',
          subStockExpiry: row['Exp.สต๊อกเล็ก'] || '',
          subStockOld: row['เดิม.1'] || '',
          subStockIn: row['รับเข้า.1'] || '',
          subStockRemain: row['คงเหลือ.1'] || '',
          price: row['ราคา(บาท)'] || ''
        }))
        
        setWarehouseData(parsedData)
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = warehouseData.filter(item =>
    item.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="warehouse-page">
        <div className="header">
          <h1>คลังวัสดุ</h1>
          <p className="header-subtitle">ข้อมูลคลังวัสดุรายเดือน</p>
        </div>
        <div className="container">
          <SkeletonLoader type="list" count={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="warehouse-page">
      <div className="header">
        <h1>คลังวัสดุ</h1>
        <p className="header-subtitle">Display Warehouse Stocks of Material (For Monthly Count)</p>
      </div>

      <div className="container">
        <div className="search-section">
          <input
            type="text"
            className="input"
            placeholder="ค้นหารหัสวัสดุหรือชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-container">
          <div className="table-scroll">
            <table className="warehouse-table">
              <thead>
                <tr>
                  <th rowSpan="2">No.</th>
                  <th rowSpan="2">material</th>
                  <th rowSpan="2">Material Description</th>
                  <th rowSpan="2">Plant</th>
                  <th rowSpan="2">Batch</th>
                  <th rowSpan="2">B.Un</th>
                  <th colSpan="2">เบิก</th>
                  <th colSpan="5">สต๊อกใหญ่</th>
                  <th rowSpan="2">Exp.สต๊อกใหญ่</th>
                  <th rowSpan="2">Exp.สต๊อกเล็ก</th>
                  <th colSpan="3">สต๊อกเล็ก</th>
                  <th rowSpan="2">ราคา<br/>(บาท)</th>
                </tr>
                <tr>
                  <th>วันที่</th>
                  <th>จำนวน</th>
                  <th>เดิม</th>
                  <th>รับเข้า</th>
                  <th>ออก</th>
                  <th>คงเหลือ</th>
                  <th>ระบบ</th>
                  <th>เดิม</th>
                  <th>รับเข้า</th>
                  <th>คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="20" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p>ไม่มีข้อมูล</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          กรุณานำเข้าข้อมูลจากไฟล์ CSV
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.material}</td>
                      <td className="description-cell">{item.description}</td>
                      <td>{item.plant}</td>
                      <td>{item.batch}</td>
                      <td>{item.unit}</td>
                      <td>{item.withdrawDate}</td>
                      <td>{item.withdrawQty}</td>
                      <td>{item.mainStockOld}</td>
                      <td>{item.mainStockIn}</td>
                      <td>{item.mainStockOut}</td>
                      <td>{item.mainStockRemain}</td>
                      <td>{item.mainStockSystem}</td>
                      <td className="expiry-cell">{item.mainStockExpiry}</td>
                      <td className="expiry-cell">{item.subStockExpiry}</td>
                      <td>{item.subStockOld}</td>
                      <td>{item.subStockIn}</td>
                      <td>{item.subStockRemain}</td>
                      <td>{item.price}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
