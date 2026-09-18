function Card({ card, onClick, onDragStart, onDragEnd }) { 
  return (
    <div
      className="todoup-card"
      draggable
      onDragStart={() => onDragStart(card)} 
      onDragEnd={onDragEnd} 
      onClick={() => onClick(card)}
    >
      <h4 className="todoup-card-title">{card.title}</h4>
      <p className="todoup-card-description">{card.description || ''}</p>

      <div className="todoup-card-footer">
        <button
          className="todoup-card-edit-btn"
          title="Edit card"
          onClick={(e) => {
            e.stopPropagation();
            onClick(card);
          }}
        >
          &#x270E;
        </button>
      </div>
    </div>
  );
}

export default Card;