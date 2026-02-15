import { useState } from 'react'
import { useLiff } from '../contexts/LiffContext'
import './UserMenu.css'

export default function UserMenu() {
  const { isLoggedIn, userName, userProfile, loginMode, login, loginWithManualName, logout } = useLiff()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [manualName, setManualName] = useState('')

  function handleLoginChoice(mode) {
    setShowMenu(false) // ปิด modal ทันที
    if (mode === 'line') {
      login()
    } else {
      setShowLoginModal(true)
    }
  }

  function handleManualLogin() {
    if (loginWithManualName(manualName)) {
      setShowLoginModal(false)
      setManualName('')
      setShowMenu(false) // ปิด modal หลัง login
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <button onClick={() => setShowMenu(true)} className="login-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Login
        </button>

        {showMenu && (
          <>
            <div className="menu-overlay" onClick={() => setShowMenu(false)} />
            <div className="login-modal">
              <h3>เข้าสู่ระบบ</h3>
              <button onClick={() => handleLoginChoice('line')} className="btn-line-login">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>Login with LINE</span>
              </button>
              <div className="login-divider">
                <span>หรือ</span>
              </div>
              <button onClick={() => handleLoginChoice('manual')} className="btn btn-secondary btn-block">
                กรอกชื่อเอง
              </button>
            </div>
          </>
        )}

        {showLoginModal && (
          <>
            <div className="menu-overlay" onClick={() => setShowLoginModal(false)} />
            <div className="login-modal">
              <h3>กรอกชื่อของคุณ</h3>
              <input
                type="text"
                className="input"
                placeholder="ชื่อของคุณ"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualLogin()}
                autoFocus
                style={{ marginBottom: '12px' }}
              />
              <button 
                onClick={handleManualLogin} 
                className="btn btn-primary btn-block"
                disabled={!manualName.trim()}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="user-menu">
      <button 
        className="user-avatar"
        onClick={() => setShowMenu(!showMenu)}
      >
        {loginMode === 'line' && userProfile?.pictureUrl ? (
          <img src={userProfile.pictureUrl} alt={userName} />
        ) : (
          <div className="avatar-placeholder">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <>
          <div className="menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                {userProfile?.pictureUrl ? (
                  <img src={userProfile.pictureUrl} alt={userName} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="dropdown-info">
                <div className="dropdown-name">{userName}</div>
                {userProfile?.statusMessage && (
                  <div className="dropdown-status">{userProfile.statusMessage}</div>
                )}
              </div>
            </div>
            <button 
              type="button"
              className="logout-btn"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Logout button clicked')
                logout()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
