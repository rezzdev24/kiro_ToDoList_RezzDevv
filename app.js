/* =============================================
   LIFE DASHBOARD — app.js
   Vanilla JavaScript · Local Storage only
   ============================================= */

'use strict';

/* ---- Utility: LocalStorage ---- */
const store = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ===================================================
   1. CLOCK & GREETING
   =================================================== */
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];

function getGreetingText(hour) {
  if (hour >= 4  && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();

  clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  dateEl.textContent  = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const name = store.get('userName', '');
  const base = getGreetingText(h);
  greetingEl.textContent = name ? `${base}, ${name}! 👋` : `${base}! 👋`;
}

setInterval(updateClock, 1000);
updateClock();

/* ===================================================
   2. CUSTOM NAME (Challenge: nama kustom)
   =================================================== */
const modalName      = document.getElementById('modal-name');
const inputName      = document.getElementById('input-name');
const btnSetName     = document.getElementById('btn-set-name');
const btnSaveName    = document.getElementById('btn-save-name');
const btnCancelName  = document.getElementById('btn-cancel-name');

btnSetName.addEventListener('click', () => {
  inputName.value = store.get('userName', '');
  modalName.classList.remove('hidden');
  inputName.focus();
});

btnSaveName.addEventListener('click', saveName);
inputName.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

function saveName() {
  const name = inputName.value.trim();
  store.set('userName', name);
  modalName.classList.add('hidden');
  updateClock();
}

btnCancelName.addEventListener('click', () => modalName.classList.add('hidden'));
modalName.addEventListener('click', (e) => { if (e.target === modalName) modalName.classList.add('hidden'); });

/* ===================================================
   3. LIGHT / DARK MODE (Challenge: light/dark mode)
   =================================================== */
const btnTheme = document.getElementById('btn-theme');
const html     = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  btnTheme.textContent = theme === 'dark' ? '☀️ Tema' : '🌙 Tema';
  store.set('theme', theme);
}

// Init theme from storage
applyTheme(store.get('theme', 'dark'));

btnTheme.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

/* ===================================================
   4. FOCUS TIMER (Challenge: ubah waktu Pomodoro)
   =================================================== */
const timerDisplay   = document.getElementById('timer-display');
const btnStart       = document.getElementById('btn-start');
const btnStop        = document.getElementById('btn-stop');
const btnReset       = document.getElementById('btn-reset');
const timerMinInput  = document.getElementById('timer-minutes');
const btnSetDuration = document.getElementById('btn-set-duration');

let timerDuration = store.get('timerDuration', 25); // minutes
let timerRemaining = timerDuration * 60;             // seconds
let timerInterval  = null;
let timerRunning   = false;

timerMinInput.value = timerDuration;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerRemaining);
  timerDisplay.classList.toggle('running', timerRunning && timerRemaining > 0);
  timerDisplay.classList.toggle('finished', timerRemaining === 0);
}

renderTimer();

btnStart.addEventListener('click', () => {
  if (timerRunning || timerRemaining === 0) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerRemaining--;
    renderTimer();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.add('finished');
      // Browser notification if permitted
      if (Notification && Notification.permission === 'granted') {
        new Notification('⏰ Fokus selesai!', { body: 'Waktumu habis. Istirahat dulu ya!' });
      }
    }
  }, 1000);
  renderTimer();
});

btnStop.addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  renderTimer();
});

btnReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = timerDuration * 60;
  renderTimer();
});

btnSetDuration.addEventListener('click', setTimerDuration);
timerMinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setTimerDuration(); });

function setTimerDuration() {
  const mins = parseInt(timerMinInput.value, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) {
    timerMinInput.style.borderColor = 'var(--danger)';
    setTimeout(() => { timerMinInput.style.borderColor = ''; }, 1500);
    return;
  }
  clearInterval(timerInterval);
  timerRunning   = false;
  timerDuration  = mins;
  timerRemaining = mins * 60;
  store.set('timerDuration', mins);
  renderTimer();
}

// Request notification permission once
if (Notification && Notification.permission === 'default') {
  Notification.requestPermission();
}

