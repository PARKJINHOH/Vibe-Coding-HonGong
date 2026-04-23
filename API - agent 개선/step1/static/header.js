// ── Auth 상태 관리 ────────────────────────────────────────────────────────────
window.Auth = {
  _TK: 'auth_token',
  _NK: 'auth_nick',
  getToken()  { return localStorage.getItem(this._TK); },
  getNick()   { return localStorage.getItem(this._NK); },
  isLoggedIn(){ return !!this.getToken(); },
  setSession(token, nick) {
    localStorage.setItem(this._TK, token);
    localStorage.setItem(this._NK, nick);
  },
  clearSession() {
    localStorage.removeItem(this._TK);
    localStorage.removeItem(this._NK);
  },
  async logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    this.clearSession();
    window.location.href = '/';
  },
  authFetch(url, opts = {}) {
    const h = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (this.getToken()) h['Authorization'] = `Bearer ${this.getToken()}`;
    return fetch(url, { ...opts, headers: h });
  }
};

// ── 로그인 모달 콜백 ──────────────────────────────────────────────────────────
let _afterAuth = null;
window.openLoginModal = function(callback) {
  _afterAuth = callback || null;
  document.getElementById('_auth-overlay').classList.add('open');
  _showTab('login');
};

// ── 헤더 CSS ─────────────────────────────────────────────────────────────────
(function injectCSS() {
  const s = document.createElement('style');
  s.textContent = `
    .app-header {
      position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: 50;
      background: #fff; border-bottom: 1px solid #e5e9f5;
      display: flex; align-items: center; padding: 0 24px; gap: 20px;
      box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    }
    .hdr-logo {
      font-size: 1.1rem; font-weight: 800; color: #1a1a2e;
      text-decoration: none; white-space: nowrap;
    }
    .hdr-nav { display: flex; gap: 4px; flex: 1; }
    .hdr-nav a {
      padding: 6px 14px; border-radius: 8px; font-size: 0.88rem;
      font-weight: 500; color: #6b7280; text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }
    .hdr-nav a:hover  { background: #f0f4ff; color: #4f7df3; }
    .hdr-nav a.active { background: #eef3ff; color: #4f7df3; font-weight: 700; }
    .hdr-auth { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .hdr-login-btn {
      padding: 7px 18px; background: #4f7df3; color: #fff;
      border: none; border-radius: 8px; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .hdr-login-btn:hover { background: #3a68e0; }
    .hdr-user-wrap { position: relative; }
    .hdr-user-btn {
      padding: 7px 14px; background: #eef3ff; color: #2d4fa3;
      border: 1.5px solid #c3d0f8; border-radius: 8px;
      font-size: 0.88rem; font-weight: 600; cursor: pointer;
    }
    .hdr-user-btn:hover { background: #dde8ff; }
    .hdr-dropdown {
      display: none; position: absolute; top: calc(100% + 6px); right: 0;
      background: #fff; border: 1.5px solid #e5e9f5; border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1); min-width: 160px;
      overflow: hidden; z-index: 200;
    }
    .hdr-dropdown.open { display: block; }
    .hdr-dropdown a, .hdr-dropdown button {
      display: block; width: 100%; text-align: left;
      padding: 11px 16px; font-size: 0.88rem; color: #374151;
      text-decoration: none; border: none; background: none; cursor: pointer;
    }
    .hdr-dropdown a:hover, .hdr-dropdown button:hover { background: #f3f4f6; }
    .hdr-dropdown button.logout { color: #e63946; }

    /* 로그인/회원가입 모달 */
    #_auth-overlay {
      display: none; position: fixed; inset: 0; z-index: 300;
      background: rgba(0,0,0,0.5); align-items: center; justify-content: center;
    }
    #_auth-overlay.open { display: flex; }
    #_auth-modal {
      background: #fff; border-radius: 20px; width: 90%; max-width: 400px;
      padding: 32px; box-shadow: 0 8px 40px rgba(0,0,0,0.15); position: relative;
    }
    #_auth-close {
      position: absolute; top: 16px; right: 20px; background: none;
      border: none; font-size: 1.3rem; cursor: pointer; color: #9ca3af;
    }
    #_auth-close:hover { color: #374151; }
    ._auth-tabs { display: flex; border-bottom: 2px solid #f0f4f8; margin-bottom: 24px; }
    ._auth-tab {
      flex: 1; padding: 10px; background: none; border: none;
      font-size: 0.95rem; font-weight: 600; color: #9ca3af; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
    }
    ._auth-tab.active { color: #4f7df3; border-bottom-color: #4f7df3; }
    ._auth-form { display: none; flex-direction: column; gap: 12px; }
    ._auth-form.active { display: flex; }
    ._auth-form label { font-size: 0.8rem; font-weight: 600; color: #6b7280; margin-bottom: 2px; }
    ._auth-form input {
      padding: 10px 14px; border: 1.5px solid #d1d9f0; border-radius: 10px;
      font-size: 0.92rem; outline: none; transition: border-color 0.2s; width: 100%;
    }
    ._auth-form input:focus { border-color: #4f7df3; }
    ._auth-submit {
      margin-top: 4px; padding: 12px; background: #4f7df3; color: #fff;
      border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; transition: background 0.15s;
    }
    ._auth-submit:disabled { background: #a0b4e8; cursor: not-allowed; }
    ._auth-submit:not(:disabled):hover { background: #3a68e0; }
    ._auth-error {
      display: none; padding: 10px 12px; background: #fff0f0;
      border: 1px solid #fca5a5; border-radius: 8px;
      color: #b91c1c; font-size: 0.85rem;
    }
    ._auth-error.show { display: block; }
  `;
  document.head.appendChild(s);
})();

