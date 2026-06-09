/* ══════════════════════════════════════════════
   TEAM HUB — script.js
   ══════════════════════════════════════════════ */

'use strict';

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
let employees = LS.get('th_employees') || [];
let founder   = LS.get('th_founder')   || { ...DEFAULT_FOUNDER };
let editingId = null;
let activeFilter = 'all';

/* ── DOM REFS ────────────────────────────────── */
const $ = id => document.getElementById(id);
const teamGrid     = $('teamGrid');
const emptyState   = $('emptyState');
const searchInput  = $('searchInput');
const clearSearch  = $('clearSearch');
const filterChips  = $('filterChips');
const orgTree      = $('orgTree');

/* ════════════════════════════════════════════
   THEME
═════════════════════════════════════════════ */
function initTheme() {
  const saved = LS.get('th_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
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
  toastTimer = setTimeout(() => { t.classList.remove('show') }, 3000);
}

/* ════════════════════════════════════════════
   ANIMATED COUNTER
═════════════════════════════════════════════ */
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const dur = 1200;
  const step = t => {
    const prog = Math.min(t / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (prog < 1) requestAnimationFrame(t2 => step(t2 - t + t));
  };
  requestAnimationFrame(step);
}

function updateStats() {
  const total = employees.length + 1; // +1 founder
  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].length;
  const allSkills = employees.flatMap(e => (e.skills || '').split(',').map(s => s.trim()).filter(Boolean));
  const uniqueSkills = [...new Set(allSkills)].length;
  const totalCerts = employees.reduce((sum, e) => sum + (parseInt(e.certs) || 0), 0)
    + (parseInt(founder.certs) || 50);

  animateCounter($('statEmployees'), total);
  animateCounter($('statDepts'), Math.max(depts, 1));
  animateCounter($('statSkills'), uniqueSkills || 0);
  animateCounter($('statCerts'), totalCerts);
}

/* ════════════════════════════════════════════
   FOUNDER RENDERING
═════════════════════════════════════════════ */
function renderFounder() {
  $('founderName').textContent     = founder.name;
  $('founderPosition').textContent = founder.position;
  $('founderDesc').textContent     = founder.desc;
  $('founderCerts').textContent    = founder.certs;

  // Avatar
  const img = $('founderAvatar');
  const ph  = $('founderAvatarPlaceholder');
  if (founder.photo) {
    img.src = founder.photo;
    img.style.display = 'block';
    ph.style.display  = 'none';
  } else {
    img.style.display = 'none';
    ph.style.display  = 'grid';
  }

  // Skills
  const skillsEl = $('founderSkills');
  skillsEl.innerHTML = '';
  founder.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 12).forEach(s => {
    const b = document.createElement('span');
    b.className = 'skill-badge';
    b.textContent = s;
    skillsEl.appendChild(b);
  });
}

