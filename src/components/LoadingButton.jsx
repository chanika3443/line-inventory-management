import './LoadingButton.css'

export default function LoadingButton({ 
  loading, 
  disabled, 
  children, 
  className = '', 
  ...props 
}) {
  return (
    <button 
      className={`loading-button ${className} ${loading ? 'loading' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="loading-spinner">
          <span className="spinner"></span>
        </span>
      )}
      <span className={loading ? 'loading-text' : ''}>{children}</span>
    </button>
  )
}
