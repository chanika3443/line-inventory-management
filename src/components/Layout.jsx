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

  // Reset to login screen when logged out
  if (!isLoggedIn && showManualInput) {
    setShowManualInput(false)
    setManualName('')
  }

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
        background: 'linear-gradient(180deg, #1E3A8A 0%, #3B82F6 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '32px',
          padding: '56px 40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          {/* App Icon with soft shadow */}
          <div style={{
            width: '96px',
            height: '96px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 12px 32px rgba(30, 58, 138, 0.3)'
          }}>
            <Icon name="products" size={48} color="white" />
          </div>
          
          {/* App Name */}
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '700',
            marginBottom: '12px', 
            color: '#1d1d1f',
            letterSpacing: '-0.5px'
          }}>
            คลังวัสดุ
          </h1>
          
          {/* Description */}
          <p style={{ 
            color: '#8e8e93', 
            marginBottom: '48px', 
            fontSize: '16px',
            lineHeight: '1.5',
            fontWeight: '400'
          }}>
            จัดการสต็อกผู้ป่วยใน
          </p>

          {!showManualInput ? (
            <>
              {/* LINE Login Button */}
              <button
                onClick={login}
                style={{
                  width: '100%',
                  padding: '0',
                  background: 'linear-gradient(135deg, #06c755 0%, #00b140 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  height: '60px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 24px rgba(6, 199, 85, 0.25)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  left: 0
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                <span style={{ marginLeft: '40px' }}>Login with LINE</span>
              </button>

              {/* Manual Login Link */}
              <button
                onClick={() => setShowManualInput(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#aeaeb2',
                  fontSize: '15px',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  margin: '0 auto',
                  transition: 'color 0.2s',
                  fontWeight: '400'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3B82F6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#aeaeb2'
                }}
              >
                <span>ลงชื่อเข้าใช้ด้วยชื่อเล่น</span>
                <span style={{ fontSize: '16px' }}>→</span>
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
