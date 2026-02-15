import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import './BottomNav.css'

export default function BottomNav() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <Icon name="home" size={24} />
        <span>หน้าแรก</span>
      </Link>

      <Link to="/withdraw" className={`nav-item ${isActive('/withdraw') ? 'active' : ''}`}>
        <Icon name="withdraw" size={24} />
        <span>เบิก</span>
      </Link>

      <Link to="/return" className={`nav-item ${isActive('/return') ? 'active' : ''}`}>
        <Icon name="return" size={24} />
        <span>คืน</span>
      </Link>

      <Link to="/receive" className={`nav-item ${isActive('/receive') ? 'active' : ''}`}>
        <Icon name="receive" size={24} />
        <span>รับเข้า</span>
      </Link>

      <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') || isActive('/reports') || isActive('/logs') || isActive('/products') ? 'active' : ''}`}>
        <Icon name="dashboard" size={24} />
        <span>อื่นๆ</span>
      </Link>
    </nav>
  )
}
