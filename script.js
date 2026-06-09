/* ══════════════════════════════════════════════
   TEAM HUB — script.js (with built-in Auth)
   ══════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════
   AUTH SYSTEM
═════════════════════════════════════════════ */
const ADMIN_HASH = btoa(unescape(encodeURIComponent('@@PRINCE63@@')));
let authUnlocked = false;
let authTimer    = null;
const AUTH_TIMEOUT = 5 * 60 * 1000;

function checkPassword(input) {
  return btoa(unescape(encodeURIComponent(input.trim()))) === ADMIN_HASH;
}

function resetAuthTimer() {
  clearTimeout(authTimer);
  authTimer = setTimeout(() => { authUnlocked = false; }, AUTH_TIMEOUT);
}

function requireAuth(onSuccess) {
  if (authUnlocked) { resetAuthTimer(); onSuccess(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.88);
    backdrop-filter:blur(10px);
    display:grid;place-items:center;
    padding:20px;
    animation:fadeIn .2s ease;
  `;
  overlay.innerHTML = `
    <style>
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes popIn{from{opacity:0;transform:scale(.9) translateY(16px)}to{opacity:1;transform:none}}
      #authBox{animation:popIn .3s cubic-bezier(.34,1.56,.64,1)}
      #authPwdInput{
        width:100%;padding:13px 46px 13px 16px;
        border-radius:10px;border:1px solid var(--border);
        background:var(--surface);color:var(--text);
        font-size:14px;outline:none;
        transition:all .2s;font-family:var(--font-body);
        box-sizing:border-box;
      }
      #authPwdInput:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
      #authPwdInput.shake{animation:shake .4s ease}
      @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
    </style>
    <div id="authBox" style="
      background:var(--bg2);
      border:1px solid var(--border-glow);
      border-radius:22px;padding:40px 32px 32px;
      width:100%;max-width:360px;text-align:center;
      box-shadow:0 24px 80px rgba(0,0,0,0.6);
    ">
      <div style="width:60px;height:60px;border-radius:16px;
        background:linear-gradient(135deg,var(--accent),var(--accent-2));
        display:grid;place-items:center;margin:0 auto 18px;
        font-size:26px;box-shadow:0 8px 24px var(--accent-glow);">🔐</div>
      <h3 style="font-family:var(--font-display);font-size:21px;font-weight:800;margin-bottom:6px;">Admin Verification</h3>
      <p style="color:var(--text-2);font-size:13px;margin-bottom:24px;line-height:1.6;">
        Is action ke liye admin<br>password required hai
      </p>
      <div style="position:relative;margin-bottom:10px;">
        <input type="password" id="authPwdInput" placeholder="Password daalo…" autocomplete="off" />
        <button id="authEyeBtn" onclick="
          var i=document.getElementById('authPwdInput');
          i.type=i.type==='password'?'text':'password';
          this.textContent=i.type==='password'?'👁️':'🙈';
        " style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;font-size:16px;">👁️</button>
      </div>
      <div id="authErr" style="color:#ef4444;font-size:12px;min-height:20px;margin-bottom:14px;"></div>
      <div style="display:flex;gap:10px;">
        <button onclick="closeAuthModal()" style="
          flex:1;padding:12px;border-radius:10px;border:1px solid var(--border);
          background:transparent;color:var(--text-2);font-size:13px;font-weight:500;
          cursor:pointer;font-family:var(--font-body);transition:all .2s;
        ">Cancel</button>
        <button id="authOkBtn" style="
          flex:2;padding:12px;border-radius:10px;border:none;
          background:linear-gradient(135deg,var(--accent),var(--accent-2));
          color:#fff;font-size:13px;font-weight:700;cursor:pointer;
          font-family:var(--font-body);
          box-shadow:0 4px 15px var(--accent-glow);
        ">🔓 Unlock</button>
      </div>
      <p style="color:var(--text-3);font-size:11px;margin-top:14px;">5 min tak unlocked rahega 🕐</p>
    </div>
  `;
  document.body.appendChild(overlay);
  window._authCb = onSuccess;

  setTimeout(() => {
    const inp = document.getElementById('authPwdInput');
    const btn = document.getElementById('authOkBtn');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAuth();
        if (e.key === 'Escape') closeAuthModal();
      });
    }
    if (btn) btn.addEventListener('click', submitAuth);
  }, 80);
}

function submitAuth() {
  const inp = document.getElementById('authPwdInput');
  const err = document.getElementById('authErr');
  if (!inp) return;
  if (!inp.value.trim()) {
    err.textContent = '⚠️ Password daalna zaroori hai!';
    inp.focus(); return;
  }
  if (checkPassword(inp.value)) {
    authUnlocked = true;
    resetAuthTimer();
    closeAuthModal();
    if (typeof window._authCb === 'function') {
      window._authCb();
      window._authCb = null;
    }
  } else {
    err.textContent = '❌ Galat password! Dobara try karo.';
    inp.value = '';
    inp.className = '';
    void inp.offsetWidth;
    inp.className = 'shake';
    inp.style.borderColor = '#ef4444';
    setTimeout(() => { inp.style.borderColor = ''; inp.className = ''; }, 1500);
    inp.focus();
  }
}

function closeAuthModal() {
  const o = document.getElementById('authOverlay');
  if (o) o.remove();
  window._authCb = null;
}

/* ── STORAGE HELPERS ─────────────────────────── */
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  rm: k => localStorage.removeItem(k)
};

/* ── DEFAULT FOUNDER DATA ────────────────────── */
const DEFAULT_FOUNDER = {
  name: 'Prince Verma',
  position: 'Founder & CEO',
  desc: 'Visionary leader driving innovation across AI, marketing, and technology. With 50+ certifications and deep expertise in business strategy and automation, Prince shapes the future of the company.',
  skills: 'AI Analytics,Data Analysis,SEO,Digital Marketing,Google Analytics,Content Writing,Graphic Design,Video Editing,Business Strategy,Branding,Automation,Reporting,Technology Solutions',
  certs: '50+',
  photo: ''
};

/* ── STATE ───────────────────────────────────── */
let employees    = LS.get('th_employees') || [];
let founder      = LS.get('th_founder')   || { ...DEFAULT_FOUNDER };
let editingId    = null;
let activeFilter = 'all';

/* ── DOM REFS ────────────────────────────────── */
const $ = id => document.getElementById(id);
const teamGrid    = $('teamGrid');
const emptyState  = $('emptyState');
const searchInput = $('searchInput');
const clearSearch = $('clearSearch');
const filterChips = $('filterChips');
const orgTree     = $('orgTree');

/* ════════════════════════════════════════════
   THEME
═════════════════════════════════════════════ */
function initTheme() {
  const saved = LS.get('th_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  LS.set('th_theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  $('themeToggle').innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* ════════════════════════════════════════════
   TOAST
═════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ════════════════════════════════════════════
   ANIMATED COUNTER
═════════════════════════════════════════════ */
function animateCounter(el, target) {
  const dur = 1200;
  const step = t => {
    const prog = Math.min(t / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    el.textContent = Math.round(ease * target);
    if (prog < 1) requestAnimationFrame(t2 => step(t2 - t + t));
  };
  requestAnimationFrame(step);
}

function updateStats() {
  const total      = employees.length + 1;
  const depts      = [...new Set(employees.map(e => e.department).filter(Boolean))].length;
  const allSkills  = employees.flatMap(e => (e.skills||'').split(',').map(s=>s.trim()).filter(Boolean));
  const uniqSkills = [...new Set(allSkills)].length;
  const totalCerts = employees.reduce((s,e) => s + (parseInt(e.certs)||0), 0)
                   + (parseInt(founder.certs)||50);
  animateCounter($('statEmployees'), total);
  animateCounter($('statDepts'),     Math.max(depts, 1));
  animateCounter($('statSkills'),    uniqSkills);
  animateCounter($('statCerts'),     totalCerts);
}

/* ════════════════════════════════════════════
   FOUNDER RENDER
═════════════════════════════════════════════ */
function renderFounder() {
  $('founderName').textContent     = founder.name;
  $('founderPosition').textContent = founder.position;
  $('founderDesc').textContent     = founder.desc;
  $('founderCerts').textContent    = founder.certs;

  const img = $('founderAvatar');
  const ph  = $('founderAvatarPlaceholder');
  if (founder.photo) {
    img.src = founder.photo; img.style.display = 'block'; ph.style.display = 'none';
  } else {
    img.style.display = 'none'; ph.style.display = 'grid';
  }

  const skillsEl = $('founderSkills');
  skillsEl.innerHTML = '';
  founder.skills.split(',').map(s=>s.trim()).filter(Boolean).slice(0,12).forEach(s => {
    const b = document.createElement('span');
    b.className = 'skill-badge'; b.textContent = s;
    skillsEl.appendChild(b);
  });
}

/* ════════════════════════════════════════════
   EMPLOYEE CARD
═════════════════════════════════════════════ */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildCard(emp) {
  const card = document.createElement('div');
  card.className = 'emp-card';
  card.dataset.id = emp.id;

  const skills     = (emp.skills||'').split(',').map(s=>s.trim()).filter(Boolean);
  const skillsHtml = skills.slice(0,5).map(s=>`<span class="skill-badge">${esc(s)}</span>`).join('')
    + (skills.length > 5 ? `<span class="skill-badge">+${skills.length-5}</span>` : '');
  const avatarHtml = emp.photo
    ? `<img src="${emp.photo}" class="emp-avatar" alt="${esc(emp.name)}" />`
    : `<div class="emp-avatar-ph"><i class="fa-solid fa-user"></i></div>`;

  card.innerHTML = `
    <div class="emp-avatar-wrap">${avatarHtml}</div>
    <span class="emp-dept-tag">${esc(emp.department||'No dept')}</span>
    <p class="emp-name">${esc(emp.name)}</p>
    <p class="emp-position">${esc(emp.position||'')}</p>
    ${emp.desc ? `<p class="emp-desc">${esc(emp.desc)}</p>` : ''}
    <div class="emp-skills">${skillsHtml}</div>
    ${emp.certs ? `<span class="emp-cert"><i class="fa-solid fa-award"></i> ${esc(emp.certs)} Certificates</span>` : ''}
    <div class="emp-card-actions">
      <button class="btn-primary view-btn">View Details</button>
      <button class="btn-icon edit edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-icon del del-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;

  card.querySelector('.view-btn').addEventListener('click',  ()  => openDetailModal(emp.id));
  card.querySelector('.edit-btn').addEventListener('click',  ()  => requireAuth(() => openEditModal(emp.id)));
  card.querySelector('.del-btn').addEventListener('click',   ()  => requireAuth(() => deleteEmployee(emp.id)));
  return card;
}

