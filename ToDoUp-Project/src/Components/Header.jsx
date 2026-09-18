import { useState, useEffect, useRef } from 'react';

function Header({ user, boards, currentBoard, onHome, onOpenBoard, onSettings, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef(null);

  // Close the menu when user clicks anywhere else on the page
  useEffect(() => {
    const closeMenu = () => {
      setMenuOpen(false);
    };

    document.addEventListener('click', closeMenu);

    return () => {
      document.removeEventListener('click', closeMenu);
    };
  }, []);

  const firstName = user.firstName || user.username || 'User';
  const initial = (firstName[0] || 'U').toUpperCase();

  const Avatar = () => {
    if (user.imageUrl) {
      return <img src={user.imageUrl} className="todoup-user-avatar" alt="" />;
    }

    return <div className="todoup-user-avatar">{initial}</div>;
  };

  return (
    <header className="todoup-header">
      <div className="todoup-header-left">
        <h1 className="todoup-header-logo" id="todoup-home-link" onClick={onHome}>
          ToDoUp
        </h1>

        <nav className="todoup-breadcrumb">
          {currentBoard && (
            <>
              <span className="todoup-breadcrumb-link" onClick={onHome}>
                Workspace
              </span>
              <span className="todoup-breadcrumb-sep">/</span>
              <span className="todoup-breadcrumb-current">{currentBoard.title}</span>
            </>
          )}
        </nav>
      </div>

      <div className="todoup-header-right">
        <div className="todoup-user-chip">
          <Avatar />
          <span className="todoup-user-name">{firstName}</span>
        </div>

        <div className="todoup-burger" ref={burgerRef} onClick={(e) => e.stopPropagation()}>
          <div className="todoup-burger-btn" onClick={() => setMenuOpen((v) => !v)}>
            &#9776;
          </div>

          <div
            className={
              'todoup-burger-dropdown' + (menuOpen ? ' todoup-burger-dropdown-open' : '')
            }
          >
            <div className="todoup-menu-item todoup-menu-item-header">
              <Avatar /> {firstName}
            </div>

            {boards.map((b) => (
              <div
                key={b.id}
                className="todoup-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenBoard(b.id);
                }}
              >
                {b.title}
              </div>
            ))}

            <div
              className="todoup-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onSettings();
              }}
            >
              &#9881; Settings
            </div>

            <div
              className="todoup-menu-item todoup-menu-item-danger"
              onClick={() => {
                setMenuOpen(false);
                onSignOut();
              }}
            >
              Sign Out
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;