// ── 헤더 생성 ─────────────────────────────────────────────────────────────────
function _buildHeader() {
  const cur = window.location.pathname;
  const nav = [
    ['/', '재료 인식'],
    ['/recipe', '레시피 추천'],
    ['/myrecipes', 'My 레시피'],
  ].map(([href, label]) =>
    `<a href="${href}" class="hdr-nav-link ${cur === href ? 'active' : ''}">${label}</a>`
  ).join('');

  const el = document.createElement('header');
  el.className = 'app-header';
  el.innerHTML = `
    <a href="/" class="hdr-logo">🧊 냉장고 레시피</a>
    <nav class="hdr-nav">${nav}</nav>
    <div class="hdr-auth" id="_hdr-auth"></div>
  `;
  document.body.insertAdjacentElement('afterbegin', el);
  document.body.style.paddingTop = '60px';
  _renderAuth();
}

function _renderAuth() {
  const area = document.getElementById('_hdr-auth');
  if (!area) return;
  if (Auth.isLoggedIn()) {
    area.innerHTML = `
      <div class="hdr-user-wrap">
        <button class="hdr-user-btn" id="_hdr-user-btn">👤 ${Auth.getNick()} ▾</button>
        <div class="hdr-dropdown" id="_hdr-dropdown">
          <a href="/myrecipes">My 레시피</a>
          <a href="/profile">프로필 설정</a>
          <button class="logout" onclick="Auth.logout()">로그아웃</button>
        </div>
      </div>`;
    document.getElementById('_hdr-user-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('_hdr-dropdown').classList.toggle('open');
    });
    // Remove any previously registered dropdown-close handler before adding a new one.
    // Without this, every _renderAuth() call (login/logout cycle) stacks another listener.
    if (window._hdrDropdownCloseHandler) {
      document.removeEventListener('click', window._hdrDropdownCloseHandler);
    }
    window._hdrDropdownCloseHandler = () => {
      const dd = document.getElementById('_hdr-dropdown');
      if (dd) dd.classList.remove('open');
    };
    document.addEventListener('click', window._hdrDropdownCloseHandler);
  } else {
    area.innerHTML = `<button class="hdr-login-btn" id="_hdr-login-btn">로그인</button>`;
    document.getElementById('_hdr-login-btn').addEventListener('click', () => openLoginModal());
  }
}
window._reloadHeader = _renderAuth;