/* ════════════════════════════════════════════
   RENDER EMPLOYEES
═════════════════════════════════════════════ */
function renderEmployees() {
  const query    = searchInput.value.trim().toLowerCase();
  const filtered = employees.filter(emp => {
    if (activeFilter !== 'all' && emp.department !== activeFilter) return false;
    if (!query) return true;
    return (
      (emp.name||'').toLowerCase().includes(query) ||
      (emp.position||'').toLowerCase().includes(query) ||
      (emp.department||'').toLowerCase().includes(query) ||
      (emp.skills||'').toLowerCase().includes(query)
    );
  });

  Array.from(teamGrid.children).forEach(c => { if (c !== emptyState) c.remove(); });

  if (filtered.length === 0) {
    emptyState.style.display = '';
    emptyState.innerHTML = employees.length === 0
      ? '<i class="fa-solid fa-people-group"></i><p>No employees yet. Click <strong>Add Employee</strong> to get started.</p>'
      : '<i class="fa-solid fa-magnifying-glass"></i><p>No results match your search.</p>';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach((emp, i) => {
      const card = buildCard(emp);
      card.style.animationDelay = `${i * 60}ms`;
      teamGrid.appendChild(card);
    });
  }
  updateFilterChips();
  updateOrgTree();
  updateStats();
}

