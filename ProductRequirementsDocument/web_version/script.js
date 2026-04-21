'use strict';

/* ════════════════════════════════════════════════════
   데이터 레이어
════════════════════════════════════════════════════ */

const STORAGE_KEY = 'todos';
let todos = [];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch {
    todos = [];
  }
  return todos;
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function addTodo(text, category) {
  const trimmed = String(text).trim();
  if (!trimmed) return null;
  const todo = {
    id:        generateId(),
    text:      trimmed,
    category,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  saveTodos();
  return todo;
}

function updateTodo(id, changes) {
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const { id: _id, createdAt: _ca, ...safeChanges } = changes;
  todos[idx] = { ...todos[idx], ...safeChanges };
  saveTodos();
  return todos[idx];
}

function deleteTodo(id) {
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return false;
  todos.splice(idx, 1);
  saveTodos();
  return true;
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return null;
  return updateTodo(id, { completed: !todo.completed });
}

function getStats() {
  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
  const byCategory = Object.fromEntries(
    ['work', 'personal', 'study'].map(cat => {
      const items = todos.filter(t => t.category === cat);
      return [cat, { total: items.length, completed: items.filter(t => t.completed).length }];
    })
  );
  return { total, completed, pct, byCategory };
}

function seedSampleData() {
  const samples = [
    { text: '주간 보고서 작성 및 제출',    category: 'work',     completed: true  },
    { text: 'JavaScript 비동기 처리 복습', category: 'study',    completed: false },
    { text: '저녁 운동 30분',              category: 'personal', completed: false },
  ];
  samples.forEach(({ text, category, completed }) => {
    const todo = addTodo(text, category);
    if (completed) updateTodo(todo.id, { completed: true });
  });
}

/* ════════════════════════════════════════════════════
   UI 레이어
════════════════════════════════════════════════════ */

const CAT_LABEL = { work: '업무', personal: '개인', study: '공부' };
const CAT_TITLE = { all: '전체 할일', work: '업무', personal: '개인', study: '공부' };
let activeFilter = 'all';
let lastAddedId  = null;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

function buildItemHTML(todo) {
  const done  = todo.completed;
  const isNew = todo.id === lastAddedId;
  const checkIcon = done
    ? `<svg class="todo-check__icon" viewBox="0 0 12 9"><polyline points="1 4.5 4.5 8 11 1"/></svg>`
    : '';
  const deleteIcon = `<svg width="14" height="14" viewBox="0 0 15 15" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <line x1="2" y1="2" x2="13" y2="13"/><line x1="13" y1="2" x2="2" y2="13"/>
  </svg>`;

  return `
    <article class="todo-item${done ? ' done' : ''}${isNew ? ' is-new' : ''}"
             data-cat="${todo.category}" data-id="${todo.id}">
      <div class="todo-check" data-action="toggle"
           aria-label="${done ? '완료 취소' : '완료로 표시'}">
        ${checkIcon}
      </div>
      <div class="todo-body">
        <p class="todo-text" data-action="edit"
           title="더블클릭하여 편집">${escapeHtml(todo.text)}</p>
        <div class="todo-meta">
          <span class="cat-badge cat-badge--${todo.category}">${CAT_LABEL[todo.category]}</span>
          <span class="todo-time">${formatTime(todo.createdAt)}</span>
        </div>
      </div>
      <button class="btn-delete" data-action="delete" aria-label="삭제">
        ${deleteIcon}
      </button>
    </article>`;
}

function renderTodos() {
  const list    = document.getElementById('todo-list');
  const visible = activeFilter === 'all'
    ? todos
    : todos.filter(t => t.category === activeFilter);
  const sorted  = [
    ...visible.filter(t => !t.completed),
    ...visible.filter(t =>  t.completed),
  ];

  list.innerHTML = sorted.length === 0
    ? `<div class="empty-state" aria-label="할일 없음">
         <div class="empty-state__icon">✅</div>
         <p class="empty-state__title">할일이 없습니다</p>
         <p class="empty-state__desc">상단 입력창에 할일을 추가해보세요.<br>
           카테고리를 선택하면 더 체계적으로 관리할 수 있어요.</p>
       </div>`
    : sorted.map(buildItemHTML).join('');

  updateProgressUI();
  updateBadges();
  updateListHeading();
}

function updateProgressUI() {
  const s = getStats();
  document.getElementById('progress-pct').textContent   = `${s.pct}%`;
  document.getElementById('progress-fill').style.width  = `${s.pct}%`;
  document.getElementById('progress-count').textContent = `${s.completed} / ${s.total} 완료`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', s.pct);
}

function updateBadges() {
  const s = getStats();
  document.getElementById('badge-all').textContent      = s.total;
  document.getElementById('badge-work').textContent     = s.byCategory.work.total;
  document.getElementById('badge-personal').textContent = s.byCategory.personal.total;
  document.getElementById('badge-study').textContent    = s.byCategory.study.total;
}

function updateListHeading() {
  const s     = getStats();
  const count = activeFilter === 'all'
    ? s.total
    : s.byCategory[activeFilter]?.total ?? 0;
  document.getElementById('list-title').textContent = CAT_TITLE[activeFilter] || '전체 할일';
  document.getElementById('list-sub').textContent   = `총 ${count}개`;
}

function renderDate() {
  const d    = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  document.getElementById('today-date').textContent =
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function shakeInput() {
  const el = document.getElementById('input-text');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

/* ════════════════════════════════════════════════════
   자동 카테고리 분류
════════════════════════════════════════════════════ */

const KEYWORD_MAP = {
  work: [
    '회의', '미팅', '보고서', '보고', '업무', '기획', '제안서', '계약',
    '영업', '마케팅', '출근', '야근', '출장', '결재', '거래처', '예산',
    '마감', '납기', '데드라인', 'meeting', 'report', 'deadline',
    '배포', '릴리즈', '버그', '수정', '서비스', '시스템', '인프라',
    '면접', '채용', '인사', '평가', '피드백', '발표', '프레젠테이션',
    '클라이언트', '고객', '협의', '협업', '팀', '팀장', '직장', '회사',
    '메일', '이메일', '슬랙', '기획서', '스펙', '요구사항',
  ],
  personal: [
    '운동', '헬스', '요가', '달리기', '조깅', '수영', '자전거', '등산',
    '청소', '빨래', '설거지', '요리', '장보기', '마트', '쇼핑',
    '병원', '약국', '진료', '건강', '검진', '약',
    '약속', '친구', '가족', '부모님', '여행', '휴가', '영화', '취미',
    '저금', '가계부', '통장', '보험', '세금', '납부',
    '미용실', '이발', '세탁', '수리', '택배',
    '산책', '명상', '일기', '스트레칭', '수면',
  ],
  study: [
    '공부', '학습', '강의', '수업', '과제', '시험', '복습', '예습',
    '교재', '논문', '리포트', '레포트', '발표준비',
    '영어', '수학', '과학', '역사', '국어',
    '일본어', '중국어', '독일어', '프랑스어', '스페인어',
    '자격증', '토익', '토플', '수능', '학교', '대학', '대학원',
    'javascript', 'python', 'java', 'css', 'html', 'react', 'vue',
    '알고리즘', '자료구조', '프로그래밍', '코딩', '개발공부',
    '인프런', '유데미', '강좌', '세미나', '컨퍼런스', '독서',
  ],
};

function classifyCategory(text) {
  const lower   = text.toLowerCase();
  const scores  = { work: 0, personal: 0, study: 0 };
  const matched = { work: [], personal: [], study: [] };

  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[cat]++;
        matched[cat].push(kw);
      }
    }
  }

  const sorted   = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  if (topScore === 0) return null;
  if (sorted[1][1] === topScore) return null;

  const cat = sorted[0][0];
  return { category: cat, keywords: matched[cat] };
}

