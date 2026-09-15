import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSheets } from '../contexts/SheetsContext'
import { getTabShortLabel } from '../utils/sheetHelpers'
import Icon from '../components/Icon'
import './Home.css'

export default function Home() {
  const { currentTab, availableTabs, fetchTabs, switchTab, loading } = useSheets()

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])
  const menuItems = [
    { 
      icon: 'withdraw', 
      title: 'เบิกวัสดุ', 
      path: '/withdraw', 
      bgColor: 'rgba(255,149,0,0.1)', 
      iconColor: '#ff9500' 
    },
    { 
      icon: 'return', 
      title: 'คืน', 
      path: '/return', 
      bgColor: 'rgba(52,199,89,0.1)', 
      iconColor: '#34c759' 
    },
    { 
      icon: 'receive', 
      title: 'รับเข้า', 
      path: '/receive', 
      bgColor: 'rgba(52,199,89,0.1)', 
      iconColor: '#34c759' 
    },
    { 
      icon: 'logs', 
      title: 'ประวัติ', 
      path: '/logs', 
      bgColor: 'rgba(90,200,250,0.1)', 
      iconColor: '#5ac8fa' 
    }
  ]

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-icon">
          <Icon name="products" size={40} color="white" />
        </div>
        <h1>คลังวัสดุ</h1>
        <p className="hero-subtitle">จัดการสต็อกผู้ป่วยใน</p>
      </div>

      <div className="container">
        {/* Month / Tab Selector */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '12px 16px',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          border: '1px solid var(--border, #e5e5e7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📅</span>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #86868b)', fontWeight: '500' }}>รอบนับสต็อกเดือน</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {getTabShortLabel(currentTab)}
              </div>
            </div>
          </div>
          {availableTabs.length > 1 && (
            <select
              value={currentTab}
              onChange={(e) => switchTab(e.target.value)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #d1d1d6)',
                background: 'var(--bg-secondary, #f2f2f7)',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {availableTabs.map((tab) => (
                <option key={tab.title} value={tab.title}>
                  {getTabShortLabel(tab.title)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="menu-grid">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className="menu-item">
              <div className="menu-icon" style={{ background: item.bgColor }}>
                <Icon name={item.icon} size={26} color={item.iconColor} />
              </div>
              <div className="menu-label">{item.title}</div>
            </Link>
          ))}
        </div>

        <div className="card-title">เมนูด่วน</div>
        <div className="quick-actions">
          <Link to="/dashboard" className="quick-action">
            <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Icon name="dashboard" size={22} color="white" />
            </div>
            <div className="quick-action-text">
              <div className="quick-action-title">ภาพรวม</div>
              <div className="quick-action-desc">ดูสถานะคลังวัสดุ</div>
            </div>
            <Icon name="arrowRight" size={20} color="var(--color-text-tertiary)" />
          </Link>

          <Link to="/reports" className="quick-action">
            <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Icon name="reports" size={22} color="white" />
            </div>
            <div className="quick-action-text">
              <div className="quick-action-title">รายงาน</div>
              <div className="quick-action-desc">ดูรายงานและสถิติ</div>
            </div>
            <Icon name="arrowRight" size={20} color="var(--color-text-tertiary)" />
          </Link>

          <Link to="/products" className="quick-action">
            <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Icon name="products" size={22} color="white" />
            </div>
            <div className="quick-action-text">
              <div className="quick-action-title">จัดการสินค้า</div>
              <div className="quick-action-desc">เพิ่ม แก้ไข ลบสินค้า</div>
            </div>
            <Icon name="arrowRight" size={20} color="var(--color-text-tertiary)" />
          </Link>
        </div>
      </div>
    </div>
  )
}
