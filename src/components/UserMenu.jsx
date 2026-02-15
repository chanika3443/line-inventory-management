import { useState } from 'react'
import { useLiff } from '../contexts/LiffContext'
import './UserMenu.css'

export default function UserMenu() {
  const { isLoggedIn, userName, userProfile, login, logout } = useLiff()
  const [showMenu, setShowMenu] = useState(false)

  if (!isLoggedIn) {
    return (
      <button onClick={login} className="login-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Login with LINE
      </button>
    )
  }

  return (
    <div className="user-menu">
      <button 
        className="user-avatar"
        onClick={() => setShowMenu(!showMenu)}
      >
        {userProfile?.pictureUrl ? (
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
              className="logout-btn"
              onClick={() => {
                logout()
                setShowMenu(false)
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
