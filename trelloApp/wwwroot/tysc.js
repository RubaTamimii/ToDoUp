//  USER ACCOUNT SCRIPT



// MANAGEMENT APP SCRIPT





(function () {

    let _userId = null;   // set once Clerk loads

    function headers() {
        return {
            'Content-Type': 'application/json',
            'X-User-Id': _userId          // who make request
        };
    }

    const API = {
        async getBoards() {
            const res = await fetch('/boards', { headers: headers() });
            if (!res.ok) {
                throw new Error('Failed to load boards');
            }

            return res.json();
        },
        async getBoard(id) {
            const res = await fetch(`/boards/${id}`, { headers: headers() });
            if (!res.ok) {
                throw new Error('Board not found');
            }

            return res.json();
        },
        async createBoard(title) {
            const res = await fetch('/boards', {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ title })
            });
            if (!res.ok) {
                throw new Error('Failed to create board');
            }

            return res.json();
        },
        async deleteBoard(id) {
            const res = await fetch(`/boards/${id}`, { method: 'DELETE', headers: headers() });
            if (!res.ok) {
                throw new Error('Failed to delete board');
            }

        },
        async createList(boardId, title) {
            const res = await fetch(`/boards/${boardId}/lists`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ title })
            });
            if (!res.ok) {
                throw new Error('Failed to create list');
            }

            return res.json();
        },
        async deleteList(boardId, listId) {
            const res = await fetch(`/boards/${boardId}/lists/${listId}`, { method: 'DELETE', headers: headers() });
            if (!res.ok) {
                throw new Error('Failed to delete list');
            }

        },
        async createCard(boardId, listId, title, description) {
            const res = await fetch(`/boards/${boardId}/lists/${listId}/cards`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ title, description: description || '' })
            });
            if (!res.ok) {
                throw new Error('Failed to create card');
            }

            return res.json();
        },

        async updateCard(boardId, listId, cardId, title, description) {
            const res = await fetch(`/boards/${boardId}/lists/${listId}/cards/${cardId}`, {
                method: 'PUT', headers: headers(),
                body: JSON.stringify({ title, description: description || '' })
            });

            if (!res.ok) {
                throw new Error('Failed to update card');
            }
            return res.json();
        },

        async deleteCard(boardId, listId, cardId) {
            const res = await fetch(`/boards/${boardId}/lists/${listId}/cards/${cardId}`, {
                method: 'DELETE', headers: headers()
            });
            if (!res.ok) {
                throw new Error('Failed to delete card');
            }
        },

        // call using/move endpoint
        async moveCard(boardId, sourceListId, cardId, targetListId) {
            const res = await fetch(`/boards/${boardId}/lists/${sourceListId}/cards/${cardId}/move`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ targetListId })
            });

            if (!res.ok) {
                throw new Error('Failed to move card');
            }

            return res.json();
        }
    };

    window.addEventListener('load', async function () {
        await Clerk.load();

        if (!Clerk.user) {
            window.location.href = 'UserAccount.html';
            return;
        }

        // store clerk user id , to separate workspaces
        _userId = Clerk.user.id;

        document.getElementById('app-loading').style.display = 'none';
        document.getElementById('todoup-root').style.display = 'block';

        new ToDoUpApp(Clerk.user);
    });

    class ToDoUpApp {

        constructor(clerkUser) {
            this.user = clerkUser;
            this.boards = [];
            this.currentBoard = null;
            this.draggedCard = null;
            this.editingCard = null;
            this.init();
        }

        // extract
        q(id) {
            return document.getElementById(id);
        }

        // XSS  
        esc(text) {
            const d = document.createElement('div');
            d.textContent = text || '';
            return d.innerHTML;
        }

        showError(msg) {
            const t = document.createElement('div');
            t.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:#ef4444;color:#fff;padding:.6rem 1rem;border-radius:.5rem;font-size:.85rem;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,.2);';
            t.textContent = 'error ' + msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 4000);
        }

        async init() {
            this.renderHeaderActions();
            this.attachGlobalListeners();
            this.initSettingsModal();
            await this.showWorkspace();
        }

        //  HEADER
        renderHeaderActions() {
            const container = this.q('todoup-header-actions');
            const user = this.user;
            const firstName = user.firstName || user.username || 'User';
            const initial = firstName[0].toUpperCase();

            const avatarHTML = user.imageUrl
                ? `<img src="${user.imageUrl}" class="todoup-user-avatar" />`
                : `<div class="todoup-user-avatar">${initial}</div>`;

            const addListBtnHTML = this.currentBoard
                ? `<button class="todoup-btn todoup-btn-primary todoup-btn-sm" id="hdr-add-list">+ Add List</button>`
                : '';

            const boardItemsHTML = this.boards.map(b =>
                `<div class="todoup-menu-item" data-board-id="${b.id}">${this.esc(b.title)}</div>`
            ).join('');

            container.innerHTML = `${addListBtnHTML}
                        <div class="todoup-user-chip">
                            ${avatarHTML}<span class="todoup-user-name">${this.esc(firstName)}</span>
                        </div>
                        <div class="todoup-burger">
                            <div class="todoup-burger-btn" id="todoup-burger-btn">&#9776;</div>
                            <div class="todoup-burger-dropdown" id="todoup-burger-dropdown">
                                <div class="todoup-menu-item todoup-menu-item-header">${avatarHTML} ${this.esc(firstName)}</div>
                                ${boardItemsHTML}
                                <div class="todoup-menu-item" id="todoup-menu-settings">&#9881; Settings</div>
                                <div class="todoup-menu-item todoup-menu-item-danger" id="todoup-menu-logout">Sign Out</div>
                            </div>
                        </div>`;

            this.initBurgerMenu();

            const addListBtn = this.q('hdr-add-list');
            if (addListBtn) {
                addListBtn.addEventListener('click', () => this.showAddListForm());
            }
        }

        initBurgerMenu() {
            const btn = this.q('todoup-burger-btn');
            const dropdown = this.q('todoup-burger-dropdown');

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('todoup-burger-dropdown-open');
            });

            document.addEventListener('click', () =>
                dropdown.classList.remove('todoup-burger-dropdown-open'));

            dropdown.querySelectorAll('[data-board-id]').forEach(item => {
                item.addEventListener('click', () => {
                    dropdown.classList.remove('todoup-burger-dropdown-open');
                    this.showBoard(item.getAttribute('data-board-id'));
                });
            });

            const settingsBtn = this.q('todoup-menu-settings');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    dropdown.classList.remove('todoup-burger-dropdown-open');
                    this.openSettingsModal();

                });
            }
            const logoutBtn = this.q('todoup-menu-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () =>
                    Clerk.signOut().then(() => { window.location.href = 'UserAccount.html'; }));
            }
        }
        initSettingsModal() {
            const closeBtn = this.q('todoup-close-settings-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () =>
                    this.q('todoup-settings-modal').classList.remove('todoup-modal-overlay-visible'));
            }
            const clearBtn = this.q('todoup-clear-data-btn');
            if (clearBtn) clearBtn.addEventListener('click', async () => {
                if (!confirm('Delete ALL your boards and lists?')) {
                    return;
                }

                const ids = this.boards.map(b => b.id);
                for (const id of ids) {
                    try {
                        await API.deleteBoard(id);
                    }
                    catch (_) {

                    }
                }

                this.q('todoup-settings-modal').classList.remove('todoup-modal-overlay-visible');
                await this.showWorkspace();
            });
        }

        openSettingsModal() {
            this.q('todoup-settings-modal').classList.add('todoup-modal-overlay-visible');
        }

        //  GLOBAL LISTENERS
        attachGlobalListeners() {
            const homeLink = this.q('todoup-home-link');
            if (homeLink) {
                homeLink.addEventListener('click', () => this.showWorkspace());
            }

            const createTrigger = this.q('todoup-create-trigger');
            if (createTrigger) {
                createTrigger.addEventListener('click', () => {
                    this.q('todoup-create-trigger').classList.add('todoup-hidden');
                    this.q('todoup-create-form').classList.add('todoup-create-form-open');
                    this.q('todoup-new-board-input').focus();
                });
            }
            this.q('todoup-new-board-cancel')?.addEventListener('click', () => this.collapseCreateForm());
            this.q('todoup-new-board-btn')?.addEventListener('click', () => this.doCreateBoard());
            this.q('todoup-new-board-input')?.addEventListener('keydown', (e) => {

                if (e.key === 'Enter') {
                    this.doCreateBoard();
                }

                if (e.key === 'Escape') {
                    this.collapseCreateForm();
                }
            });

            this.q('todoup-close-card-modal')?.addEventListener('click', () =>
                this.q('todoup-edit-card-modal').classList.remove('todoup-modal-overlay-visible'));
            this.q('todoup-cancel-card')?.addEventListener('click', () =>
                this.q('todoup-edit-card-modal').classList.remove('todoup-modal-overlay-visible'));
            this.q('todoup-save-card')?.addEventListener('click', () => this.doSaveCard());
            this.q('todoup-delete-card')?.addEventListener('click', () => this.doDeleteCard());
        }

        collapseCreateForm() {
            this.q('todoup-create-form').classList.remove('todoup-create-form-open');
            this.q('todoup-create-trigger').classList.remove('todoup-hidden');
            this.q('todoup-new-board-input').value = '';
        }

        //  WORKSPACE
        async showWorkspace() {
            this.currentBoard = null;
            this.q('todoup-workspace-view').classList.remove('todoup-hidden');
            this.q('todoup-board-view').classList.remove('todoup-board-view-visible');
            this.q('todoup-breadcrumb').innerHTML = '';

            const name = this.user.firstName || this.user.username || 'there';
            this.q('workspace-subtitle').textContent =
                `Welcome back, ${name}. Your boards are private to your account.`;

            try {
                this.boards = await API.getBoards();
            }
            catch (e) {
                this.boards = [];
                this.showError('Could not load boards from server.');
            }

            this.renderWorkspace();
            this.renderHeaderActions();
        }

        renderWorkspace() {
            const grid = this.q('todoup-boards-grid');
            const createCard = this.q('todoup-create-card');

            if (!grid) {
                return;
            }

            grid.innerHTML = '';
            this.boards.forEach(b => grid.appendChild(this.makeBoardCard(b)));

            if (createCard) {
                grid.appendChild(createCard);
            }

        }

        makeBoardCard(board) {
            const card = document.createElement('div');
            card.className = 'todoup-board-card';
            const totalCards = board.lists.reduce((s, l) => s + l.cards.length, 0);
            card.innerHTML = `
                        <div class="todoup-board-card-accent"></div>
                        <h3 class="todoup-board-card-title">${this.esc(board.title)}</h3>
                        <div class="todoup-board-card-stats">
                            <span class="todoup-board-stat">${board.lists.length} Lists</span>
                            <span class="todoup-board-stat">${totalCards} Cards</span>
                        </div>
                        <div class="todoup-board-card-actions">
                            <button class="todoup-board-action-btn todoup-board-action-open">Open</button>
                            <button class="todoup-board-action-btn todoup-board-action-delete">Delete</button>
                        </div>`;

            card.querySelector('.todoup-board-action-open').addEventListener('click', (e) => {
                e.stopPropagation(); this.showBoard(board.id);
            });
            card.querySelector('.todoup-board-action-delete').addEventListener('click', (e) => {
                e.stopPropagation(); this.deleteBoard(board.id, board.title);
            });
            card.addEventListener('click', () => this.showBoard(board.id));
            return card;
        }

        //  BOARD CRUD
        async doCreateBoard() {
            const input = this.q('todoup-new-board-input');
            const title = input.value.trim();
            if (!title) {
                return;
            }

            try {
                const board = await API.createBoard(title);
                this.boards.push(board);
                this.collapseCreateForm();
                this.renderWorkspace();
                this.renderHeaderActions();
            }
            catch (e) {
                this.showError(e.message);
            }
        }

        async deleteBoard(id, title) {

            if (!confirm(`Delete "${title}" and all its content?`)) {
                return;
            }

            try {
                await API.deleteBoard(id);
                this.boards = this.boards.filter(b => b.id !== id);
                if (this.currentBoard?.id === id) {
                    await this.showWorkspace();
                }

                else {
                    this.renderWorkspace(); this.renderHeaderActions();
                }
            }
            catch (e) {
                this.showError(e.message);
            }
        }

        async showBoard(boardId) {
            try {
                this.currentBoard = await API.getBoard(boardId);
            }
            catch (e) {
                this.showError('Could not load board.');
                return;
            }

            this.q('todoup-workspace-view').classList.add('todoup-hidden');
            this.q('todoup-board-view').classList.add('todoup-board-view-visible');
            this.renderBreadcrumb();
            this.renderBoard();
            this.renderHeaderActions();
        }

        renderBreadcrumb() {
            const bc = this.q('todoup-breadcrumb');
            if (!this.currentBoard) {
                bc.innerHTML = '';
                return;
            }

            bc.innerHTML = `<span class="todoup-breadcrumb-link" id="bc-home">Workspace</span>
                        <span class="todoup-breadcrumb-sep">/</span>
                        <span class="todoup-breadcrumb-current">${this.esc(this.currentBoard.title)}</span>`;
            this.q('bc-home')?.addEventListener('click', () => this.showWorkspace());
        }

        renderBoard() {
            if (!this.currentBoard) {
                return;
            }

            const container = this.q('todoup-lists-container');
            if (!container) {
                return;
            }

            container.innerHTML = '';
            this.currentBoard.lists.forEach(list =>
                container.appendChild(this.makeListEl(list)));
            container.appendChild(this.makeAddListColumn());
        }

        //  LIST ELEMENT
        makeListEl(list) {
            const el = document.createElement('div');
            el.className = 'todoup-list';
            el.dataset.listId = list.id;

            const header = document.createElement('div');
            header.className = 'todoup-list-header';
            header.innerHTML = `<h3 class="todoup-list-title">${this.esc(list.title)}</h3>
                        <span class="todoup-list-count">${list.cards.length}</span>
                        <button class="todoup-list-delete-btn" title="Delete list">&#x2715;</button>`;
            header.querySelector('.todoup-list-delete-btn')
                .addEventListener('click', () => this.deleteList(list.id));

            const cardsEl = document.createElement('div');
            cardsEl.className = 'todoup-cards-container';
            cardsEl.dataset.listId = list.id;

            cardsEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                cardsEl.classList.add('todoup-cards-container-dragover');
            });
            cardsEl.addEventListener('dragleave', (e) => {

                if (!cardsEl.contains(e.relatedTarget))
                    cardsEl.classList.remove('todoup-cards-container-dragover');
            });

            cardsEl.addEventListener('drop', (e) => this.handleDrop(e, list.id, cardsEl));

            list.cards.forEach(card => cardsEl.appendChild(this.makeCardEl(card, list.id)));

            const addCardForm = this.makeAddCardForm(list.id);
            const addCardBtn = document.createElement('button');
            addCardBtn.className = 'todoup-btn todoup-btn-ghost todoup-btn-sm todoup-btn-block';
            addCardBtn.textContent = '+ Add Card';
            addCardBtn.addEventListener('click', () => {
                addCardForm.classList.add('todoup-add-card-form-visible');
                addCardBtn.style.display = 'none';
                addCardForm.querySelector('.todoup-input')?.focus();
            });

            el.appendChild(header);
            el.appendChild(cardsEl);
            el.appendChild(addCardForm);
            el.appendChild(addCardBtn);
            return el;
        }

        //  CARD ELEMENT 
        makeCardEl(card, listId) {
            const el = document.createElement('div');
            el.className = 'todoup-card';
            el.draggable = true;
            el.dataset.cardId = card.id;
            el.innerHTML = `<h4 class="todoup-card-title">${this.esc(card.title)}</h4>
                        <p class="todoup-card-description">${this.esc(card.description || '')}</p>
                        <div class="todoup-card-footer">
                            <button class="todoup-card-edit-btn" title="Edit card">&#x270E;</button>
                        </div>`;

            el.addEventListener('dragstart', () => {
                this.draggedCard = { card, listId };
                el.classList.add('todoup-card-dragging');
            });
            el.addEventListener('dragend', () => {
                this.draggedCard = null;
                el.classList.remove('todoup-card-dragging');
                document.querySelectorAll('.todoup-cards-container-dragover')
                    .forEach(e => e.classList.remove('todoup-cards-container-dragover'));
            });
            el.addEventListener('click', () => this.openEditCardModal(card, listId));
            return el;
        }

        makeAddCardForm(listId) {
            const form = document.createElement('div');
            form.className = 'todoup-add-card-form';
            form.innerHTML = `
                        <input type="text" class="todoup-input" placeholder="Card title…" />
                        <textarea class="todoup-textarea" placeholder="Description (optional)…"></textarea>
                        <div class="todoup-form-row">
                            <button class="todoup-btn todoup-btn-success todoup-btn-sm">Add</button>
                            <button class="todoup-btn todoup-btn-ghost todoup-btn-sm">Cancel</button>
                        </div>`;

            const titleInput = form.querySelector('.todoup-input'),
                descInput = form.querySelector('.todoup-textarea'),
                [addBtn, cancelBtn] = form.querySelectorAll('button');

            const hideForm = () => {
                form.classList.remove('todoup-add-card-form-visible');
                titleInput.value = ''; descInput.value = '';

                if (form.nextElementSibling) {
                    form.nextElementSibling.style.display = '';
                }
            };
            const submitForm = async () => {

                const title = titleInput.value.trim();
                if (!title) {
                    return;
                }

                await this.addCard(listId, title, descInput.value.trim());
                hideForm();
            };

            addBtn.addEventListener('click', submitForm);
            cancelBtn.addEventListener('click', hideForm);
            titleInput.addEventListener('keydown', (e) => {

                if (e.key === 'Enter') {
                    submitForm();

                }
                if (e.key === 'Escape') {
                    hideForm();
                }
            });
            return form;
        }

        makeAddListColumn() {
            const col = document.createElement('div');
            col.className = 'todoup-add-list-column';

            const btn = document.createElement('div');
            btn.className = 'todoup-add-list-btn';
            btn.textContent = '+ Add List';

            const form = document.createElement('form');
            form.className = 'todoup-add-list-form';
            form.innerHTML = `<input type="text" class="todoup-input" placeholder="List title…" required />
                        <div class="todoup-form-row">
                            <button type="submit" class="todoup-btn todoup-btn-success todoup-btn-sm">Add</button>
                            <button type="button" class="todoup-btn todoup-btn-ghost todoup-btn-sm">Cancel</button>
                        </div>`;

            const inp = form.querySelector('.todoup-input');
            const cancelBtn = form.querySelector('button[type="button"]');

            const showForm = () => {
                form.classList.add('todoup-add-list-form-visible');
                btn.style.display = 'none';
                inp?.focus();
            };
            const hideForm = () => {
                form.classList.remove('todoup-add-list-form-visible');
                btn.style.display = '';
                if (inp) {
                    inp.value = '';
                }

            };

            btn.addEventListener('click', showForm);
            cancelBtn?.addEventListener('click', hideForm);
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = inp.value.trim();
                if (!title) {
                    return;
                }

                await this.addList(title);
                hideForm();
            });

            col.appendChild(btn);
            col.appendChild(form);
            return col;
        }

        showAddListForm() {
            const col = document.querySelector('.todoup-add-list-column');
            if (!col) {
                return;
            }

            const btn = col.querySelector('.todoup-add-list-btn');
            const form = col.querySelector('.todoup-add-list-form');
            if (btn && form) {
                form.classList.add('todoup-add-list-form-visible');
                btn.style.display = 'none';
                form.querySelector('.todoup-input')?.focus();
            }
        }

        //  LIST CRUD
        async addList(title) {
            if (!this.currentBoard) {
                return;
            }

            try {
                const list = await API.createList(this.currentBoard.id, title);
                this.currentBoard.lists.push(list);
                this.renderBoard();
            }
            catch (e) {
                this.showError(e.message);
            }
        }

        async deleteList(listId) {
            if (!this.currentBoard) {
                return;
            }

            const list = this.currentBoard.lists.find(l => l.id === listId);
            if (list?.cards.length && !confirm(`Delete "${list.title}" and its ${list.cards.length} card(s)?`)) {
                return;
            }

            try {
                await API.deleteList(this.currentBoard.id, listId);
                this.currentBoard.lists = this.currentBoard.lists.filter(l => l.id !== listId);
                this.renderBoard();
            }
            catch (e) {
                this.showError(e.message);
            }
        }

        //  CARD CRUD 
        async addCard(listId, title, description) {
            if (!this.currentBoard) {
                return;
            }

            const list = this.currentBoard.lists.find(l => l.id === listId);
            if (!list) {
                return;
            }

            try {
                const card = await API.createCard(this.currentBoard.id, listId, title, description);
                list.cards.push(card);
                this.renderBoard();
            }
            catch (e) {
                this.showError(e.message);
            }
        }

        openEditCardModal(card, listId) {
            this.editingCard = { card, listId };
            this.q('todoup-card-title').value = card.title;
            this.q('todoup-card-description').value = card.description || '';
            this.q('todoup-edit-card-modal').classList.add('todoup-modal-overlay-visible');
            this.q('todoup-card-title').focus();
        }

        async doSaveCard() {
            if (!this.editingCard || !this.currentBoard) {
                return;
            }

            const title = this.q('todoup-card-title').value.trim();
            if (!title) {
                return;
            }

            const description = this.q('todoup-card-description').value.trim();
            const { card, listId } = this.editingCard;
            try {
                const updated = await API.updateCard(this.currentBoard.id, listId, card.id, title, description);
                card.title = updated.title;
                card.description = updated.description;
                this.editingCard = null;
                this.q('todoup-edit-card-modal').classList.remove('todoup-modal-overlay-visible');
                this.renderBoard();
            }
            catch (e) {
                this.showError(e.message);
            }
        }


        async doDeleteCard() {
            if (!this.editingCard || !this.currentBoard) {
                return;
            }

            const { card, listId } = this.editingCard;
            if (!confirm(`Delete card "${card.title}"?`)) {
                return;
            }

            try {
                await API.deleteCard(this.currentBoard.id, listId, card.id);
                const list = this.currentBoard.lists.find(l => l.id === listId);
                if (list) list.cards = list.cards.filter(c => c.id !== card.id);
                this.editingCard = null;
                this.q('todoup-edit-card-modal').classList.remove('todoup-modal-overlay-visible');
                this.renderBoard();
            }
            catch (e) {
                this.showError(e.message);
            }
        }



        //  DRAG & DROP
        async handleDrop(e, targetListId, containerEl) {
            e.preventDefault();
            containerEl.classList.remove('todoup-cards-container-dragover');

            if (!this.draggedCard || this.draggedCard.listId === targetListId || !this.currentBoard) {
                return;
            }

            const { card, listId: sourceListId } = this.draggedCard;
            const sourceList = this.currentBoard.lists.find(l => l.id === sourceListId);
            const targetList = this.currentBoard.lists.find(l => l.id === targetListId);
            if (!sourceList || !targetList) {
                return;
            }

            // UI update
            const idx = sourceList.cards.findIndex(c => c.id === card.id);
            if (idx === -1) {
                return;
            }

            sourceList.cards.splice(idx, 1);
            targetList.cards.push(card);
            this.renderBoard();

            //  call
            try {
                await API.moveCard(this.currentBoard.id, sourceListId, card.id, targetListId);
            }
            catch (e) {
                // Rollback
                targetList.cards = targetList.cards.filter(c => c.id !== card.id);
                sourceList.cards.splice(idx, 0, card);
                this.renderBoard();
                this.showError('Could not move card: ' + e.message);
            }
        }
    }

})();






// let

//for (let x; x < 1; xx++) {
//    return;
//}



// arr. values
// const x = { array... }

//for (const key in x) {
//    print
//}


// foreach ,,               cant break , continue in it

// arr

// arr.foreach((value: type, index?: number, arr?: type[])) => {
      // -------------- execution here
//  });


// value : element that processed in array
// index : index of this element
// arr (optional) : full array



