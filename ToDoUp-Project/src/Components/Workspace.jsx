import { useState } from 'react';

function Workspace({ boards, userName, onCreateBoard, onOpenBoard, onDeleteBoard }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  const reset = () => {
    setCreating(false);
    setTitle('');
  };

  const submit = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    await onCreateBoard(trimmedTitle);
    reset();
  };

  return (
    <div className="todoup-workspace-wrap" id="todoup-workspace-view">
      <div className="todoup-workspace-heading">
        <h2 className="todoup-workspace-title">My Workspace</h2>
        <p className="todoup-workspace-subtitle">
          Welcome back, {userName}. Your boards are private to your account.
        </p>
      </div>

      <div className="todoup-boards-grid" id="todoup-boards-grid">
        {boards.map((board) => {
          const totalCards = board.lists.reduce((sum, list) => sum + list.cards.length, 0);

          return (
            <div
              className="todoup-board-card"
              key={board.id}
              onClick={() => onOpenBoard(board.id)}
            >
              <div className="todoup-board-card-accent"></div>
              <h3 className="todoup-board-card-title">{board.title}</h3>

              <div className="todoup-board-card-stats">
                <span className="todoup-board-stat">{board.lists.length} Lists</span>
                <span className="todoup-board-stat">{totalCards} Cards</span>
              </div>

              <div className="todoup-board-card-actions">
                <button
                  className="todoup-board-action-btn todoup-board-action-open"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBoard(board.id);
                  }}
                >
                  Open
                </button>

                <button
                  className="todoup-board-action-btn todoup-board-action-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBoard(board.id, board.title);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        <div className="todoup-create-card" id="todoup-create-card">
          {!creating ? (
            <div className="todoup-create-trigger" onClick={() => setCreating(true)}>
              <div className="todoup-create-plus">+</div>
              <p className="todoup-create-label">Create New Board</p>
            </div>
          ) : (
            <div className="todoup-create-form-inner todoup-create-form-open">
              <p className="todoup-create-form-heading">New Board</p>

              <input
                type="text"
                className="todoup-input"
                placeholder="Board name…"
                maxLength="80"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submit();
                  }

                  if (e.key === 'Escape') {
                    reset();
                  }
                }}
                autoFocus
              />

              <div className="todoup-create-form-actions">
                <button className="todoup-btn todoup-btn-success todoup-btn-sm" onClick={submit}>
                  Create
                </button>
                <button className="todoup-btn todoup-btn-ghost todoup-btn-sm" onClick={reset}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Workspace;