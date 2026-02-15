import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import BottomNav from './BottomNav'
import UserMenu from './UserMenu'
import { useLiff } from '../contexts/LiffContext'
import Loading from './Loading'
import Icon from './Icon'

export default function Layout() {
  const { isReady, isLoggedIn, login, loginWithManualName } = useLiff()
  const [manualName, setManualName] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const location = useLocation()

  if (!isReady) {
    return <Loading />
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px 30px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Icon name="products" size={40} color="white" />
          </div>
          
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#1d1d1f' }}>
            คลังวัสดุ
          </h1>
          <p style={{ color: '#86868b', marginBottom: '30px', fontSize: '14px' }}>
            จัดการสต็อกผู้ป่วยใน
          </p>

          {!showManualInput ? (
            <>
              <button
                onClick={login}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#06c755',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Icon name="user" size={20} color="white" />
                Login with LINE
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                กรอกชื่อเอง
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="กรอกชื่อของคุณ"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #e5e5e7',
                  borderRadius: '12px',
                  fontSize: '16px',
                  marginBottom: '12px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e7'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && manualName.trim()) {
                    loginWithManualName(manualName)
                  }
                }}
              />
              
              <button
                onClick={() => {
                  if (manualName.trim()) {
                    loginWithManualName(manualName)
                  }
                }}
                disabled={!manualName.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: manualName.trim() ? '#667eea' : '#e5e5e7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: manualName.trim() ? 'pointer' : 'not-allowed',
                  marginBottom: '12px'
                }}
              >
                เข้าสู่ระบบ
              </button>

              <button
                onClick={() => {
                  setShowManualInput(false)
                  setManualName('')
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: '#86868b',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ← กลับ
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <UserMenu />
      <Outlet />
      <BottomNav />
    </>
  )
}
