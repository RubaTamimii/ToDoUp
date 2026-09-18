const BASE_URL = import.meta.env.VITE_API_URL || '';

// يضيف الهيدرز للكل
function headers(userId) {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
}

export const api = {

  async getBoards(userId) {
    const res = await fetch(`${BASE_URL}/boards`, {
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to load boards');
    }

    return res.json();
  },

  async getBoard(userId, id) {
    const res = await fetch(`${BASE_URL}/boards/${id}`, {
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Board not found');
    }

    return res.json();
  },

  async createBoard(userId, title) {
    const res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: headers(userId),
      body: JSON.stringify({ title: title }),
    });

    if (!res.ok) {
      throw new Error('Failed to create board');
    }

    return res.json();
  },

  async deleteBoard(userId, id) {
    const res = await fetch(`${BASE_URL}/boards/${id}`, {
      method: 'DELETE',
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to delete board');
    }
  },

  async createList(userId, boardId, title) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists`, {
      method: 'POST',
      headers: headers(userId),
      body: JSON.stringify({ title: title }),
    });

    if (!res.ok) {
      throw new Error('Failed to create list');
    }

    return res.json();
  },

  async deleteList(userId, boardId, listId) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/${listId}`, {
      method: 'DELETE',
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to delete list');
    }
  },

  async createCard(userId, boardId, listId, title, description) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/${listId}/cards`, {
      method: 'POST',
      headers: headers(userId),
      body: JSON.stringify({
        title: title,
        description: description || '',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create card');
    }

    return res.json();
  },

  async updateCard(userId, boardId, listId, cardId, title, description) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/${listId}/cards/${cardId}`, {
      method: 'PUT',
      headers: headers(userId),
      body: JSON.stringify({
        title: title,
        description: description || '',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update card');
    }

    return res.json();
  },

  async deleteCard(userId, boardId, listId, cardId) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/${listId}/cards/${cardId}`, {
      method: 'DELETE',
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to delete card');
    }
  },

  async moveCard(userId, boardId, sourceListId, cardId, targetListId) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/lists/${sourceListId}/cards/${cardId}/move`, {
      method: 'POST',
      headers: headers(userId),
      body: JSON.stringify({ targetListId: targetListId }),
    });

    if (!res.ok) {
      throw new Error('Failed to move card');
    }

    return res.json();
  },

  async getMembers(userId, boardId) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/members`, {
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to load members');
    }

    return res.json();
  },

  async inviteMember(userId, boardId, email) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/members`, {
      method: 'POST',
      headers: headers(userId),
      body: JSON.stringify({ email: email }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to invite member');
    }

    return res.json();
  },

  async removeMember(userId, boardId, memberUserId) {
    const res = await fetch(`${BASE_URL}/boards/${boardId}/members/${memberUserId}`, {
      method: 'DELETE',
      headers: headers(userId),
    });

    if (!res.ok) {
      throw new Error('Failed to remove member');
    }

    return res.json();
  },
};