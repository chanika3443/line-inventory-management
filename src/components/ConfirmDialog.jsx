import './ConfirmDialog.css'

export default function ConfirmDialog({ 
  show, 
  title, 
  message, 
  confirmText = 'ยืนยัน', 
  cancelText = 'ยกเลิก',
  confirmStyle = 'danger', // 'danger' | 'primary'
  onConfirm, 
  onCancel,
  requireInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange
}) {
  if (!show) return null

  const handleConfirm = () => {
    if (requireInput && !inputValue) return
    onConfirm()
  }

  const handleCancel = () => {
    onCancel()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="confirm-dialog-overlay" onClick={handleCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p>{message}</p>
          
          {requireInput && (
            <input
              type="text"
              className="confirm-dialog-input"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              autoFocus
            />
          )}
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="btn btn-outline"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${confirmStyle === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
            disabled={requireInput && !inputValue}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
