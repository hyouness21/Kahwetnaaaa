import { db, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from './firebase.js';

// ── Hamburger ──
const menuBtn = document.getElementById('menuBtn');
const navMenu = document.getElementById('navMenu');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    navMenu.classList.toggle('open');
  });
}

// ── Helpers ──
async function fsGet(docPath) {
  const snap = await getDoc(doc(db, ...docPath.split('/')));
  return snap.exists() ? snap.data() : null;
}
async function fsSet(docPath, data) {
  await setDoc(doc(db, ...docPath.split('/')), data);
}

async function compressImage(base64, maxSize = 400) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64;
  });
}

// ── Image Crop/Position Editor ──
let _cropEl = null, _cropResolve = null;
let _cropOffX = 0, _cropOffY = 0, _cropScale = 1;
const _V = 280, _O = 400;

function _cropImg() { return document.getElementById('_cropImg'); }

function _applyTransform() {
  _cropImg().style.transform = `translate(${_cropOffX}px,${_cropOffY}px) scale(${_cropScale})`;
}

function _renderCropOutput() {
  const img = _cropImg();
  const canvas = document.createElement('canvas');
  canvas.width = _O; canvas.height = _O;
  const r = _O / _V;
  canvas.getContext('2d').drawImage(img, _cropOffX * r, _cropOffY * r, img.naturalWidth * _cropScale * r, img.naturalHeight * _cropScale * r);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function _closeCrop(result) {
  _cropEl.classList.remove('open');
  if (_cropResolve) { _cropResolve(result); _cropResolve = null; }
}

function openCropEditor(src) {
  if (!_cropEl) {
    _cropEl = document.createElement('div');
    _cropEl.className = 'crop-overlay';
    _cropEl.innerHTML = `
      <div class="crop-popup">
        <h3 class="crop-title">Position Photo</h3>
        <div class="crop-viewport" id="_cropViewport">
          <img id="_cropImg" draggable="false" />
        </div>
        <p class="crop-hint">Drag to reposition · Scroll to zoom</p>
        <div class="crop-actions">
          <button id="_cropCancel" class="crop-btn-cancel">Cancel</button>
          <button id="_cropApply" class="crop-btn-apply">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(_cropEl);

    const vp = _cropEl.querySelector('#_cropViewport');

    let dragging = false, mx0, my0, ox0, oy0;
    vp.addEventListener('mousedown', e => {
      dragging = true; mx0 = e.clientX; my0 = e.clientY; ox0 = _cropOffX; oy0 = _cropOffY;
      e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      _cropOffX = ox0 + e.clientX - mx0;
      _cropOffY = oy0 + e.clientY - my0;
      _applyTransform();
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const cx = (_V / 2 - _cropOffX) / _cropScale;
      const cy = (_V / 2 - _cropOffY) / _cropScale;
      _cropScale = Math.max(0.2, Math.min(8, _cropScale * delta));
      _cropOffX = _V / 2 - cx * _cropScale;
      _cropOffY = _V / 2 - cy * _cropScale;
      _applyTransform();
    }, { passive: false });

    let t0x, t0y, tox, toy, tDist;
    vp.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        t0x = e.touches[0].clientX; t0y = e.touches[0].clientY; tox = _cropOffX; toy = _cropOffY;
      } else if (e.touches.length === 2) {
        tDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
      e.preventDefault();
    }, { passive: false });

    vp.addEventListener('touchmove', e => {
      if (e.touches.length === 1) {
        _cropOffX = tox + e.touches[0].clientX - t0x;
        _cropOffY = toy + e.touches[0].clientY - t0y;
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const cx = (_V / 2 - _cropOffX) / _cropScale;
        const cy = (_V / 2 - _cropOffY) / _cropScale;
        _cropScale = Math.max(0.2, Math.min(8, _cropScale * (d / tDist)));
        _cropOffX = _V / 2 - cx * _cropScale;
        _cropOffY = _V / 2 - cy * _cropScale;
        tDist = d;
        t0x = e.touches[0].clientX; t0y = e.touches[0].clientY; tox = _cropOffX; toy = _cropOffY;
      }
      _applyTransform();
      e.preventDefault();
    }, { passive: false });

    _cropEl.querySelector('#_cropApply').addEventListener('click', () => _closeCrop(_renderCropOutput()));
    _cropEl.querySelector('#_cropCancel').addEventListener('click', () => _closeCrop(null));
    _cropEl.addEventListener('click', e => { if (e.target === _cropEl) _closeCrop(null); });
  }

  return new Promise(resolve => {
    _cropResolve = resolve;
    const img = _cropImg();
    img.onload = () => {
      _cropScale = Math.max(_V / img.naturalWidth, _V / img.naturalHeight);
      _cropOffX = (_V - img.naturalWidth * _cropScale) / 2;
      _cropOffY = (_V - img.naturalHeight * _cropScale) / 2;
      _applyTransform();
      _cropEl.classList.add('open');
    };
    img.src = '';
    img.src = src;
  });
}

// ── Menu Page ──
const menuGrid            = document.getElementById('menuGrid');
const menuEditBtn         = document.getElementById('menuEditBtn');
const overlay             = document.getElementById('menuOverlay');
const popupTitle          = document.getElementById('popupTitle');
const popupList           = document.getElementById('popupList');
const popupClose          = document.getElementById('popupClose');
const menuItemEditArea    = document.getElementById('menuItemEditArea');
const newItemInput        = document.getElementById('newItemInput');
const newItemPrice        = document.getElementById('newItemPrice');
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

  async function getMenu() {
    const data = await fsGet('data/menu');
    return data ? data.categories : defaultMenu;
  }

  async function saveMenu(categories) {
    await fsSet('data/menu', { categories });
  }

  function renderPopupItems(menu, index) {
    const cat = menu[index];
    if (!cat.items || cat.items.length === 0) {
      popupList.innerHTML = '<li style="color:var(--text2);list-style:none;text-align:center">No items yet.</li>';
    } else {
      popupList.innerHTML = cat.items.map((item, i) => {
        const name  = typeof item === 'string' ? item : item.name;
        const price = typeof item === 'string' ? '' : (item.price || '');
        return `
        <li class="menu-item-row">
          <span class="menu-item-name">${name}</span>
          ${price ? `<span class="menu-item-price">${price}</span>` : ''}
          ${menuEditMode ? `<button class="menu-item-delete" data-item="${i}">✕</button>` : ''}
        </li>`;
      }).join('');
    }
    if (menuEditMode) {
      popupList.querySelectorAll('.menu-item-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const menu = await getMenu();
          menu[index].items.splice(btn.dataset.item, 1);
          await saveMenu(menu);
          renderPopupItems(menu, index);
        });
      });
    }
  }

  async function openPopup(index) {
    currentCategoryIndex = index;
    const menu = await getMenu();
    popupTitle.textContent = menu[index].title;
    menuItemEditArea.classList.toggle('hidden', !menuEditMode);
    newItemInput.value = '';
    newItemPrice.value = '';
    renderPopupItems(menu, index);
    overlay.classList.add('open');
  }

  async function renderGrid() {
    const menu = await getMenu();
    menuGrid.innerHTML = '';
    menuGrid.classList.toggle('menu-edit-mode', menuEditMode);

    menu.forEach((cat, i) => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.innerHTML = `
        ${menuEditMode ? `<button class="menu-card-delete" data-index="${i}">✕</button>` : ''}
        <span class="menu-card-icon">${cat.icon}</span>
        <span>${cat.title}</span>`;
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-card-delete')) return;
        openPopup(i);
      });
      if (menuEditMode) {
        card.querySelector('.menu-card-delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          const menu = await getMenu();
          menu.splice(i, 1);
          await saveMenu(menu);
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

  addItemBtn.addEventListener('click', async () => {
    const name  = newItemInput.value.trim();
    const price = newItemPrice.value.trim();
    if (!name) return;
    const menu = await getMenu();
    menu[currentCategoryIndex].items.push({ name, price });
    await saveMenu(menu);
    newItemInput.value = '';
    newItemPrice.value = '';
    renderPopupItems(menu, currentCategoryIndex);
  });

  newItemInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') newItemPrice.focus(); });
  newItemPrice.addEventListener('keydown', (e) => { if (e.key === 'Enter') addItemBtn.click(); });
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

  addCategoryConfirm.addEventListener('click', async () => {
    const name = newCategoryName.value.trim();
    const icon = newCategoryIcon.value.trim() || '📋';
    if (!name) return;
    const menu = await getMenu();
    menu.push({ title: name, icon, items: [] });
    await saveMenu(menu);
    addCategoryOverlay.classList.remove('open');
    renderGrid();
  });

  addCategoryClose.addEventListener('click', () => addCategoryOverlay.classList.remove('open'));
  addCategoryOverlay.addEventListener('click', (e) => { if (e.target === addCategoryOverlay) addCategoryOverlay.classList.remove('open'); });

  renderGrid();
}

// ── Games Page ──
const GAMES_PASSWORD = '1234';
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

  const defaultStandings = {
    ps: [], cattan: [], monopoly: []
  };

  async function getStandings() {
    const data = await fsGet('data/standings');
    return data || defaultStandings;
  }

  async function saveStandings(data) {
    await fsSet('data/standings', data);
  }

  async function showStandings() {
    standingsView.classList.remove('hidden');
    passwordView.classList.add('hidden');
    editView.classList.add('hidden');
    const standings = await getStandings();
    const list = standings[currentGame] || [];
    standingsList.innerHTML = list.slice(0, 10)
      .map((name, i) => `<li>${name}${i === 0 && list.length > 0 ? ' 👑' : ''}</li>`)
      .join('') || '<li style="list-style:none;color:var(--text2);text-align:center">No players yet.</li>';
  }

  function addPlayerRow(name = '') {
    const li = document.createElement('li');
    li.className = 'drag-item';
    li.innerHTML = `
      <span class="drag-handle">☰</span>
      <input class="drag-name-input" type="text" value="${name}" placeholder="Player name" />
      <button class="drag-delete" title="Remove">✕</button>`;
    li.querySelector('.drag-delete').addEventListener('click', () => li.remove());
    dragList.appendChild(li);
  }

  async function showEditView() {
    passwordView.classList.add('hidden');
    editView.classList.remove('hidden');
    dragList.innerHTML = '';
    const standings = await getStandings();
    (standings[currentGame] || []).forEach(name => addPlayerRow(name));
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
  gameOverlay.addEventListener('click', (e) => { if (e.target === gameOverlay) gameOverlay.classList.remove('open'); });
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

  saveBtn.addEventListener('click', async () => {
    const standings = await getStandings();
    standings[currentGame] = [...dragList.querySelectorAll('.drag-name-input')]
      .map(input => input.value.trim()).filter(n => n !== '');
    await saveStandings(standings);
    editView.classList.add('hidden');
    showStandings();
  });
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
  let editingDocId = null;

  async function getPeople() {
    try {
      const snap = await getDocs(collection(db, 'people'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Firebase error:', e);
      return [];
    }
  }

  function renderCards(people) {
    namesGrid.innerHTML = '';
    namesGrid.classList.toggle('names-edit-mode', editMode);

    if (people.length === 0 && !editMode) {
      namesGrid.innerHTML = '<p style="color:var(--text2);text-align:center;grid-column:1/-1;padding:40px 0">No people added yet. Click ✎ Edit to add.</p>';
      return;
    }

    people.forEach((person) => {
      const card = document.createElement('div');
      card.className = 'person-card';
      card.innerHTML = `
        <button class="card-delete-btn">✕</button>
        <button class="card-edit-btn">✎</button>
        <img src="${person.img || 'images/logo.jpeg'}" alt="${person.name}" />
        <span>${person.name}</span>`;

      card.querySelector('.card-delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, 'people', person.id));
        const people = await getPeople();
        renderCards(people);
      });

      card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditPerson(person);
      });

      card.addEventListener('click', () => {
        if (editMode) return;
        personPopupName.textContent  = person.name;
        personPopupAbout.textContent = person.about || '';
        personOverlay.classList.add('open');
      });

      namesGrid.appendChild(card);
    });

    if (editMode) {
      const addCard = document.createElement('div');
      addCard.className = 'add-person-card';
      addCard.innerHTML = '<span>+</span>';
      addCard.addEventListener('click', () => openEditPerson(null));
      namesGrid.appendChild(addCard);
    }
  }

  function openEditPerson(person) {
    editingDocId = person ? person.id : null;
    editPersonTitle.textContent  = person ? 'Edit Person' : 'Add Person';
    editPersonPreview.src        = person ? (person.img || 'images/logo.jpeg') : 'images/logo.jpeg';
    editPersonName.value         = person ? person.name : '';
    editPersonAbout.value        = person ? (person.about || '') : '';
    editPersonOverlay.classList.add('open');
  }

  editPersonFile.addEventListener('change', () => {
    const file = editPersonFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await openCropEditor(e.target.result);
      if (result) editPersonPreview.src = result;
    };
    reader.readAsDataURL(file);
  });

  editPersonSave.addEventListener('click', async () => {
    const entry = {
      name:  editPersonName.value.trim() || 'No Name',
      about: editPersonAbout.value.trim() || '',
      img:   editPersonPreview.src
    };
    if (editingDocId) {
      await updateDoc(doc(db, 'people', editingDocId), entry);
    } else {
      await addDoc(collection(db, 'people'), entry);
    }
    editPersonOverlay.classList.remove('open');
    const people = await getPeople();
    renderCards(people);
  });

  editPersonClose.addEventListener('click', () => editPersonOverlay.classList.remove('open'));
  editPersonOverlay.addEventListener('click', (e) => { if (e.target === editPersonOverlay) editPersonOverlay.classList.remove('open'); });

  namesEditBtn.addEventListener('click', () => {
    if (editMode) {
      editMode = false;
      namesEditBtn.textContent = '✎ Edit';
      getPeople().then(renderCards);
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
      getPeople().then(renderCards);
    } else {
      namesPasswordError.classList.remove('hidden');
    }
  });

  namesPasswordClose.addEventListener('click', () => namesPasswordOverlay.classList.remove('open'));
  namesPasswordOverlay.addEventListener('click', (e) => { if (e.target === namesPasswordOverlay) namesPasswordOverlay.classList.remove('open'); });
  personPopupClose.addEventListener('click', () => personOverlay.classList.remove('open'));
  personOverlay.addEventListener('click', (e) => { if (e.target === personOverlay) personOverlay.classList.remove('open'); });

  getPeople().then(renderCards);
}

// ── Availability Page ──
const logOpenBtn         = document.getElementById('logOpenBtn');
const openerName         = document.getElementById('openerName');
const logHistory         = document.getElementById('logHistory');
const logEditBtn         = document.getElementById('logEditBtn');
const logPasswordOverlay = document.getElementById('logPasswordOverlay');
const logPasswordClose   = document.getElementById('logPasswordClose');
const logPasswordInput   = document.getElementById('logPasswordInput');
const logPasswordError   = document.getElementById('logPasswordError');
const logPasswordConfirm = document.getElementById('logPasswordConfirm');

if (logOpenBtn) {
  const LOG_PASSWORD = '1234';
  let logEditMode = false;

  async function getLog() {
    const data = await fsGet('data/openlog');
    return data ? data.entries : [];
  }

  async function saveLog(entries) {
    await fsSet('data/openlog', { entries });
  }

  async function renderLog() {
    const log = await getLog();
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
        btn.addEventListener('click', async () => {
          const log = await getLog();
          const input = logHistory.querySelector(`.log-entry-name-input[data-index="${btn.dataset.index}"]`);
          log[btn.dataset.index].name = input.value.trim() || log[btn.dataset.index].name;
          await saveLog(log);
          renderLog();
        });
      });
      logHistory.querySelectorAll('.log-entry-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const log = await getLog();
          log.splice(btn.dataset.index, 1);
          await saveLog(log);
          renderLog();
        });
      });
    }
  }

  logOpenBtn.addEventListener('click', async () => {
    const name = openerName.value.trim();
    if (!name) { openerName.focus(); return; }
    const now = new Date();
    const today = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const log = await getLog();
    if (log.some(entry => entry.date.startsWith(today))) {
      openerName.value = '';
      openerName.placeholder = 'Already logged for today!';
      setTimeout(() => openerName.placeholder = 'Enter your name...', 3000);
      return;
    }
    const dateStr = today + ' · ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    log.push({ name, date: dateStr });
    await saveLog(log);
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
  logPasswordOverlay.addEventListener('click', (e) => { if (e.target === logPasswordOverlay) logPasswordOverlay.classList.remove('open'); });

  renderLog();
}

// ── Owners Page ──
const ownersGrid             = document.getElementById('ownersGrid');
const ownerOverlay           = document.getElementById('ownerOverlay');
const ownerPopupClose        = document.getElementById('ownerPopupClose');
const ownerPopupImg          = document.getElementById('ownerPopupImg');
const ownerPopupName         = document.getElementById('ownerPopupName');
const ownersEditBtn          = document.getElementById('ownersEditBtn');
const ownersPasswordOverlay  = document.getElementById('ownersPasswordOverlay');
const ownersPasswordClose    = document.getElementById('ownersPasswordClose');
const ownersPasswordInput    = document.getElementById('ownersPasswordInput');
const ownersPasswordError    = document.getElementById('ownersPasswordError');
const ownersPasswordConfirm  = document.getElementById('ownersPasswordConfirm');
const ownerFileInput         = document.getElementById('ownerFileInput');

if (ownersGrid) {
  const OWNERS_PASSWORD = '1234';
  let ownersEditMode = false;
  let changingOwnerId = null;

  const defaultOwners = [
    { id: 'hadi', name: 'Hadi Reslan', img: 'images/logo.jpeg' },
    { id: 'ali',  name: 'Ali Akhdar',  img: 'images/akhdar.jpeg' }
  ];

  async function getOwners() {
    const data = await fsGet('data/owners');
    return data ? data.owners : defaultOwners;
  }

  async function saveOwners(owners) {
    await fsSet('data/owners', { owners });
  }

  function renderOwners(owners) {
    ownersGrid.innerHTML = '';
    owners.forEach(owner => {
      const card = document.createElement('div');
      card.className = 'owner-card';
      card.innerHTML = `
        <img src="${owner.img}" alt="${owner.name}" />
        <span>${owner.name}</span>
        ${ownersEditMode ? `<button class="owner-change-photo-btn">📷 Change Photo</button>` : ''}`;

      if (ownersEditMode) {
        card.querySelector('.owner-change-photo-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          changingOwnerId = owner.id;
          ownerFileInput.value = '';
          ownerFileInput.click();
        });
      } else {
        card.addEventListener('click', () => {
          ownerPopupImg.src          = owner.img;
          ownerPopupImg.alt          = owner.name;
          ownerPopupName.textContent = owner.name;
          ownerOverlay.classList.add('open');
        });
      }
      ownersGrid.appendChild(card);
    });
  }

  ownerFileInput.addEventListener('change', () => {
    const file = ownerFileInput.files[0];
    if (!file || !changingOwnerId) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await openCropEditor(e.target.result);
      if (!result) return;
      const owners = await getOwners();
      const owner = owners.find(o => o.id === changingOwnerId);
      if (owner) owner.img = result;
      await saveOwners(owners);
      renderOwners(owners);
    };
    reader.readAsDataURL(file);
  });

  ownersEditBtn.addEventListener('click', () => {
    if (ownersEditMode) {
      ownersEditMode = false;
      ownersEditBtn.textContent = '✎ Edit';
      getOwners().then(renderOwners);
    } else {
      ownersPasswordInput.value = '';
      ownersPasswordError.classList.add('hidden');
      ownersPasswordOverlay.classList.add('open');
    }
  });

  ownersPasswordConfirm.addEventListener('click', () => {
    if (ownersPasswordInput.value === OWNERS_PASSWORD) {
      ownersPasswordOverlay.classList.remove('open');
      ownersEditMode = true;
      ownersEditBtn.textContent = '✔ Done';
      getOwners().then(renderOwners);
    } else {
      ownersPasswordError.classList.remove('hidden');
    }
  });

  ownersPasswordClose.addEventListener('click', () => ownersPasswordOverlay.classList.remove('open'));
  ownersPasswordOverlay.addEventListener('click', (e) => { if (e.target === ownersPasswordOverlay) ownersPasswordOverlay.classList.remove('open'); });
  ownerPopupClose.addEventListener('click', () => ownerOverlay.classList.remove('open'));
  ownerOverlay.addEventListener('click', (e) => { if (e.target === ownerOverlay) ownerOverlay.classList.remove('open'); });

  getOwners().then(renderOwners);
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
  shohadaOverlay.addEventListener('click', (e) => { if (e.target === shohadaOverlay) shohadaOverlay.classList.remove('open'); });
}
