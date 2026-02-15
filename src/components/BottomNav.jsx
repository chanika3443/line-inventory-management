import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import './BottomNav.css'

export default function BottomNav() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleNavClick = (e, path) => {
    if (isActive(path)) {
      e.preventDefault()
      window.location.reload()
    }
  }

  return (
    <nav className="bottom-nav">
      <Link 
        to="/" 
        className={`nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={(e) => handleNavClick(e, '/')}
      >
        <Icon name="home" size={24} />
        <span>หน้าแรก</span>
      </Link>

      <Link 
        to="/withdraw" 
        className={`nav-item ${isActive('/withdraw') ? 'active' : ''}`}
        onClick={(e) => handleNavClick(e, '/withdraw')}
      >
        <Icon name="withdraw" size={24} />
        <span>เบิก</span>
      </Link>

      <Link 
        to="/return" 
        className={`nav-item ${isActive('/return') ? 'active' : ''}`}
        onClick={(e) => handleNavClick(e, '/return')}
      >
        <Icon name="return" size={24} />
        <span>คืน</span>
      </Link>

      <Link 
        to="/receive" 
        className={`nav-item ${isActive('/receive') ? 'active' : ''}`}
        onClick={(e) => handleNavClick(e, '/receive')}
      >
        <Icon name="receive" size={24} />
        <span>รับเข้า</span>
      </Link>

      <Link 
        to="/logs" 
        className={`nav-item ${isActive('/logs') ? 'active' : ''}`}
        onClick={(e) => handleNavClick(e, '/logs')}
      >
        <Icon name="logs" size={24} />
        <span>ประวัติ</span>
      </Link>
    </nav>
  )
}
