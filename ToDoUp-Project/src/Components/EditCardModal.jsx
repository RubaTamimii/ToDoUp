import { useState, useEffect } from 'react';

function EditCardModal({ card, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fill the form when the selected card changes
  useEffect(function () { 
    if (card === null || card === undefined) {
      return;
    }

    setTitle(card.title); 

    const cardDescription =
      card.description === undefined || card.description === null ? '' : card.description;

    setDescription(cardDescription);
  }, [card]);

  if (card === null || card === undefined) {
    return null;
  }

  function handleSave() {
    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      return;
    }

    onSave(trimmedTitle, description.trim());
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
  }

  function handleDescriptionChange(e) {
    setDescription(e.target.value);
  }

  return (
    <div className="todoup-modal-overlay todoup-modal-overlay-visible">
      <div className="todoup-modal-box">
        <div className="todoup-modal-header">
          <h3 className="todoup-modal-title">Edit Card</h3>
          <button className="todoup-modal-close-btn" onClick={onClose}>
            &#x2715;
          </button>
        </div>

        <div className="todoup-form-group">
          <label className="todoup-label" htmlFor="todoup-card-title">
            Card Title
          </label>
          <input
            type="text"
            id="todoup-card-title"
            className="todoup-input"
            value={title}
            onChange={handleTitleChange}
            autoFocus
          />
        </div>

        <div className="todoup-form-group">
          <label className="todoup-label" htmlFor="todoup-card-description">
            Description
          </label>
          <textarea
            id="todoup-card-description"
            className="todoup-textarea"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className="todoup-form-row">
          <button className="todoup-btn todoup-btn-success" onClick={handleSave}>
            Save
          </button>
          <button className="todoup-btn todoup-btn-danger" onClick={onDelete}>
            Delete
          </button>
          <button className="todoup-btn todoup-btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditCardModal;