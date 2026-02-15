import { memo } from 'react'

function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
    </div>
  )
}

export default memo(Loading)
