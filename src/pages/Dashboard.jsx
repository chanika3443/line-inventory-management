import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSheets } from '../contexts/SheetsContext'
import * as sheetsService from '../services/sheetsService'
import { getTabShortLabel } from '../utils/sheetHelpers'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import { haptics } from '../utils/haptics'
import './Dashboard.css'

export default function Dashboard() {
  const { currentTab } = useSheets()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    haptics.light()
    const dashboardData = await sheetsService.getDashboardData(currentTab)
    setData(dashboardData)
    setLoading(false)
  }, [currentTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadData])

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="header">
          <h1>ภาพรวม</h1>
          <p className="header-subtitle">ภาพรวมคลังวัสดุ</p>
        </div>
        <div className="container">
          <SkeletonLoader type="stats" count={2} />
          <SkeletonLoader type="card" count={1} />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="header">
        <h1>ภาพรวม</h1>
        <p className="header-subtitle">ภาพรวมคลังวัสดุ · {getTabShortLabel(currentTab)}</p>
      </div>

      <div className="container">
        <div className="hero-stat">
          <div className="hero-stat-label">วัสดุทั้งหมด</div>
          <div className="hero-stat-value">{data.totalMaterials || data.totalProducts}</div>
          <div className="hero-stat-desc">รายการในรอบเดือน {getTabShortLabel(currentTab)}</div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="stat-card">
            <Icon name="products" size={24} color="var(--color-success)" />
            <div className="stat-value">{(data.totalMainRemaining ?? 0).toLocaleString()}</div>
            <div className="stat-label">สต๊อกใหญ่</div>
          </div>
          <div className="stat-card">
            <Icon name="products" size={24} color="#5ac8fa" />
            <div className="stat-value">{(data.totalSubRemaining ?? 0).toLocaleString()}</div>
            <div className="stat-label">สต๊อกเล็ก</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{(data.totalRemaining ?? data.totalQuantity ?? 0).toLocaleString()}</div>
            <div className="stat-label">รวมทุกสต๊อก</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{data.lowStockCount ?? 0}</div>
            <div className="stat-label">ใกล้หมด (≤5)</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">วัสดุใกล้หมด</div>
          {(data.lowStockMaterials || data.lowStockProducts || []).length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div className="empty-state-text">ไม่มีวัสดุใกล้หมด</div>
            </div>
          ) : (
            <div className="list">
              {(data.lowStockMaterials || data.lowStockProducts).map((product) => (
                <div key={product.materialCode || product.code} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="list-item-title">{product.description || product.name}</div>
                    <div className="list-item-subtitle">
                      รหัส: {product.materialCode || product.code}
                      {product.plant && ` · Plant: ${product.plant}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-danger">
                      ใหญ่: {product.totalMainRemaining ?? product.mainStock?.remaining ?? 0} · เล็ก: {product.totalSubRemaining ?? product.subStock?.remaining ?? 0} {product.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">ดำเนินการด่วน</div>
          <Link to="/withdraw" className="btn btn-primary btn-block mb-2">
            <Icon name="withdraw" size={20} color="white" />
            เบิกวัสดุ
          </Link>
          <Link to="/receive" className="btn btn-success btn-block mb-2">
            <Icon name="receive" size={20} color="white" />
            รับเข้าวัสดุ
          </Link>
          <Link to="/products" className="btn btn-outline btn-block">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            จัดการวัสดุ
          </Link>
        </div>
      </div>
    </div>
  )
}