// ── 로그인/회원가입 모달 ──────────────────────────────────────────────────────
function _buildAuthModal() {
  const div = document.createElement('div');
  div.id = '_auth-overlay';
  div.innerHTML = `
    <div id="_auth-modal">
      <button id="_auth-close">✕</button>
      <div class="_auth-tabs">
        <button class="_auth-tab active" data-tab="login">로그인</button>
        <button class="_auth-tab"        data-tab="signup">회원가입</button>
      </div>

      <!-- 로그인 폼 -->
      <form class="_auth-form active" id="_form-login">
        <div><label>이메일</label><input type="email" id="_l-email" placeholder="you@example.com" required /></div>
        <div><label>비밀번호</label><input type="password" id="_l-pw" placeholder="비밀번호" required /></div>
        <div class="_auth-error" id="_l-err"></div>
        <button type="submit" class="_auth-submit" id="_l-btn">로그인</button>
      </form>

      <!-- 회원가입 폼 -->
      <form class="_auth-form" id="_form-signup">
        <div><label>이메일</label><input type="email" id="_s-email" placeholder="you@example.com" required /></div>
        <div><label>닉네임</label><input type="text" id="_s-nick" placeholder="홍길동" required /></div>
        <div><label>비밀번호 (6자 이상)</label><input type="password" id="_s-pw" placeholder="비밀번호" required /></div>
        <div><label>비밀번호 확인</label><input type="password" id="_s-pw2" placeholder="비밀번호 확인" required /></div>
        <div class="_auth-error" id="_s-err"></div>
        <button type="submit" class="_auth-submit" id="_s-btn">회원가입</button>
      </form>
    </div>`;
  document.body.appendChild(div);

  // 닫기
  document.getElementById('_auth-close').addEventListener('click', _closeAuthModal);
  div.addEventListener('click', (e) => { if (e.target === div) _closeAuthModal(); });

  // 탭 전환
  div.querySelectorAll('._auth-tab').forEach(btn => {
    btn.addEventListener('click', () => _showTab(btn.dataset.tab));
  });

  // 로그인 제출
  document.getElementById('_form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('_l-btn');
    const err = document.getElementById('_l-err');
    btn.disabled = true; btn.textContent = '로그인 중…'; err.classList.remove('show');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('_l-email').value, password: document.getElementById('_l-pw').value }),
      });
      const d = await r.json();
      if (r.ok) { _onAuthSuccess(d.token, d.nickname); }
      else { _showErr('_l-err', d.detail || '로그인 실패'); }
    } catch { _showErr('_l-err', '네트워크 오류'); }
    finally { btn.disabled = false; btn.textContent = '로그인'; }
  });

  // 회원가입 제출
  document.getElementById('_form-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('_s-btn');
    const err = document.getElementById('_s-err');
    const pw  = document.getElementById('_s-pw').value;
    const pw2 = document.getElementById('_s-pw2').value;
    if (pw !== pw2) { _showErr('_s-err', '비밀번호가 일치하지 않습니다.'); return; }
    btn.disabled = true; btn.textContent = '가입 중…'; err.classList.remove('show');
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('_s-email').value, password: pw, nickname: document.getElementById('_s-nick').value }),
      });
      const d = await r.json();
      if (r.ok) { _onAuthSuccess(d.token, d.nickname); }
      else { _showErr('_s-err', d.detail || '가입 실패'); }
    } catch { _showErr('_s-err', '네트워크 오류'); }
    finally { btn.disabled = false; btn.textContent = '회원가입'; }
  });
}

function _showTab(tab) {
  document.querySelectorAll('._auth-tab').forEach(b  => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('._auth-form').forEach(f  => f.classList.toggle('active', f.id === `_form-${tab}`));
}
function _closeAuthModal() { document.getElementById('_auth-overlay').classList.remove('open'); }
function _showErr(id, msg)  { const el = document.getElementById(id); el.textContent = msg; el.classList.add('show'); }

function _onAuthSuccess(token, nick) {
  Auth.setSession(token, nick);
  _closeAuthModal();
  _renderAuth();
  if (_afterAuth) { const cb = _afterAuth; _afterAuth = null; cb(); }
  else if (['/myrecipes', '/profile'].includes(window.location.pathname)) {
    window.location.reload();
  }
}

// ── 초기화 ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _buildHeader();
  _buildAuthModal();
});
