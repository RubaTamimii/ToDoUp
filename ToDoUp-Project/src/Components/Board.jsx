import { useState } from 'react';
import Card from './Card';

function Board({ board, onAddList, onDeleteList, onCardClick, onAddCard, onMoveCard, onShareClick }) {
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);

  const [addCardListId, setAddCardListId] = useState(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');

  const [showAddList, setShowAddList] = useState(false);
  const [listTitle, setListTitle] = useState('');

  const handleDrop = (e, targetListId) => {
    e.preventDefault();
    setDragOverListId(null);

    if (!draggedCard || draggedCard.listId === targetListId) {
      return;
    }

    onMoveCard(draggedCard.listId, draggedCard.card, targetListId);
    setDraggedCard(null);
  };

  const resetAddCard = () => {
    setAddCardListId(null);
    setCardTitle('');
    setCardDesc('');
  };

  const submitAddCard = async (listId) => {
    const title = cardTitle.trim();

    if (!title) {
      return;
    }

    await onAddCard(listId, title, cardDesc.trim());
    resetAddCard();
  };

  const resetAddList = () => {
    setShowAddList(false);
    setListTitle('');
  };

  const submitAddList = async (e) => {
    e.preventDefault();

    const title = listTitle.trim();

    if (!title) {
      return;
    }

    await onAddList(title);
    resetAddList();
  };

  return (
    <div className="todoup-board-view todoup-board-view-visible">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 10px' }}>
        <button className="todoup-btn todoup-btn-ghost todoup-btn-sm" onClick={onShareClick}>
          Share
        </button>
      </div>

      <div className="todoup-lists-row" id="todoup-lists-container">
        {board.lists.map((list) => (
          <div className="todoup-list" key={list.id} data-list-id={list.id}>
            <div className="todoup-list-header">
              <h3 className="todoup-list-title">{list.title}</h3>
              <span className="todoup-list-count">{list.cards.length}</span>
              <button
                className="todoup-list-delete-btn"
                title="Delete list"
                onClick={() => onDeleteList(list.id)}
              >
                &#x2715;
              </button>
            </div>

            <div
              className={
                'todoup-cards-container' +
                (dragOverListId === list.id ? ' todoup-cards-container-dragover' : '')
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverListId(list.id);
              }}
              onDragLeave={() => setDragOverListId(null)}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              {list.cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={(c) => onCardClick(c, list.id)}
                  onDragStart={(c) => setDraggedCard({ card: c, listId: list.id })}
                  onDragEnd={() => setDraggedCard(null)}
                />
              ))}
            </div>

            {addCardListId === list.id ? (
              <div className="todoup-add-card-form todoup-add-card-form-visible">
                <input
                  type="text"
                  className="todoup-input"
                  placeholder="Card title…"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitAddCard(list.id);
                    }

                    if (e.key === 'Escape') {
                      resetAddCard();
                    }
                  }}
                  autoFocus
                />

                <textarea
                  className="todoup-textarea"
                  placeholder="Description (optional)…"
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                />

                <div className="todoup-form-row">
                  <button
                    className="todoup-btn todoup-btn-success todoup-btn-sm"
                    onClick={() => submitAddCard(list.id)}
                  >
                    Add
                  </button>
                  <button
                    className="todoup-btn todoup-btn-ghost todoup-btn-sm"
                    onClick={resetAddCard}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="todoup-btn todoup-btn-ghost todoup-btn-sm todoup-btn-block"
                onClick={() => setAddCardListId(list.id)}
              >
                + Add Card
              </button>
            )}
          </div>
        ))}

        <div className="todoup-add-list-column">
          {!showAddList ? (
            <div className="todoup-add-list-btn" onClick={() => setShowAddList(true)}>
              + Add List
            </div>
          ) : (
            <form
              className="todoup-add-list-form todoup-add-list-form-visible"
              onSubmit={submitAddList}
            >
              <input
                type="text"
                className="todoup-input"
                placeholder="List title…"
                required
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                autoFocus
              />

              <div className="todoup-form-row">
                <button type="submit" className="todoup-btn todoup-btn-success todoup-btn-sm">
                  Add
                </button>
                <button
                  type="button"
                  className="todoup-btn todoup-btn-ghost todoup-btn-sm"
                  onClick={resetAddList}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Board;