function updateAutoHint(result) {
  const el = document.getElementById('auto-hint');
  if (!result) { el.hidden = true; return; }

  const kwHtml = result.keywords.slice(0, 2)
    .map(k => `<span class="auto-hint__kw">${escapeHtml(k)}</span>`)
    .join(' ');

  el.className = `auto-hint auto-hint--${result.category}`;
  el.hidden    = false;
  el.innerHTML =
    `✨ ${kwHtml} 키워드 → <strong>${CAT_LABEL[result.category]}</strong> 자동 분류
     <button class="auto-hint__dismiss" id="hint-dismiss" title="수동 선택으로 전환">✕</button>`;

  document.getElementById('hint-dismiss')
    .addEventListener('click', () => {
      userPickedCategory = true;
      el.hidden = true;
    });
}

let userPickedCategory = false;
let classifyTimer      = null;

function runClassify() {
  const text = document.getElementById('input-text').value;
  if (!text.trim()) { userPickedCategory = false; updateAutoHint(null); return; }
  if (userPickedCategory) return;
  const result = classifyCategory(text);
  if (result) document.getElementById('input-category').value = result.category;
  updateAutoHint(result);
}

/* ════════════════════════════════════════════════════
   액션 핸들러
════════════════════════════════════════════════════ */

function handleAdd() {
  const inputEl    = document.getElementById('input-text');
  const categoryEl = document.getElementById('input-category');
  const result     = addTodo(inputEl.value, categoryEl.value);
  if (!result) { shakeInput(); return; }
  lastAddedId        = result.id;
  userPickedCategory = false;
  inputEl.value      = '';
  updateAutoHint(null);
  inputEl.focus();
  renderTodos();
  lastAddedId = null;
}