/* ════════════════════════════════════════════
   FILTER CHIPS
═════════════════════════════════════════════ */
function updateFilterChips() {
  const depts = [...new Set(employees.map(e=>e.department).filter(Boolean))].sort();
  filterChips.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = `chip ${activeFilter==='all'?'active':''}`;
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => setFilter('all'));
  filterChips.appendChild(allChip);
  depts.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `chip ${activeFilter===d?'active':''}`;
    btn.textContent = d;
    btn.addEventListener('click', () => setFilter(d));
    filterChips.appendChild(btn);
  });
}
function setFilter(f) { activeFilter = f; renderEmployees(); }

/* ════════════════════════════════════════════
   ORG TREE
═════════════════════════════════════════════ */
function updateOrgTree() {
  orgTree.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'org-node root';
  root.textContent = `${founder.name} — ${founder.position}`;
  orgTree.appendChild(root);

  const depts = [...new Set(employees.map(e=>e.department).filter(Boolean))].sort();
  if (!depts.length) return;

  const conn = document.createElement('div');
  conn.className = 'org-connector';
  orgTree.appendChild(conn);

  const levelEl = document.createElement('div');
  levelEl.className = 'org-level';
  depts.forEach(d => {
    const count = employees.filter(e=>e.department===d).length;
    const node  = document.createElement('div');
    node.className = 'org-node';
    node.innerHTML = `${esc(d)} <span style="font-weight:400;color:var(--text-2);font-size:11px;">(${count})</span>`;
    levelEl.appendChild(node);
  });
  orgTree.appendChild(levelEl);
}

