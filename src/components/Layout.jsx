import { Outlet } from 'react-router-dom'
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
                  padding: '0',
                  background: '#06c755',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  height: '56px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  left: 0
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                <span style={{ marginLeft: '40px' }}>Login with LINE</span>
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