/* ════════════════════════════════════════════
   EMPLOYEE CARD BUILDER
═════════════════════════════════════════════ */
function buildCard(emp) {
  const card = document.createElement('div');
  card.className = 'emp-card';
  card.dataset.id = emp.id;

  const skills = (emp.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const skillsHtml = skills.slice(0, 5).map(s =>
    `<span class="skill-badge">${esc(s)}</span>`).join('') +
    (skills.length > 5 ? `<span class="skill-badge">+${skills.length - 5}</span>` : '');

  const avatarHtml = emp.photo
    ? `<img src="${emp.photo}" class="emp-avatar" alt="${esc(emp.name)}" />`
    : `<div class="emp-avatar-ph"><i class="fa-solid fa-user"></i></div>`;

  card.innerHTML = `
    <div class="emp-avatar-wrap">${avatarHtml}</div>
    <span class="emp-dept-tag">${esc(emp.department || 'No dept')}</span>
    <p class="emp-name">${esc(emp.name)}</p>
    <p class="emp-position">${esc(emp.position || '')}</p>
    ${emp.desc ? `<p class="emp-desc">${esc(emp.desc)}</p>` : ''}
    <div class="emp-skills">${skillsHtml}</div>
    ${emp.certs ? `<span class="emp-cert"><i class="fa-solid fa-award"></i> ${esc(emp.certs)} Certificates</span>` : ''}
    <div class="emp-card-actions">
      <button class="btn-primary view-btn">View Details</button>
      <button class="btn-icon edit edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
      <button class="btn-icon del del-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;

  card.querySelector('.view-btn').addEventListener('click', () => openDetailModal(emp.id));
  card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(emp.id));
  card.querySelector('.del-btn').addEventListener('click', () => deleteEmployee(emp.id));

  return card;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════════════
   RENDER EMPLOYEES
═════════════════════════════════════════════ */
function renderEmployees() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = employees.filter(emp => {
    const matchFilter = activeFilter === 'all' || emp.department === activeFilter;
    if (!matchFilter) return false;
    if (!query) return true;
    return (
      (emp.name || '').toLowerCase().includes(query) ||
      (emp.position || '').toLowerCase().includes(query) ||
      (emp.department || '').toLowerCase().includes(query) ||
      (emp.skills || '').toLowerCase().includes(query)
    );
  });

  // Clear non-empty-state children
  Array.from(teamGrid.children).forEach(c => {
    if (c !== emptyState) c.remove();
  });

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
  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  filterChips.innerHTML = '';

  const allChip = document.createElement('button');
  allChip.className = `chip ${activeFilter === 'all' ? 'active' : ''}`;
  allChip.textContent = 'All';
  allChip.dataset.filter = 'all';
  allChip.addEventListener('click', () => setFilter('all'));
  filterChips.appendChild(allChip);

  depts.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `chip ${activeFilter === d ? 'active' : ''}`;
    btn.textContent = d;
    btn.dataset.filter = d;
    btn.addEventListener('click', () => setFilter(d));
    filterChips.appendChild(btn);
  });
}

function setFilter(f) {
  activeFilter = f;
  renderEmployees();
}

/* ════════════════════════════════════════════
   ORG TREE
═════════════════════════════════════════════ */
function updateOrgTree() {
  orgTree.innerHTML = '';

  // Root
  const root = document.createElement('div');
  root.className = 'org-node root';
  root.textContent = `${founder.name} — ${founder.position}`;
  orgTree.appendChild(root);

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  if (depts.length === 0) return;

  const conn = document.createElement('div');
  conn.className = 'org-connector';
  orgTree.appendChild(conn);

  const levelEl = document.createElement('div');
  levelEl.className = 'org-level';

  depts.forEach(d => {
    const count = employees.filter(e => e.department === d).length;
    const node = document.createElement('div');
    node.className = 'org-node';
    node.innerHTML = `${esc(d)} <span style="font-weight:400;color:var(--text-2);font-size:11px;">(${count})</span>`;
    levelEl.appendChild(node);
  });

  orgTree.appendChild(levelEl);
}

/* ════════════════════════════════════════════
   ADD / EDIT MODAL
═════════════════════════════════════════════ */
let empPhotoData = '';

function openAddModal() {
  editingId = null;
  empPhotoData = '';
  resetEmpForm();
  $('modalTitle').textContent = 'Add New Employee';
  openModal('employeeModal');
}

function openEditModal(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  editingId = id;
  empPhotoData = emp.photo || '';

  $('empName').value       = emp.name || '';
  $('empPosition').value   = emp.position || '';
  $('empDepartment').value = emp.department || '';
  $('empDesc').value       = emp.desc || '';
  $('empSkills').value     = emp.skills || '';
  $('empCerts').value      = emp.certs || '';
  $('empEmail').value      = emp.email || '';
  $('empPhone').value      = emp.phone || '';
  $('empJoining').value    = emp.joining || '';

  const prev = $('previewImg');
  const ph   = $('uploadPlaceholder');
  if (emp.photo) {
    prev.src = emp.photo;
    prev.style.display = 'block';
    ph.style.display = 'none';
  } else {
    prev.style.display = 'none';
    ph.style.display = 'flex';
  }

  $('modalTitle').textContent = 'Edit Employee';
  openModal('employeeModal');
}

function resetEmpForm() {
  ['empName','empPosition','empDepartment','empDesc','empSkills',
   'empCerts','empEmail','empPhone','empJoining'].forEach(id => $(`${id}`).value = '');
  $('previewImg').style.display = 'none';
  $('uploadPlaceholder').style.display = 'flex';
  $('previewImg').src = '';
}

function saveEmployee() {
  const name = $('empName').value.trim();
  const pos  = $('empPosition').value.trim();
  const dept = $('empDepartment').value.trim();

  if (!name || !pos || !dept) {
    showToast('Please fill in Name, Position, and Department.', 'danger');
    return;
  }

  const emp = {
    id:         editingId || `emp_${Date.now()}`,
    name,
    position:   pos,
    department: dept,
    desc:       $('empDesc').value.trim(),
    skills:     $('empSkills').value.trim(),
    certs:      $('empCerts').value.trim(),
    email:      $('empEmail').value.trim(),
    phone:      $('empPhone').value.trim(),
    joining:    $('empJoining').value,
    photo:      empPhotoData
  };

  if (editingId) {
    const idx = employees.findIndex(e => e.id === editingId);
    if (idx !== -1) employees[idx] = emp;
    showToast(`${name} updated successfully!`);
  } else {
    employees.push(emp);
    showToast(`${name} added to the team!`);
  }

  LS.set('th_employees', employees);
  closeModal('employeeModal');
  renderEmployees();
}

function deleteEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  if (!confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
  employees = employees.filter(e => e.id !== id);
  LS.set('th_employees', employees);
  renderEmployees();
  showToast(`${emp.name} removed.`, 'danger');
}

/* ════════════════════════════════════════════
   DETAIL MODAL
═════════════════════════════════════════════ */
function openDetailModal(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;

  const skills = (emp.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const avatarHtml = emp.photo
    ? `<img src="${emp.photo}" class="detail-avatar" />`
    : `<div class="detail-avatar-ph"><i class="fa-solid fa-user"></i></div>`;

  $('detailBody').innerHTML = `
    <div class="detail-top">
      <div class="detail-avatar-wrap">${avatarHtml}</div>
      <div>
        <div class="detail-name">${esc(emp.name)}</div>
        <div class="detail-pos">${esc(emp.position || '')}</div>
        <span class="detail-dept">${esc(emp.department || '')}</span>
      </div>
    </div>
    ${emp.desc ? `
    <div class="detail-section">
      <h4>About</h4>
      <div class="detail-desc">${esc(emp.desc)}</div>
    </div>` : ''}
    <div class="detail-section">
      <h4>Details</h4>
      <div class="detail-meta-grid">
        ${emp.email   ? `<div class="detail-meta-item"><span>Email</span><span>${esc(emp.email)}</span></div>` : ''}
        ${emp.phone   ? `<div class="detail-meta-item"><span>Phone</span><span>${esc(emp.phone)}</span></div>` : ''}
        ${emp.joining ? `<div class="detail-meta-item"><span>Joined</span><span>${formatDate(emp.joining)}</span></div>` : ''}
        ${emp.certs   ? `<div class="detail-meta-item"><span>Certificates</span><span>${esc(emp.certs)}</span></div>` : ''}
      </div>
    </div>
    ${skills.length ? `
    <div class="detail-section">
      <h4>Skills</h4>
      <div class="detail-skills">${skills.map(s => `<span class="skill-badge">${esc(s)}</span>`).join('')}</div>
    </div>` : ''}
  `;

  openModal('detailModal');
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) }
  catch { return d }
}

/* ════════════════════════════════════════════
   FOUNDER MODAL
═════════════════════════════════════════════ */
let founderPhotoData = '';

function openFounderSettings() {
  founderPhotoData = founder.photo || '';
  $('fName').value     = founder.name;
  $('fPosition').value = founder.position;
  $('fDesc').value     = founder.desc;
  $('fSkills').value   = founder.skills;
  $('fCerts').value    = founder.certs;

  const prev = $('founderPreviewImg');
  const ph   = $('founderUploadPlaceholder');
  const rmBtn = $('removeFounderPhoto');
  if (founder.photo) {
    prev.src = founder.photo;
    prev.style.display = 'block';
    ph.style.display = 'none';
    rmBtn.style.display = '';
  } else {
    prev.style.display = 'none';
    ph.style.display = 'flex';
    rmBtn.style.display = 'none';
  }

  openModal('founderModal');
}

function saveFounder() {
  founder = {
    name:     $('fName').value.trim() || founder.name,
    position: $('fPosition').value.trim() || founder.position,
    desc:     $('fDesc').value.trim() || founder.desc,
    skills:   $('fSkills').value.trim() || founder.skills,
    certs:    $('fCerts').value.trim() || founder.certs,
    photo:    founderPhotoData
  };
  LS.set('th_founder', founder);
  renderFounder();
  closeModal('founderModal');
  showToast('Founder profile updated!');
  updateStats();
}

/* ════════════════════════════════════════════
   PHOTO UPLOAD HELPERS
═════════════════════════════════════════════ */
function setupPhotoUpload(areaId, inputId, previewId, placeholderId, onData) {
  const area = $(areaId);
  const input = $(inputId);
  const prev = $(previewId);
  const ph = $(placeholderId);

  area.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target.result;
      prev.src = data;
      prev.style.display = 'block';
      ph.style.display = 'none';
      onData(data);
      input.value = '';
    };
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════
   EXPORT / IMPORT
═════════════════════════════════════════════ */
function exportData() {
  const data = { employees, founder, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teamhub_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.employees) {
        employees = data.employees;
        LS.set('th_employees', employees);
      }
      if (data.founder) {
        founder = data.founder;
        LS.set('th_founder', founder);
        renderFounder();
      }
      renderEmployees();
      showToast(`Imported ${employees.length} employee(s)!`);
    } catch {
      showToast('Invalid JSON file.', 'danger');
    }
  };
  reader.readAsText(file);
}

/* ════════════════════════════════════════════
   MODAL HELPERS
═════════════════════════════════════════════ */
function openModal(id) {
  $(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  $(id).classList.remove('open');
  document.body.style.overflow = '';
}

/* ════════════════════════════════════════════
   AOS
═════════════════════════════════════════════ */
function initAOS() {
  const els = document.querySelectorAll('[data-aos]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const delay = parseInt(en.target.dataset.delay || 0);
        setTimeout(() => en.target.classList.add('aos-animate'), delay);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════
   EVENT BINDING
═════════════════════════════════════════════ */
function bindEvents() {
  // Theme
  $('themeToggle').addEventListener('click', toggleTheme);

  // Navbar add
  $('openAddModal').addEventListener('click', openAddModal);

  // Employee modal controls
  $('closeModal').addEventListener('click', () => closeModal('employeeModal'));
  $('cancelModal').addEventListener('click', () => closeModal('employeeModal'));
  $('saveEmployee').addEventListener('click', saveEmployee);

  // Founder modal
  $('openFounderSettings').addEventListener('click', openFounderSettings);
  $('closeFounderModal').addEventListener('click', () => closeModal('founderModal'));
  $('cancelFounderModal').addEventListener('click', () => closeModal('founderModal'));
  $('saveFounder').addEventListener('click', saveFounder);
  $('removeFounderPhoto').addEventListener('click', () => {
    founderPhotoData = '';
    $('founderPreviewImg').style.display = 'none';
    $('founderUploadPlaceholder').style.display = 'flex';
    $('removeFounderPhoto').style.display = 'none';
  });

  // Detail modal
  $('closeDetailModal').addEventListener('click', () => closeModal('detailModal'));

  // Close overlay on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) closeModal(ov.id);
    });
  });

  // Photo uploads
  setupPhotoUpload('photoUploadArea','empPhotoInput','previewImg','uploadPlaceholder', d => empPhotoData = d);
  setupPhotoUpload('founderPhotoArea','founderPhotoInput','founderPreviewImg','founderUploadPlaceholder', d => {
    founderPhotoData = d;
    $('removeFounderPhoto').style.display = '';
  });

  // Search
  searchInput.addEventListener('input', () => {
    clearSearch.style.display = searchInput.value ? '' : 'none';
    renderEmployees();
  });
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    renderEmployees();
  });

  // Export / Import
  $('exportBtn').addEventListener('click', exportData);
  $('importInput').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // Keyboard ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['employeeModal','founderModal','detailModal'].forEach(closeModal);
    }
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
