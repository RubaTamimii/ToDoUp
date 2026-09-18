import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

import Header from '../Components/Header';
import Workspace from '../Components/Workspace';
import Board from '../Components/Board';
import EditCardModal from '../Components/EditCardModal';
import SettingsModal from '../Components/SettingsModal';
import Confirm from '../Components/Confirm';
import MembersModal from '../Components/MembersModal';
import { api } from '../Services/api';

function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (isLoaded === false) {
      return;
    }

    if (user === null || user === undefined) {
      navigate('/');
      return;
    }

    loadBoards();
  }, [isLoaded, user]);

  useEffect(() => {
    if (error === null) {
      return;
    }

    const timeoutId = setTimeout(function () {
      setError(null);
    }, 4000);

    return function () {
      clearTimeout(timeoutId);
    };
  }, [error]);

  function askConfirm(message) {
    return new Promise(function (resolve) {
      setConfirmState({
        message: message,
        resolve: resolve,
      });
    });
  }

  function askListDeleteChoice(list, otherLists) {
    return new Promise(function (resolve) {
      const defaultAction = list.cards.length > 0 && otherLists.length > 0 ? 'move' : 'delete';
      const defaultTargetListId = otherLists.length > 0 ? otherLists[0].id : null;

      setConfirmState({
        message: 'Delete "' + list.title + '"?',
        resolve: resolve,
        list: list,
        otherLists: otherLists,
        action: defaultAction,
        targetListId: defaultTargetListId,
      });
    });
  }

  function handleConfirmYes() {
    if (confirmState === null) {
      return;
    }

    if (confirmState.list !== undefined) {
      confirmState.resolve({ action: confirmState.action, targetListId: confirmState.targetListId });
    } else {
      confirmState.resolve(true);
    }

    setConfirmState(null);
  }

  function handleConfirmNo() {
    if (confirmState === null) {
      return;
    }

    if (confirmState.list !== undefined) {
      confirmState.resolve(null);
    } else {
      confirmState.resolve(false);
    }

    setConfirmState(null);
  }

  async function loadBoards() {
    setLoading(true);

    try {
      const data = await api.getBoards(user.id);
      setBoards(data);
    } catch (e) {
      setBoards([]);
      setError('Could not load boards from server.');
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setCurrentBoard(null);
  }

  async function openBoard(boardId) {
    try {
      const board = await api.getBoard(user.id, boardId);
      setCurrentBoard(board);
    } catch (e) {
      setError('Could not load board.');
    }
  }

  async function createBoard(title) {
    try {
      const board = await api.createBoard(user.id, title);
      setBoards(function (prev) {
        return [...prev, board];
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteBoard(id, title) {
    const confirmed = await askConfirm('Delete "' + title + '" and all its content?');

    if (confirmed === false) {
      return;
    }

    try {
      await api.deleteBoard(user.id, id);

      setBoards(function (prev) {
        return prev.filter(function (b) {
          return b.id !== id;
        });
      });

      if (currentBoard !== null && currentBoard.id === id) {
        setCurrentBoard(null);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function addList(title) {
    if (currentBoard === null) {
      return;
    }

    try {
      const list = await api.createList(user.id, currentBoard.id, title);

      setCurrentBoard(function (prev) {
        return { ...prev, lists: [...prev.lists, list] };
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteList(listId) {
    if (currentBoard === null) {
      return;
    }

    const list = currentBoard.lists.find(function (l) {
      return l.id === listId;
    });

    if (list === undefined) {
      return;
    }

    const otherLists = currentBoard.lists.filter(function (l) {
      return l.id !== listId;
    });

    const choice = await askListDeleteChoice(list, otherLists);

    if (choice === null) {
      return;
    }

    try {
      if (choice.action === 'move' && choice.targetListId !== null) {
        for (const card of list.cards) {
          await api.moveCard(user.id, currentBoard.id, list.id, card.id, choice.targetListId);
        }
      }

      await api.deleteList(user.id, currentBoard.id, listId);

      setCurrentBoard(function (prev) {
        const remainingLists = prev.lists.filter(function (l) {
          return l.id !== listId;
        });

        if (choice.action === 'move' && choice.targetListId !== null) {
          const updatedLists = remainingLists.map(function (l) {
            if (l.id === choice.targetListId) {
              return { ...l, cards: [...l.cards, ...list.cards] };
            }

            return l;
          });

          return { ...prev, lists: updatedLists };
        }

        return { ...prev, lists: remainingLists };
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function addCard(listId, title, description) {
    if (currentBoard === null) {
      return;
    }

    try {
      const card = await api.createCard(user.id, currentBoard.id, listId, title, description);

      setCurrentBoard(function (prev) {
        return {
          ...prev,
          lists: prev.lists.map(function (l) {
            if (l.id === listId) {
              return { ...l, cards: [...l.cards, card] };
            }

            return l;
          }),
        };
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function moveCard(sourceListId, card, targetListId) {
    if (currentBoard === null) {
      return;
    }

    const previousBoard = currentBoard;

    setCurrentBoard(function (prev) {
      return {
        ...prev,
        lists: prev.lists.map(function (l) {
          if (l.id === sourceListId) {
            return {
              ...l,
              cards: l.cards.filter(function (c) {
                return c.id !== card.id;
              }),
            };
          }

          if (l.id === targetListId) {
            return { ...l, cards: [...l.cards, card] };
          }

          return l;
        }),
      };
    });

    try {
      await api.moveCard(user.id, currentBoard.id, sourceListId, card.id, targetListId);
    } catch (e) {
      setCurrentBoard(previousBoard);
      setError('Could not move card: ' + e.message);
    }
  }

  async function saveCard(title, description) {
    if (editingCard === null || currentBoard === null) {
      return;
    }

    const card = editingCard.card;
    const listId = editingCard.listId;

    try {
      const updated = await api.updateCard(
        user.id,
        currentBoard.id,
        listId,
        card.id,
        title,
        description
      );

      setCurrentBoard(function (prev) {
        return {
          ...prev,
          lists: prev.lists.map(function (l) {
            if (l.id === listId) {
              return {
                ...l,
                cards: l.cards.map(function (c) {
                  if (c.id === card.id) {
                    return updated;
                  }

                  return c;
                }),
              };
            }

            return l;
          }),
        };
      });

      setEditingCard(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteCard() {
    if (editingCard === null || currentBoard === null) {
      return;
    }

    const card = editingCard.card;
    const listId = editingCard.listId;

    const confirmed = await askConfirm('Delete card "' + card.title + '"?');

    if (confirmed === false) {
      return;
    }

    try {
      await api.deleteCard(user.id, currentBoard.id, listId, card.id);

      setCurrentBoard(function (prev) {
        return {
          ...prev,
          lists: prev.lists.map(function (l) {
            if (l.id === listId) {
              return {
                ...l,
                cards: l.cards.filter(function (c) {
                  return c.id !== card.id;
                }),
              };
            }

            return l;
          }),
        };
      });

      setEditingCard(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function clearAllBoards() {
    const confirmed = await askConfirm('Delete ALL your boards and lists?');

    if (confirmed === false) {
      return;
    }

    for (const b of boards) {
      try {
        await api.deleteBoard(user.id, b.id);
      } catch (e) {
        continue;
      }
    }

    setShowSettings(false);
    setCurrentBoard(null);
    await loadBoards();
  }

  async function openMembers() {
    if (currentBoard === null) {
      return;
    }

    try {
      const data = await api.getMembers(user.id, currentBoard.id);
      setMembers(data);
      setShowMembers(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function inviteMember(email) {
    if (currentBoard === null) {
      return;
    }

    const updated = await api.inviteMember(user.id, currentBoard.id, email);
    setMembers(updated);
  }

  async function removeMember(memberUserId) {
    if (currentBoard === null) {
      return;
    }

    try {
      const updated = await api.removeMember(user.id, currentBoard.id, memberUserId);
      setMembers(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleSignOut() {
    signOut(function () {
      navigate('/');
    });
  }

  if (isLoaded === false || loading === true) {
    return (
      <div id="app-loading" className="todoup-loading-screen">
        <div className="todoup-loading-spinner"></div>
        <span>Loading your workspace…</span>
      </div>
    );
  }

  return (
    <div id="todoup-root" className="todoup-root" style={{ display: 'block' }}>
      <Header
        user={user}
        boards={boards}
        currentBoard={currentBoard}
        onHome={goHome}
        onOpenBoard={openBoard}
        onSettings={function () {
          setShowSettings(true);
        }}
        onSignOut={handleSignOut}
      />

      <main className="todoup-main">
        {currentBoard !== null ? (
          <Board
            board={currentBoard}
            onAddList={addList}
            onDeleteList={deleteList}
            onCardClick={function (card, listId) {
              setEditingCard({ card: card, listId: listId });
            }}
            onAddCard={addCard}
            onMoveCard={moveCard}
            onShareClick={openMembers}
          />
        ) : (
          <Workspace
            boards={boards}
            userName={user.firstName || user.username || 'there'}
            onCreateBoard={createBoard}
            onOpenBoard={openBoard}
            onDeleteBoard={deleteBoard}
          />
        )}
      </main>

      {editingCard !== null && (
        <EditCardModal
          card={editingCard.card}
          onSave={saveCard}
          onDelete={deleteCard}
          onClose={function () {
            setEditingCard(null);
          }}
        />
      )}

      {showSettings === true && (
        <SettingsModal
          onClose={function () {
            setShowSettings(false);
          }}
          onClearAll={clearAllBoards}
        />
      )}

      {showMembers === true && currentBoard !== null && (
        <MembersModal
          board={currentBoard}
          members={members}
          currentUserId={user.id}
          onInvite={inviteMember}
          onRemove={removeMember}
          onClose={function () {
            setShowMembers(false);
          }}
        />
      )}

      {confirmState !== null && (
        <Confirm
          message={confirmState.message}
          confirmLabel={confirmState.list !== undefined && confirmState.action === 'move' ? 'Move & Delete' : undefined}
          onConfirm={handleConfirmYes}
          onCancel={handleConfirmNo}
        >
          {confirmState.list !== undefined && confirmState.list.cards.length > 0 ? (
            <div style={{ margin: '0 0 20px' }}>
              {confirmState.otherLists.length > 0 ? (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#334155',
                    marginBottom: '10px',
                  }}
                >
                  <input
                    type="radio"
                    name="todoup-delete-list-action"
                    checked={confirmState.action === 'move'}
                    onChange={function () {
                      setConfirmState(function (prev) {
                        return { ...prev, action: 'move' };
                      });
                    }}
                  />
                  Move all cards to another list
                </label>
              ) : null}

              {confirmState.action === 'move' && confirmState.otherLists.length > 0 ? (
                <select
                  className="todoup-input"
                  style={{ marginBottom: '14px' }}
                  value={confirmState.targetListId === null ? '' : confirmState.targetListId}
                  onChange={function (e) {
                    const newTargetListId = e.target.value;

                    setConfirmState(function (prev) {
                      return { ...prev, targetListId: newTargetListId };
                    });
                  }}
                >
                  {confirmState.otherLists.map(function (l) {
                    return (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    );
                  })}
                </select>
              ) : null}

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}
              >
                <input
                  type="radio"
                  name="todoup-delete-list-action"
                  checked={confirmState.action === 'delete'}
                  onChange={function () {
                    setConfirmState(function (prev) {
                      return { ...prev, action: 'delete' };
                    });
                  }}
                />
                Delete all cards
              </label>
            </div>
          ) : null}
        </Confirm>
      )}

      {error !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            background: '#ef4444',
            color: '#fff',
            padding: '.6rem 1rem',
            borderRadius: '.5rem',
            fontSize: '.85rem',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,.2)',
          }}
        >
          error {error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;