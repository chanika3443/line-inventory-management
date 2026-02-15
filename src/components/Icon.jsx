import { memo } from 'react'

// SVG Icons Component
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.5 }) {
  const icons = {
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    withdraw: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    receive: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    return: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
      </svg>
    ),
    logs: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M3 3v18h18"/>
        <path d="M18 17V9"/>
        <path d="M13 17V5"/>
        <path d="M8 17v-3"/>
      </svg>
    ),
    products: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    arrowRight: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    )
  }

  return (
    <span style={{ width: size, height: size, display: 'inline-flex' }}>
      {icons[name] || icons.home}
    </span>
  )
}

export default memo(Icon)
