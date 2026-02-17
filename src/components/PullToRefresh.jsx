import './PullToRefresh.css'

export default function PullToRefresh({ pullDistance }) {
  const isTriggered = pullDistance > 80
  const opacity = Math.min(pullDistance / 80, 1)
  const rotation = (pullDistance / 80) * 360

  return (
    <div 
      className="pull-to-refresh-indicator"
      style={{
        opacity: opacity,
        transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
        pointerEvents: 'none'
      }}
    >
      <div 
        className={`refresh-spinner ${isTriggered ? 'triggered' : ''}`}
        style={{
          transform: `rotate(${rotation}deg)`
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      </div>
      <div className="refresh-text">
        {isTriggered ? 'ปล่อยเพื่อรีเฟรช' : 'ดึงลงเพื่อรีเฟรช'}
      </div>
    </div>
  )
}
