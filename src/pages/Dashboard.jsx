import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as sheetsService from '../services/sheetsService'
import Icon from '../components/Icon'
import SkeletonLoader from '../components/SkeletonLoader'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const dashboardData = await sheetsService.getDashboardData()
    setData(dashboardData)
    setLoading(false)
  }, [])



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
        <p className="header-subtitle">ภาพรวมคลังวัสดุ</p>
      </div>

      <div className="container">
        <div className="hero-stat">
          <div className="hero-stat-label">วัสดุทั้งหมด</div>
          <div className="hero-stat-value">{data.totalProducts}</div>
          <div className="hero-stat-desc">รายการในระบบ</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <Icon name="products" size={28} color="var(--color-success)" />
            <div className="stat-value">{data.totalQuantity.toLocaleString()}</div>
            <div className="stat-label">จำนวนรวม</div>
          </div>
          <div className="stat-card">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{data.lowStockCount}</div>
            <div className="stat-label">ใกล้หมด</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">วัสดุใกล้หมด</div>
          {data.lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div className="empty-state-text">ไม่มีวัสดุใกล้หมด</div>
            </div>
          ) : (
            <div className="list">
              {data.lowStockProducts.map((product) => (
                <div key={product.code} className="list-item">
                  <div>
                    <div className="list-item-title">{product.name}</div>
                    <div className="list-item-subtitle">{product.code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-danger">
                      {product.quantity} / {product.lowStockThreshold} {product.unit}
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
