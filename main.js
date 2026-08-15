const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  navMenu.classList.toggle('open');
});

// ── Menu Page ──
const menuGrid            = document.getElementById('menuGrid');
const menuEditBtn         = document.getElementById('menuEditBtn');
const overlay             = document.getElementById('menuOverlay');
const popupTitle          = document.getElementById('popupTitle');
const popupList           = document.getElementById('popupList');
const popupClose          = document.getElementById('popupClose');
const menuItemEditArea    = document.getElementById('menuItemEditArea');
const newItemInput        = document.getElementById('newItemInput');
const addItemBtn          = document.getElementById('addItemBtn');
const menuPasswordOverlay = document.getElementById('menuPasswordOverlay');
const menuPasswordClose   = document.getElementById('menuPasswordClose');
const menuPasswordInput   = document.getElementById('menuPasswordInput');
const menuPasswordError   = document.getElementById('menuPasswordError');
const menuPasswordConfirm = document.getElementById('menuPasswordConfirm');
const addCategoryOverlay  = document.getElementById('addCategoryOverlay');
const addCategoryClose    = document.getElementById('addCategoryClose');
const newCategoryName     = document.getElementById('newCategoryName');
const newCategoryIcon     = document.getElementById('newCategoryIcon');
const addCategoryConfirm  = document.getElementById('addCategoryConfirm');

