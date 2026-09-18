function SettingsModal({ onClose, onClearAll }) {
  return (
    <div className="todoup-modal-overlay todoup-modal-overlay-visible">
      <div className="todoup-modal-box">
        <div className="todoup-modal-header">
          <h3 className="todoup-modal-title">Settings</h3>
          <button className="todoup-modal-close-btn" onClick={onClose}>
            &#x2715;
          </button>
        </div>

        <div className="todoup-form-group">
          <label className="todoup-label">Storage Management</label>

          <button
            className="todoup-btn todoup-btn-warning todoup-btn-sm todoup-btn-block"
            onClick={onClearAll}
          >
            Clear All My Boards
          </button>

          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            Deletes all your boards and lists permanently.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;