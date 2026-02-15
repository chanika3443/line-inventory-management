import { memo } from 'react'

function ErrorMessage({ message, onRetry }) {
  if (!message) return null

  return (
    <div className="error-message">
      <div>{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary mt-sm">
          ลองอีกครั้ง
        </button>
      )}
    </div>
  )
}

export default memo(ErrorMessage)