/* ════════════════════════════════════════════
   ADD / EDIT EMPLOYEE
═════════════════════════════════════════════ */
let empPhotoData = '';

function openAddModal() {
  editingId = null; empPhotoData = '';
  resetEmpForm();
  $('modalTitle').textContent = 'Add New Employee';
  openModal('employeeModal');
}

function openEditModal(id) {
  const emp = employees.find(e=>e.id===id);
  if (!emp) return;
  editingId = id; empPhotoData = emp.photo||'';
  $('empName').value       = emp.name||'';
  $('empPosition').value   = emp.position||'';
  $('empDepartment').value = emp.department||'';
  $('empDesc').value       = emp.desc||'';
  $('empSkills').value     = emp.skills||'';
  $('empCerts').value      = emp.certs||'';
  $('empEmail').value      = emp.email||'';
  $('empPhone').value      = emp.phone||'';
  $('empJoining').value    = emp.joining||'';
  const prev=$('previewImg'), ph=$('uploadPlaceholder');
  if (emp.photo) { prev.src=emp.photo; prev.style.display='block'; ph.style.display='none'; }
  else           { prev.style.display='none'; ph.style.display='flex'; }
  $('modalTitle').textContent = 'Edit Employee';
  openModal('employeeModal');
}

function resetEmpForm() {
  ['empName','empPosition','empDepartment','empDesc','empSkills',
   'empCerts','empEmail','empPhone','empJoining'].forEach(id => $(id).value='');
  $('previewImg').style.display='none'; $('uploadPlaceholder').style.display='flex'; $('previewImg').src='';
}

function saveEmployee() {
  const name = $('empName').value.trim();
  const pos  = $('empPosition').value.trim();
  const dept = $('empDepartment').value.trim();
  if (!name||!pos||!dept) { showToast('Name, Position aur Department zaroori hai!','danger'); return; }

  const emp = {
    id: editingId||`emp_${Date.now()}`, name, position:pos, department:dept,
    desc:$('empDesc').value.trim(), skills:$('empSkills').value.trim(),
    certs:$('empCerts').value.trim(), email:$('empEmail').value.trim(),
    phone:$('empPhone').value.trim(), joining:$('empJoining').value, photo:empPhotoData
  };

  if (editingId) {
    const idx = employees.findIndex(e=>e.id===editingId);
    if (idx!==-1) employees[idx] = emp;
    showToast(`${name} update ho gaya!`);
  } else {
    employees.push(emp);
    showToast(`${name} team mein add ho gaya!`);
  }
  LS.set('th_employees', employees);
  closeModal('employeeModal');
  renderEmployees();
}