function handleDelete(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (!item) return;
  item.classList.add('is-removing');
  setTimeout(() => { deleteTodo(id); renderTodos(); }, 230);
}

function startEdit(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const item = document.querySelector(`[data-id="${id}"]`);
  if (!item || item.classList.contains('editing')) return;

  item.classList.add('editing');
  const body = item.querySelector('.todo-body');

  body.innerHTML = `
    <input class="inline-edit" type="text"
           value="${escapeHtml(todo.text)}" maxlength="100"
           aria-label="할일 편집" />
    <div class="todo-meta">
      <span class="cat-badge cat-badge--${todo.category}">${CAT_LABEL[todo.category]}</span>
      <span class="todo-time">${formatTime(todo.createdAt)}</span>
    </div>`;

  const input = body.querySelector('.inline-edit');
  input.focus();
  input.select();

  let handled = false;

  function commit() {
    if (handled) return;
    handled = true;
    const newText = input.value.trim();
    if (newText === '') {
      if (confirm('내용이 비어있습니다. 이 항목을 삭제할까요?')) deleteTodo(id);
      renderTodos();
      return;
    }
    if (newText !== todo.text) updateTodo(id, { text: newText });
    renderTodos();
  }

  function cancel() {
    if (handled) return;
    handled = true;
    renderTodos();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => { setTimeout(commit, 120); });
}

/* 다크모드 */
let darkMode = false;

function loadTheme() {
  darkMode = localStorage.getItem('theme') === 'dark';
  applyTheme();
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('btn-theme').textContent = darkMode ? '☀️ 라이트' : '🌙 다크';
}

/* 내보내기 / 가져오기 */
function exportTodos() {
  const json = JSON.stringify(todos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `todos-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importTodos(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error();
      const valid = data.every(t =>
        typeof t.id        === 'string' &&
        typeof t.text      === 'string' &&
        typeof t.completed === 'boolean' &&
        typeof t.createdAt === 'string' &&
        ['work', 'personal', 'study'].includes(t.category)
      );
      if (!valid) throw new Error();
      if (!confirm(`${data.length}개 항목을 불러옵니다.\n현재 데이터는 덮어씌워집니다. 계속할까요?`)) return;
      todos = data;
      saveTodos();
      renderTodos();
    } catch {
      alert('올바른 형식의 JSON 파일이 아닙니다.\n이 앱에서 내보낸 파일을 사용해주세요.');
    }
  };
  reader.readAsText(file);
}

/* ════════════════════════════════════════════════════
   이벤트 바인딩
════════════════════════════════════════════════════ */

document.getElementById('btn-add')
  .addEventListener('click', handleAdd);

document.getElementById('input-text')
  .addEventListener('keydown', e => { if (e.key === 'Enter') handleAdd(); });

document.getElementById('input-text')
  .addEventListener('input', () => {
    clearTimeout(classifyTimer);
    classifyTimer = setTimeout(runClassify, 150);
  });

document.getElementById('input-category')
  .addEventListener('change', () => {
    userPickedCategory = true;
    updateAutoHint(null);
  });

document.getElementById('todo-list')
  .addEventListener('click', e => {
    const item   = e.target.closest('[data-id]');
    if (!item) return;
    const action = e.target.closest('[data-action]')?.dataset.action;
    const id     = item.dataset.id;
    if (action === 'toggle') { toggleTodo(id); renderTodos(); }
    if (action === 'delete') { handleDelete(id); }
  });

document.getElementById('todo-list')
  .addEventListener('dblclick', e => {
    const textEl = e.target.closest('[data-action="edit"]');
    if (!textEl) return;
    const item = textEl.closest('[data-id]');
    if (item) startEdit(item.dataset.id);
  });

document.querySelector('.tabs')
  .addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (!tab) return;
    activeFilter = tab.dataset.filter;
    document.querySelectorAll('.tab').forEach(t => {
      const on = t.dataset.filter === activeFilter;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
    renderTodos();
  });

document.getElementById('btn-theme')
  .addEventListener('click', toggleDarkMode);

document.getElementById('btn-export')
  .addEventListener('click', exportTodos);

document.getElementById('btn-import')
  .addEventListener('click', () => document.getElementById('file-import').click());

document.getElementById('file-import')
  .addEventListener('change', e => {
    if (e.target.files[0]) importTodos(e.target.files[0]);
    e.target.value = '';
  });

/* ════════════════════════════════════════════════════
   초기화
════════════════════════════════════════════════════ */

function init() {
  loadTodos();
  if (todos.length === 0) seedSampleData();
  loadTheme();
  renderDate();
  renderTodos();
  document.getElementById('input-text').focus();
}

Object.assign(window, {
  loadTodos, saveTodos, addTodo, updateTodo,
  deleteTodo, toggleTodo, getStats, renderTodos,
  exportTodos, classifyCategory,
  get todos() { return todos; },
});

init();
