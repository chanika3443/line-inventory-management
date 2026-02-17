import './SkeletonLoader.css'

export default function SkeletonLoader({ type = 'list', count = 3 }) {
  if (type === 'list') {
    return (
      <div className="skeleton-container">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="skeleton-item">
            <div className="skeleton-content">
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-subtitle"></div>
            </div>
            <div className="skeleton-badge"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton-text skeleton-title" style={{ width: '60%' }}></div>
        <div className="skeleton-text skeleton-subtitle" style={{ width: '80%', marginTop: '12px' }}></div>
        <div className="skeleton-text skeleton-subtitle" style={{ width: '70%' }}></div>
      </div>
    )
  }

  if (type === 'stats') {
    return (
      <div className="skeleton-stats-grid">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-circle"></div>
            <div className="skeleton-text skeleton-title" style={{ width: '50%', margin: '12px auto 0' }}></div>
            <div className="skeleton-text skeleton-subtitle" style={{ width: '70%', margin: '8px auto 0' }}></div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