if (menuGrid) {
  const MENU_PASSWORD = '1234';
  let menuEditMode = false;
  let currentCategoryIndex = null;

  const defaultMenu = [
    { title: 'Cold Drinks', icon: '🧊', items: [] },
    { title: 'Hot Drinks',  icon: '☕', items: [] },
    { title: 'La2mashet',   icon: '🍽️', items: [] },
    { title: 'Argile',      icon: '💨', items: [] },
    { title: 'PS',          icon: '🎮', items: [] }
  ];

  function getMenu() {
    const saved = localStorage.getItem('kahwetna_menu');
    return saved ? JSON.parse(saved) : defaultMenu;
  }

  function saveMenu(data) {
    localStorage.setItem('kahwetna_menu', JSON.stringify(data));
  }

  function renderPopupItems(index) {
    const menu = getMenu();
    const cat = menu[index];
    if (cat.items.length === 0) {
      popupList.innerHTML = '<li style="color:var(--text2);list-style:none;text-align:center">No items yet.</li>';
    } else {
      popupList.innerHTML = cat.items.map((item, i) => `
        <li class="menu-item-row">
          <span>${item}</span>
          ${menuEditMode ? `<button class="menu-item-delete" data-item="${i}">✕</button>` : ''}
        </li>`).join('');
    }
    if (menuEditMode) {
      popupList.querySelectorAll('.menu-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const menu = getMenu();
          menu[index].items.splice(btn.dataset.item, 1);
          saveMenu(menu);
          renderPopupItems(index);
        });
      });
    }
  }

  function openPopup(index) {
    const menu = getMenu();
    currentCategoryIndex = index;
    popupTitle.textContent = menu[index].title;
    menuItemEditArea.classList.toggle('hidden', !menuEditMode);
    newItemInput.value = '';
    renderPopupItems(index);
    overlay.classList.add('open');
  }

  function renderGrid() {
    const menu = getMenu();
    menuGrid.innerHTML = '';
    menuGrid.classList.toggle('menu-edit-mode', menuEditMode);

    menu.forEach((cat, i) => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.innerHTML = `
        ${menuEditMode ? `<button class="menu-card-delete" data-index="${i}">✕</button>` : ''}
        <span class="menu-card-icon">${cat.icon}</span>
        <span>${cat.title}</span>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-card-delete')) return;
        openPopup(i);
      });
      if (menuEditMode) {
        card.querySelector('.menu-card-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          const menu = getMenu();
          menu.splice(i, 1);
          saveMenu(menu);
          renderGrid();
        });
      }
      menuGrid.appendChild(card);
    });

    if (menuEditMode) {
      const addCard = document.createElement('div');
      addCard.className = 'add-category-card';
      addCard.innerHTML = '<span>+</span>';
      addCard.addEventListener('click', () => {
        newCategoryName.value = '';
        newCategoryIcon.value = '';
        addCategoryOverlay.classList.add('open');
      });
      menuGrid.appendChild(addCard);
    }
  }

  addItemBtn.addEventListener('click', () => {
    const val = newItemInput.value.trim();
    if (!val) return;
    const menu = getMenu();
    menu[currentCategoryIndex].items.push(val);
    saveMenu(menu);
    newItemInput.value = '';
    renderPopupItems(currentCategoryIndex);
  });

  newItemInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addItemBtn.click(); });

  popupClose.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

  menuEditBtn.addEventListener('click', () => {
    if (menuEditMode) {
      menuEditMode = false;
      menuEditBtn.textContent = '✎ Edit';
      renderGrid();
    } else {
      menuPasswordInput.value = '';
      menuPasswordError.classList.add('hidden');
      menuPasswordOverlay.classList.add('open');
    }
  });

  menuPasswordConfirm.addEventListener('click', () => {
    if (menuPasswordInput.value === MENU_PASSWORD) {
      menuPasswordOverlay.classList.remove('open');
      menuEditMode = true;
      menuEditBtn.textContent = '✔ Done';
      renderGrid();
    } else {
      menuPasswordError.classList.remove('hidden');
    }
  });

  menuPasswordClose.addEventListener('click', () => menuPasswordOverlay.classList.remove('open'));
  menuPasswordOverlay.addEventListener('click', (e) => { if (e.target === menuPasswordOverlay) menuPasswordOverlay.classList.remove('open'); });

  addCategoryConfirm.addEventListener('click', () => {
    const name = newCategoryName.value.trim();
    const icon = newCategoryIcon.value.trim() || '📋';
    if (!name) return;
    const menu = getMenu();
    menu.push({ title: name, icon, items: [] });
    saveMenu(menu);
    addCategoryOverlay.classList.remove('open');
    renderGrid();
  });

  addCategoryClose.addEventListener('click', () => addCategoryOverlay.classList.remove('open'));
  addCategoryOverlay.addEventListener('click', (e) => { if (e.target === addCategoryOverlay) addCategoryOverlay.classList.remove('open'); });

  renderGrid();
}

// ── Names Page ──
const namesGrid             = document.getElementById('namesGrid');
const namesEditBtn          = document.getElementById('namesEditBtn');
const personOverlay         = document.getElementById('personOverlay');
const personPopupClose      = document.getElementById('personPopupClose');
const personPopupName       = document.getElementById('personPopupName');
const personPopupAbout      = document.getElementById('personPopupAbout');
const namesPasswordOverlay  = document.getElementById('namesPasswordOverlay');
const namesPasswordClose    = document.getElementById('namesPasswordClose');
const namesPasswordInput    = document.getElementById('namesPasswordInput');
const namesPasswordError    = document.getElementById('namesPasswordError');
const namesPasswordConfirm  = document.getElementById('namesPasswordConfirm');
const editPersonOverlay     = document.getElementById('editPersonOverlay');
const editPersonClose       = document.getElementById('editPersonClose');
const editPersonTitle       = document.getElementById('editPersonTitle');
const editPersonPreview     = document.getElementById('editPersonPreview');
const editPersonFile        = document.getElementById('editPersonFile');
const editPersonName        = document.getElementById('editPersonName');
const editPersonAbout       = document.getElementById('editPersonAbout');
const editPersonSave        = document.getElementById('editPersonSave');

if (namesGrid) {
  const NAMES_PASSWORD = '1234';
  let editMode = false;
  let editingIndex = null;

  const defaultPeople = Array.from({ length: 10 }, (_, i) => ({
    name: `Name ${i + 1}`,
    about: 'Write something about this person here.',
    img: 'images/logo.jpeg'
  }));

  function getPeople() {
    const saved = localStorage.getItem('kahwetna_people');
    return saved ? JSON.parse(saved) : defaultPeople;
  }

  function savePeople(data) {
    localStorage.setItem('kahwetna_people', JSON.stringify(data));
  }

  function renderCards() {
    const people = getPeople();
    namesGrid.innerHTML = '';

    people.forEach((person, i) => {
      const card = document.createElement('div');
      card.className = 'person-card';
      card.innerHTML = `
        <button class="card-delete-btn" data-index="${i}">✕</button>
        <button class="card-edit-btn" data-index="${i}">✎</button>
        <img src="${person.img}" alt="${person.name}" />
        <span>${person.name}</span>
      `;

      card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const people = getPeople();
        people.splice(i, 1);
        savePeople(people);
        renderCards();
      });

      card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditPerson(i);
      });

      card.addEventListener('click', () => {
        if (editMode) return;
        personPopupName.textContent  = person.name;
        personPopupAbout.textContent = person.about;
        personOverlay.classList.add('open');
      });

      namesGrid.appendChild(card);
    });

    if (editMode) {
      namesGrid.classList.add('names-edit-mode');
      const addCard = document.createElement('div');
      addCard.className = 'add-person-card';
      addCard.innerHTML = '<span>+</span>';
      addCard.addEventListener('click', () => openEditPerson(null));
      namesGrid.appendChild(addCard);
    } else {
      namesGrid.classList.remove('names-edit-mode');
    }
  }

  function openEditPerson(index) {
    const people = getPeople();
    editingIndex = index;
    if (index !== null) {
      editPersonTitle.textContent  = 'Edit Person';
      editPersonPreview.src        = people[index].img;
      editPersonName.value         = people[index].name;
      editPersonAbout.value        = people[index].about;
    } else {
      editPersonTitle.textContent  = 'Add Person';
      editPersonPreview.src        = 'images/logo.jpeg';
      editPersonName.value         = '';
      editPersonAbout.value        = '';
    }
    editPersonOverlay.classList.add('open');
  }

  editPersonFile.addEventListener('change', () => {
    const file = editPersonFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { editPersonPreview.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  editPersonSave.addEventListener('click', () => {
    const people = getPeople();
    const entry = {
      name:  editPersonName.value.trim() || 'No Name',
      about: editPersonAbout.value.trim() || '',
      img:   editPersonPreview.src
    };
    if (editingIndex !== null) {
      people[editingIndex] = entry;
    } else {
      people.push(entry);
    }
    savePeople(people);
    editPersonOverlay.classList.remove('open');
    renderCards();
  });

  editPersonClose.addEventListener('click', () => editPersonOverlay.classList.remove('open'));
  editPersonOverlay.addEventListener('click', (e) => {
    if (e.target === editPersonOverlay) editPersonOverlay.classList.remove('open');
  });

  namesEditBtn.addEventListener('click', () => {
    if (editMode) {
      editMode = false;
      namesEditBtn.textContent = '✎ Edit';
      renderCards();
    } else {
      namesPasswordInput.value = '';
      namesPasswordError.classList.add('hidden');
      namesPasswordOverlay.classList.add('open');
    }
  });

  namesPasswordConfirm.addEventListener('click', () => {
    if (namesPasswordInput.value === NAMES_PASSWORD) {
      namesPasswordOverlay.classList.remove('open');
      editMode = true;
      namesEditBtn.textContent = '✔ Done';
      renderCards();
    } else {
      namesPasswordError.classList.remove('hidden');
    }
  });

  namesPasswordClose.addEventListener('click', () => namesPasswordOverlay.classList.remove('open'));
  namesPasswordOverlay.addEventListener('click', (e) => {
    if (e.target === namesPasswordOverlay) namesPasswordOverlay.classList.remove('open');
  });

  personPopupClose.addEventListener('click', () => personOverlay.classList.remove('open'));
  personOverlay.addEventListener('click', (e) => {
    if (e.target === personOverlay) personOverlay.classList.remove('open');
  });

  renderCards();
}

// ── Availability Page ──
const logOpenBtn       = document.getElementById('logOpenBtn');
const openerName       = document.getElementById('openerName');
const logHistory       = document.getElementById('logHistory');
const logEditBtn       = document.getElementById('logEditBtn');
const logPasswordOverlay = document.getElementById('logPasswordOverlay');
const logPasswordClose  = document.getElementById('logPasswordClose');
const logPasswordInput  = document.getElementById('logPasswordInput');
const logPasswordError  = document.getElementById('logPasswordError');
const logPasswordConfirm = document.getElementById('logPasswordConfirm');

if (logOpenBtn) {
  const LOG_PASSWORD = '1234';
  let logEditMode = false;

  function getLog() {
    const saved = localStorage.getItem('kahwetna_openlog');
    return saved ? JSON.parse(saved) : [];
  }

  function saveLog(data) {
    localStorage.setItem('kahwetna_openlog', JSON.stringify(data));
  }

  function renderLog() {
    const log = getLog();
    if (log.length === 0) {
      logHistory.innerHTML = '<p class="log-empty">No openings logged yet.</p>';
      return;
    }
    logHistory.innerHTML = log.slice().reverse().map((entry, ri) => {
      const i = log.length - 1 - ri;
      if (logEditMode) {
        return `
          <div class="log-entry">
            <input class="log-entry-name-input" value="${entry.name}" data-index="${i}" />
            <div class="log-entry-actions">
              <button class="log-entry-edit" data-index="${i}">Save</button>
              <button class="log-entry-delete" data-index="${i}">✕</button>
            </div>
          </div>`;
      }
      return `
        <div class="log-entry">
          <span class="log-entry-name">${entry.name}</span>
          <span class="log-entry-time">${entry.date}</span>
        </div>`;
    }).join('');

    if (logEditMode) {
      logHistory.querySelectorAll('.log-entry-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = btn.dataset.index;
          const input = logHistory.querySelector(`.log-entry-name-input[data-index="${i}"]`);
          const log = getLog();
          log[i].name = input.value.trim() || log[i].name;
          saveLog(log);
          renderLog();
        });
      });

      logHistory.querySelectorAll('.log-entry-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const log = getLog();
          log.splice(btn.dataset.index, 1);
          saveLog(log);
          renderLog();
        });
      });
    }
  }

  logOpenBtn.addEventListener('click', () => {
    const name = openerName.value.trim();
    if (!name) { openerName.focus(); return; }
    const now = new Date();
    const today = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const log = getLog();
    if (log.some(entry => entry.date.startsWith(today))) {
      openerName.value = '';
      openerName.placeholder = 'Already logged for today!';
      setTimeout(() => openerName.placeholder = 'Enter your name...', 3000);
      return;
    }
    const dateStr = today + ' · ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    log.push({ name, date: dateStr });
    saveLog(log);
    openerName.value = '';
    renderLog();
  });

  openerName.addEventListener('keydown', (e) => { if (e.key === 'Enter') logOpenBtn.click(); });

  logEditBtn.addEventListener('click', () => {
    if (logEditMode) {
      logEditMode = false;
      logEditBtn.textContent = '✎ Edit';
      renderLog();
    } else {
      logPasswordInput.value = '';
      logPasswordError.classList.add('hidden');
      logPasswordOverlay.classList.add('open');
    }
  });

  logPasswordConfirm.addEventListener('click', () => {
    if (logPasswordInput.value === LOG_PASSWORD) {
      logPasswordOverlay.classList.remove('open');
      logEditMode = true;
      logEditBtn.textContent = '✔ Done';
      renderLog();
    } else {
      logPasswordError.classList.remove('hidden');
    }
  });

  logPasswordClose.addEventListener('click', () => logPasswordOverlay.classList.remove('open'));
  logPasswordOverlay.addEventListener('click', (e) => {
    if (e.target === logPasswordOverlay) logPasswordOverlay.classList.remove('open');
  });

  renderLog();
}

// ── Shohada Page ──
const shohadaOverlay  = document.getElementById('shohadaOverlay');
const shohadaClose    = document.getElementById('shohadaClose');
const shohadaName     = document.getElementById('shohadaName');
const shohadaBorn     = document.getElementById('shohadaBorn');
const shohadaMartyred = document.getElementById('shohadaMartyred');

if (shohadaOverlay) {
  document.querySelectorAll('.shohada-name').forEach(el => {
    el.addEventListener('click', () => {
      shohadaName.textContent     = el.dataset.name;
      shohadaBorn.textContent     = el.dataset.born;
      shohadaMartyred.textContent = el.dataset.martyred;
      shohadaOverlay.classList.add('open');
    });
  });

  shohadaClose.addEventListener('click', () => shohadaOverlay.classList.remove('open'));
  shohadaOverlay.addEventListener('click', (e) => {
    if (e.target === shohadaOverlay) shohadaOverlay.classList.remove('open');
  });
}

// ── Owners Page ──
const ownerOverlay   = document.getElementById('ownerOverlay');
const ownerPopupClose = document.getElementById('ownerPopupClose');
const ownerPopupImg  = document.getElementById('ownerPopupImg');
const ownerPopupName = document.getElementById('ownerPopupName');

if (ownerOverlay) {
  document.querySelectorAll('.owner-card').forEach(card => {
    card.addEventListener('click', () => {
      ownerPopupImg.src         = card.dataset.img;
      ownerPopupImg.alt         = card.dataset.name;
      ownerPopupName.textContent = card.dataset.name;
      ownerOverlay.classList.add('open');
    });
  });

  ownerPopupClose.addEventListener('click', () => ownerOverlay.classList.remove('open'));
  ownerOverlay.addEventListener('click', (e) => {
    if (e.target === ownerOverlay) ownerOverlay.classList.remove('open');
  });
}

// ── Games Page ──
const GAMES_PASSWORD = '1234'; // change this to your password

const defaultStandings = {
  ps:       ['Player 1', 'Player 2', 'Player 3'],
  cattan:   ['Player 1', 'Player 2', 'Player 3'],
  monopoly: ['Player 1', 'Player 2', 'Player 3']
};

function getStandings() {
  const saved = localStorage.getItem('kahwetna_standings');
  return saved ? JSON.parse(saved) : defaultStandings;
}

function saveStandings(data) {
  localStorage.setItem('kahwetna_standings', JSON.stringify(data));
}

const gameOverlay        = document.getElementById('gameOverlay');
const gamePopupClose     = document.getElementById('gamePopupClose');
const gamePopupTitle     = document.getElementById('gamePopupTitle');
const standingsList      = document.getElementById('standingsList');
const editBtn            = document.getElementById('editBtn');
const standingsView      = document.getElementById('standingsView');
const passwordView       = document.getElementById('passwordView');
const editView           = document.getElementById('editView');
const passwordInput      = document.getElementById('passwordInput');
const passwordError      = document.getElementById('passwordError');
const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
const saveBtn            = document.getElementById('saveBtn');
const addPlayerBtn       = document.getElementById('addPlayerBtn');
const dragList           = document.getElementById('dragList');

if (gameOverlay) {
  let currentGame = null;
  let sortable = null;

  function showStandings() {
    standingsView.classList.remove('hidden');
    passwordView.classList.add('hidden');
    editView.classList.add('hidden');
    const standings = getStandings();
    standingsList.innerHTML = standings[currentGame]
      .slice(0, 10)
      .map((name, i) => `<li>${name}${i === 0 ? ' 👑' : ''}</li>`)
      .join('');
  }

  function addPlayerRow(name = '') {
    const li = document.createElement('li');
    li.className = 'drag-item';
    li.innerHTML = `
      <span class="drag-handle">☰</span>
      <input class="drag-name-input" type="text" value="${name}" placeholder="Player name" />
      <button class="drag-delete" title="Remove">✕</button>
    `;
    li.querySelector('.drag-delete').addEventListener('click', () => li.remove());
    dragList.appendChild(li);
  }

  function showEditView() {
    passwordView.classList.add('hidden');
    editView.classList.remove('hidden');
    dragList.innerHTML = '';
    const standings = getStandings();
    standings[currentGame].forEach(name => addPlayerRow(name));
    if (sortable) sortable.destroy();
    sortable = Sortable.create(dragList, { animation: 150, handle: '.drag-handle' });
  }

  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      currentGame = card.dataset.game;
      gamePopupTitle.textContent = card.querySelector('span:last-child').textContent;
      passwordInput.value = '';
      passwordError.classList.add('hidden');
      showStandings();
      gameOverlay.classList.add('open');
    });
  });

  gamePopupClose.addEventListener('click', () => gameOverlay.classList.remove('open'));
  gameOverlay.addEventListener('click', (e) => {
    if (e.target === gameOverlay) gameOverlay.classList.remove('open');
  });

  editBtn.addEventListener('click', () => {
    standingsView.classList.add('hidden');
    passwordView.classList.remove('hidden');
    passwordInput.focus();
  });

  confirmPasswordBtn.addEventListener('click', () => {
    if (passwordInput.value === GAMES_PASSWORD) {
      passwordError.classList.add('hidden');
      showEditView();
    } else {
      passwordError.classList.remove('hidden');
    }
  });

  addPlayerBtn.addEventListener('click', () => addPlayerRow(''));

  saveBtn.addEventListener('click', () => {
    const standings = getStandings();
    standings[currentGame] = [...dragList.querySelectorAll('.drag-name-input')]
      .map(input => input.value.trim())
      .filter(name => name !== '');
    saveStandings(standings);
    editView.classList.add('hidden');
    showStandings();
  });
}
