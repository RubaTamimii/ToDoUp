function Confirm({ message, confirmLabel, onConfirm, onCancel, children }) {
  if (message === null || message === undefined) {
    return null;
  }

  const confirmButtonLabel = confirmLabel === undefined || confirmLabel === null || confirmLabel === ''
    ? 'Delete'
    : confirmLabel;

  return (
    <div className="todoup-modal-overlay todoup-modal-overlay-visible">
      <div className="todoup-modal-box" style={{ maxWidth: '420px' }}>
        <div className="todoup-modal-header">
          <h3 className="todoup-modal-title">Are you sure?</h3>
        </div>
        <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 20px' }}>
          {message}
        </p>
        {children}
        <div className="todoup-form-row">
          <button className="todoup-btn todoup-btn-danger" onClick={onConfirm}>
            {confirmButtonLabel}
          </button>
          <button className="todoup-btn todoup-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirm;