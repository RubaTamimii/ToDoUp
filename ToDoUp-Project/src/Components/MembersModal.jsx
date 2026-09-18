import { useState } from 'react';

function MembersModal({ board, members, currentUserId, onInvite, onRemove, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function submitInvite(e) {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (trimmedEmail === '') {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onInvite(trimmedEmail);
      setEmail('');
    } catch (err) {
      setError(err.message);
    }

    setSending(false);
  }

  return (
    <div className="todoup-modal-overlay todoup-modal-overlay-visible">
      <div className="todoup-modal-box" style={{ maxWidth: '420px' }}>
        <div className="todoup-modal-header">
          <h3 className="todoup-modal-title">Share "{board.title}"</h3>
        </div>

        <form onSubmit={submitInvite} style={{ marginBottom: '16px' }}>
          <div className="todoup-form-row">
            <input
              type="email"
              className="todoup-input"
              placeholder="Invite by email…"
              value={email}
              onChange={function (e) {
                setEmail(e.target.value);
              }}
            />
            <button type="submit" className="todoup-btn todoup-btn-success todoup-btn-sm" disabled={sending}>
              {sending === true ? 'Inviting…' : 'Invite'}
            </button>
          </div>

          {error !== null ? (
            <p style={{ fontSize: '13px', color: '#ef4444', margin: '8px 0 0' }}>{error}</p>
          ) : null}
        </form>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>
            Members ({members.length})
          </p>

          {members.map(function (memberId) {
            return (
              <div
                key={memberId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: '14px',
                  color: '#334155',
                }}
              >
                <span>
                  {memberId}
                  {memberId === board.ownerId ? ' (owner)' : ''}
                </span>

                {memberId !== board.ownerId ? (
                  <button
                    className="todoup-btn todoup-btn-ghost todoup-btn-sm"
                    onClick={function () {
                      onRemove(memberId);
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="todoup-form-row">
          <button className="todoup-btn todoup-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MembersModal;