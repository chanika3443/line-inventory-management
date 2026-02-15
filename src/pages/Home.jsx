import { Link } from 'react-router-dom'
import { useLiff } from '../contexts/LiffContext'
import Icon from '../components/Icon'
import './Home.css'

export default function Home() {
  const { userName } = useLiff()

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

      <div className="container" style={{ paddingTop: 0 }}>
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
          <Link to="/reports" className="quick-action">
            <div className="quick-action-icon">
              <Icon name="reports" size={22} color="white" />
            </div>
            <div className="quick-action-text">
              <div className="quick-action-title">รายงาน</div>
              <div className="quick-action-desc">ดูรายงานและสถิติ</div>
            </div>
            <Icon name="arrowRight" size={20} color="var(--color-text-tertiary)" />
          </Link>
        </div>
      </div>
    </div>
  )
}