function deleteEmployee(id) {
  const emp = employees.find(e=>e.id===id);
  if (!emp) return;
  if (!confirm(`"${emp.name}" ko delete karna chahte ho? Yeh undo nahi hoga.`)) return;
  employees = employees.filter(e=>e.id!==id);
  LS.set('th_employees', employees);
  renderEmployees();
  showToast(`${emp.name} remove ho gaya.`, 'danger');
}

/* ════════════════════════════════════════════
   DETAIL MODAL
═════════════════════════════════════════════ */
function openDetailModal(id) {
  const emp = employees.find(e=>e.id===id);
  if (!emp) return;
  const skills     = (emp.skills||'').split(',').map(s=>s.trim()).filter(Boolean);
  const avatarHtml = emp.photo
    ? `<img src="${emp.photo}" class="detail-avatar" />`
    : `<div class="detail-avatar-ph"><i class="fa-solid fa-user"></i></div>`;

  $('detailBody').innerHTML = `
    <div class="detail-top">
      <div class="detail-avatar-wrap">${avatarHtml}</div>
      <div>
        <div class="detail-name">${esc(emp.name)}</div>
        <div class="detail-pos">${esc(emp.position||'')}</div>
        <span class="detail-dept">${esc(emp.department||'')}</span>
      </div>
    </div>
    ${emp.desc?`<div class="detail-section"><h4>About</h4><div class="detail-desc">${esc(emp.desc)}</div></div>`:''}
    <div class="detail-section"><h4>Details</h4><div class="detail-meta-grid">
      ${emp.email   ?`<div class="detail-meta-item"><span>Email</span><span>${esc(emp.email)}</span></div>`:''}
      ${emp.phone   ?`<div class="detail-meta-item"><span>Phone</span><span>${esc(emp.phone)}</span></div>`:''}
      ${emp.joining ?`<div class="detail-meta-item"><span>Joined</span><span>${formatDate(emp.joining)}</span></div>`:''}
      ${emp.certs   ?`<div class="detail-meta-item"><span>Certificates</span><span>${esc(emp.certs)}</span></div>`:''}
    </div></div>
    ${skills.length?`<div class="detail-section"><h4>Skills</h4><div class="detail-skills">${skills.map(s=>`<span class="skill-badge">${esc(s)}</span>`).join('')}</div></div>`:''}
  `;
  openModal('detailModal');
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) }
  catch { return d }
}

/* ════════════════════════════════════════════
   FOUNDER MODAL
═════════════════════════════════════════════ */
let founderPhotoData = '';

function openFounderSettings() {
  founderPhotoData = founder.photo||'';
  $('fName').value=$('founderName').textContent; $('fPosition').value=$('founderPosition').textContent;
  $('fDesc').value=founder.desc; $('fSkills').value=founder.skills; $('fCerts').value=founder.certs;
  const prev=$('founderPreviewImg'), ph=$('founderUploadPlaceholder'), rmBtn=$('removeFounderPhoto');
  if (founder.photo) { prev.src=founder.photo; prev.style.display='block'; ph.style.display='none'; rmBtn.style.display=''; }
  else               { prev.style.display='none'; ph.style.display='flex'; rmBtn.style.display='none'; }
  openModal('founderModal');
}

function saveFounder() {
  founder = {
    name:     $('fName').value.trim()||founder.name,
    position: $('fPosition').value.trim()||founder.position,
    desc:     $('fDesc').value.trim()||founder.desc,
    skills:   $('fSkills').value.trim()||founder.skills,
    certs:    $('fCerts').value.trim()||founder.certs,
    photo:    founderPhotoData
  };
  LS.set('th_founder', founder);
  renderFounder(); closeModal('founderModal');
  showToast('Founder profile update ho gaya!');
  updateStats();
}

/* ════════════════════════════════════════════
   PHOTO UPLOAD
═════════════════════════════════════════════ */
function setupPhotoUpload(areaId, inputId, previewId, phId, onData) {
  const area=$(areaId), input=$(inputId), prev=$(previewId), ph=$(phId);
  area.addEventListener('click', ()=>input.click());
  input.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      prev.src=ev.target.result; prev.style.display='block'; ph.style.display='none';
      onData(ev.target.result); input.value='';
    };
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════
   EXPORT / IMPORT
