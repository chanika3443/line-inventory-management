import { useEffect, useState } from 'react'
import './StockAlert.css'

export default function StockAlert({ product, onClose }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!show) return null

  return (
    <div className="stock-alert">
      <button className="stock-alert-close" onClick={handleClose}>
        ×
      </button>
      
      <div className="stock-alert-header">
        <span className="stock-alert-icon">⚠️</span>
        <h3 className="stock-alert-title">สต็อกใกล้หมด!</h3>
      </div>
      
      <p className="stock-alert-message">
        {product.name} เหลือเพียง {product.quantity} {product.unit}
        {product.quantity === 0 && ' (หมดแล้ว!)'}
      </p>
    </div>
  )
}
