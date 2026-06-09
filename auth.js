/* ══════════════════════════════════════════════
   TEAM HUB — auth.js
   Password Protection for Edit / Delete / Founder
   ══════════════════════════════════════════════ */

'use strict';

// ── PASSWORD CONFIG ───────────────────────────
// Apna password yahan change kar sakte ho
const ADMIN_HASH = btoa(unescape(encodeURIComponent('@@PRINCE63@@')));

// ── AUTH STATE ────────────────────────────────
let authUnlocked = false;
let authTimer    = null;
const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes unlocked rehega

// ── CHECK PASSWORD ────────────────────────────
function checkPassword(input) {
  return btoa(unescape(encodeURIComponent(input.trim()))) === ADMIN_HASH;
}

// ── AUTO LOCK after 5 min ─────────────────────
function resetAuthTimer() {
  clearTimeout(authTimer);
  authTimer = setTimeout(() => {
    authUnlocked = false;
  }, AUTH_TIMEOUT);
}

// ── SHOW PASSWORD MODAL ───────────────────────
function requireAuth(onSuccess) {
  if (authUnlocked) {
    resetAuthTimer();
    onSuccess();
    return;
  }

  // Create modal
  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.85);
    backdrop-filter:blur(8px);
    display:grid;place-items:center;
    padding:20px;
  `;

  overlay.innerHTML = `
    <div style="
      background:var(--bg2);
      border:1px solid var(--border-glow);
      border-radius:20px;
      padding:36px 32px;
      width:100%;max-width:380px;
      box-shadow:0 24px 80px rgba(0,0,0,0.6);
      text-align:center;
      animation:authIn .3s cubic-bezier(.34,1.56,.64,1);
    ">
      <div style="
        width:56px;height:56px;border-radius:14px;
        background:linear-gradient(135deg,var(--accent),var(--accent-2));
        display:grid;place-items:center;
        margin:0 auto 20px;
        font-size:24px;
        box-shadow:0 8px 24px var(--accent-glow);
      ">🔐</div>

      <h3 style="
        font-family:var(--font-display);
        font-size:20px;font-weight:800;
        margin-bottom:8px;
      ">Admin Access Required</h3>

      <p style="
        color:var(--text-2);font-size:13px;
        margin-bottom:24px;line-height:1.6;
      ">Edit aur Delete karne ke liye<br>admin password daalo</p>

      <div style="position:relative;margin-bottom:16px;">
        <input
          type="password"
          id="authPasswordInput"
          placeholder="Enter admin password"
          style="
            width:100%;padding:12px 44px 12px 16px;
            border-radius:10px;
            border:1px solid var(--border);
            background:var(--surface);
            color:var(--text);font-size:14px;
            outline:none;
            transition:all .2s;
            font-family:var(--font-body);
          "
          autocomplete="off"
        />
        <button onclick="toggleAuthPwd()" id="authEyeBtn" style="
          position:absolute;right:12px;top:50%;
          transform:translateY(-50%);
          background:none;border:none;
          color:var(--text-3);cursor:pointer;
          font-size:15px;
        ">👁️</button>
      </div>

      <div id="authError" style="
        color:#ef4444;font-size:12px;
        margin-bottom:14px;min-height:18px;
      "></div>

      <div style="display:flex;gap:10px;">
        <button onclick="closeAuthModal()" style="
          flex:1;padding:11px;border-radius:10px;
          border:1px solid var(--border);
          background:transparent;
          color:var(--text-2);font-size:13px;
          font-weight:500;cursor:pointer;
          font-family:var(--font-body);
          transition:all .2s;
        " onmouseover="this.style.borderColor='var(--accent)'" 
           onmouseout="this.style.borderColor='var(--border)'">
          Cancel
        </button>
        <button onclick="submitAuthPassword()" id="authSubmitBtn" style="
          flex:2;padding:11px;border-radius:10px;
          border:none;
          background:linear-gradient(135deg,var(--accent),var(--accent-2));
          color:#fff;font-size:13px;font-weight:600;
          cursor:pointer;
          font-family:var(--font-body);
          box-shadow:0 4px 15px var(--accent-glow);
          transition:all .2s;
        ">
          🔓 Unlock
        </button>
      </div>

      <p style="
        color:var(--text-3);font-size:11px;
        margin-top:16px;
      ">5 minute tak unlocked rahega 🕐</p>
    </div>

    <style>
      @keyframes authIn {
        from { opacity:0; transform:translateY(20px) scale(.95) }
        to   { opacity:1; transform:none }
      }
      #authPasswordInput:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px var(--accent-glow);
      }
    </style>
  `;

  document.body.appendChild(overlay);

  // Store callback
  window._authCallback = onSuccess;

  // Focus input
  setTimeout(() => {
    const inp = document.getElementById('authPasswordInput');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAuthPassword();
        if (e.key === 'Escape') closeAuthModal();
      });
    }
  }, 100);
}

// ── TOGGLE PASSWORD VISIBILITY ────────────────
function toggleAuthPwd() {
  const inp = document.getElementById('authPasswordInput');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ── SUBMIT PASSWORD ───────────────────────────
function submitAuthPassword() {
  const inp = document.getElementById('authPasswordInput');
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');

  if (!inp) return;

  const val = inp.value;

  if (!val.trim()) {
    errEl.textContent = '⚠️ Password daalna zaroori hai!';
    inp.focus();
    return;
  }

  if (checkPassword(val)) {
    // Success
    authUnlocked = true;
    resetAuthTimer();
    closeAuthModal();

    if (typeof window._authCallback === 'function') {
      window._authCallback();
      window._authCallback = null;
    }
  } else {
    // Failed
    errEl.textContent = '❌ Galat password! Dobara try karo.';
    inp.value = '';
    inp.focus();

    // Shake animation
    inp.style.borderColor = '#ef4444';
    inp.style.animation = 'none';
    setTimeout(() => {
      inp.style.borderColor = '';
    }, 2000);
  }
}

// ── CLOSE AUTH MODAL ──────────────────────────
function closeAuthModal() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.remove();
  window._authCallback = null;
}

// ── CHANGE PASSWORD UTILITY ───────────────────
// Console se change karne ke liye:
// changeAdminPassword('naya_password')
function changeAdminPassword(newPwd) {
  if (!newPwd || newPwd.trim().length < 4) {
    console.warn('Password kam se kam 4 characters ka hona chahiye!');
    return;
  }
  console.log('New hash:', btoa(unescape(encodeURIComponent(newPwd.trim()))));
  console.log('auth.js file mein ADMIN_HASH ko upar wale value se replace karo.');
}