/* ===================================================
   5. TO-DO LIST  (Challenge: cegah duplikat)
   =================================================== */
const todoInput   = document.getElementById('todo-input');
const btnAddTodo  = document.getElementById('btn-add-todo');
const todoListEl  = document.getElementById('todo-list');
const todoEmptyEl = document.getElementById('todo-empty');

let todos = store.get('todos', []);
// Schema: { id, text, done }

function saveTodos() { store.set('todos', todos); }

function renderTodos() {
  todoListEl.innerHTML = '';
  todoEmptyEl.style.display = todos.length ? 'none' : 'block';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'todo-check';
    cb.checked   = todo.done;
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // Text
    const span = document.createElement('span');
    span.className   = 'todo-text';
    span.textContent = todo.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className   = 'btn btn-ghost btn-sm';
    editBtn.textContent = '✏️';
    editBtn.title       = 'Edit';
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, span));

    const delBtn = document.createElement('button');
    delBtn.className   = 'btn btn-danger btn-sm';
    delBtn.textContent = '🗑';
    delBtn.title       = 'Hapus';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    todoListEl.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Challenge: cegah duplikat (case-insensitive)
  const duplicate = todos.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    todoInput.style.borderColor = 'var(--warning)';
    todoInput.placeholder = '⚠️ Tugas sudah ada!';
    setTimeout(() => {
      todoInput.style.borderColor = '';
      todoInput.placeholder = 'Tambah tugas baru...';
    }, 2000);
    return;
  }

  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEditTodo(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value     = todo.text;
  editInput.maxLength = 100;

  span.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  const actions = li.querySelector('.todo-actions');
  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn btn-primary btn-sm';
  saveBtn.textContent = '✔';
  saveBtn.title       = 'Simpan';

  const cancelBtn = document.createElement('button');
  cancelBtn.className   = 'btn btn-ghost btn-sm';
  cancelBtn.textContent = '✕';
  cancelBtn.title       = 'Batal';

  actions.innerHTML = '';
  actions.append(saveBtn, cancelBtn);

  const commitEdit = () => {
    const newText = editInput.value.trim();
    if (!newText) { renderTodos(); return; }

    // Cegah duplikat saat edit
    const duplicate = todos.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (duplicate) {
      editInput.style.borderColor = 'var(--warning)';
      editInput.title = 'Tugas sudah ada!';
      return;
    }

    todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
    saveTodos();
    renderTodos();
  };

  saveBtn.addEventListener('click', commitEdit);
  cancelBtn.addEventListener('click', renderTodos);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') renderTodos();
  });
}

btnAddTodo.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

renderTodos();

/* ===================================================
   6. QUICK LINKS
   =================================================== */
const linkLabelInput = document.getElementById('link-label');
const linkUrlInput   = document.getElementById('link-url');
const btnAddLink     = document.getElementById('btn-add-link');
const linksGridEl    = document.getElementById('links-grid');
const linksEmptyEl   = document.getElementById('links-empty');

let links = store.get('quickLinks', []);
// Schema: { id, label, url }

function saveLinks() { store.set('quickLinks', links); }

function renderLinks() {
  linksGridEl.innerHTML = '';
  linksEmptyEl.style.display = links.length ? 'none' : 'block';

  links.forEach((link) => {
    const wrap = document.createElement('div');
    wrap.className = 'link-chip-wrap';

    const a = document.createElement('a');
    a.className = 'link-chip';
    a.href      = link.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.textContent = link.label;

    const delBtn = document.createElement('button');
    delBtn.className   = 'link-delete';
    delBtn.textContent = '✕';
    delBtn.title       = 'Hapus tautan';
    delBtn.addEventListener('click', () => deleteLink(link.id));

    wrap.append(a, delBtn);
    linksGridEl.appendChild(wrap);
  });
}

function addLink() {
  const label = linkLabelInput.value.trim();
  let   url   = linkUrlInput.value.trim();

  if (!label || !url) return;

  // Auto-prefix https if needed
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ id: Date.now(), label, url });
  saveLinks();
  renderLinks();
  linkLabelInput.value = '';
  linkUrlInput.value   = '';
  linkLabelInput.focus();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

btnAddLink.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();