═════════════════════════════════════════════ */
function exportData() {
  const blob=new Blob([JSON.stringify({employees,founder,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`teamhub_${Date.now()}.json`; a.click();
  showToast('Data export ho gaya!');
}

function importData(file) {
  const reader=new FileReader();
  reader.onload=e=>{
    try {
      const data=JSON.parse(e.target.result);
      if(data.employees){ employees=data.employees; LS.set('th_employees',employees); }
      if(data.founder)  { founder=data.founder;     LS.set('th_founder',founder); renderFounder(); }
      renderEmployees();
      showToast(`${employees.length} employees import ho gaye!`);
    } catch { showToast('Invalid JSON file.','danger'); }
  };
  reader.readAsText(file);
}

/* ════════════════════════════════════════════
   MODAL HELPERS
═════════════════════════════════════════════ */
function openModal(id)  { $(id).classList.add('open');    document.body.style.overflow='hidden'; }
function closeModal(id) { $(id).classList.remove('open'); document.body.style.overflow=''; }

/* ════════════════════════════════════════════
   AOS
═════════════════════════════════════════════ */
function initAOS() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        setTimeout(()=>en.target.classList.add('aos-animate'), parseInt(en.target.dataset.delay||0));
        obs.unobserve(en.target);
      }
    });
  },{threshold:0.15});
  document.querySelectorAll('[data-aos]').forEach(el=>obs.observe(el));
}

/* ════════════════════════════════════════════
   EVENTS
═════════════════════════════════════════════ */
function bindEvents() {
  $('themeToggle').addEventListener('click', toggleTheme);

  // Add Employee — auth required
  $('openAddModal').addEventListener('click', () => requireAuth(() => openAddModal()));

  // Employee modal
  $('closeModal').addEventListener('click',   () => closeModal('employeeModal'));
  $('cancelModal').addEventListener('click',  () => closeModal('employeeModal'));
  $('saveEmployee').addEventListener('click', saveEmployee);

  // Founder — auth required
  $('openFounderSettings').addEventListener('click', () => requireAuth(() => openFounderSettings()));
  $('closeFounderModal').addEventListener('click',   () => closeModal('founderModal'));
  $('cancelFounderModal').addEventListener('click',  () => closeModal('founderModal'));
  $('saveFounder').addEventListener('click', saveFounder);
  $('removeFounderPhoto').addEventListener('click', () => {
    founderPhotoData='';
    $('founderPreviewImg').style.display='none';
    $('founderUploadPlaceholder').style.display='flex';
    $('removeFounderPhoto').style.display='none';
  });

  // Detail modal
  $('closeDetailModal').addEventListener('click', () => closeModal('detailModal'));

  // Backdrop close
  document.querySelectorAll('.modal-overlay').forEach(ov=>{
    ov.addEventListener('click', e=>{ if(e.target===ov) closeModal(ov.id); });
  });

  // Photo uploads
  setupPhotoUpload('photoUploadArea','empPhotoInput','previewImg','uploadPlaceholder', d=>empPhotoData=d);
  setupPhotoUpload('founderPhotoArea','founderPhotoInput','founderPreviewImg','founderUploadPlaceholder', d=>{
    founderPhotoData=d; $('removeFounderPhoto').style.display='';
  });

  // Search
  searchInput.addEventListener('input', ()=>{
    clearSearch.style.display = searchInput.value?'':'none';
    renderEmployees();
  });
  clearSearch.addEventListener('click', ()=>{
    searchInput.value=''; clearSearch.style.display='none'; renderEmployees();
  });

  // Export / Import
  $('exportBtn').addEventListener('click', exportData);
  $('importInput').addEventListener('change', e=>{ if(e.target.files[0]) importData(e.target.files[0]); e.target.value=''; });

  // ESC key
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape') ['employeeModal','founderModal','detailModal'].forEach(closeModal);
  });
}

/* ════════════════════════════════════════════
   INIT
═════════════════════════════════════════════ */
function init() {
  initTheme();
  renderFounder();
  renderEmployees();
  initAOS();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
