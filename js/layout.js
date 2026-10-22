/* =========================================================================
   TaskFlow — layout.js  (Shared UI for all pages)
   Owner: Member 1 (Team Lead)

   This file does NOT save any data. It only builds the parts that are
   the same on every page, so nobody has to copy them.

   ── HOW TO USE ON YOUR PAGE ───────────────────────────────────────────
   1) Put these two empty tags in your HTML:
        <aside id="sidebar" class="sidebar"></aside>
        <header id="topbar" class="topbar"></header>

   2) Load this file BEFORE your own script:
        <script src="js/layout.js"></script>
        <script src="js/your-page.js"></script>

   3) In your script call:
        initPage('tasks', 'My Tasks', 'Stay organized');
                  ↑ page    ↑ title    ↑ subtitle (optional)

   ── FUNCTIONS YOU CAN USE ─────────────────────────────────────────────
     showToast('Task saved!', 'success')   → 'success' | 'error' | 'warning' | 'info'
     openModal('my-modal')                 → opens <div class="modal-overlay" id="my-modal">
     closeModal('my-modal')
     confirmDialog('Delete task?', 'This cannot be undone.', true)  → returns true / false (use await)
     icon('trash')                         → returns an SVG icon as text
     escapeHTML(text)                      → use when you put user text inside innerHTML
     formatDate('2026-10-25T14:00')        → "Oct 25, 2026, 2:00 PM"
   ========================================================================= */


/* =========================================================================
   1. ICONS  (simple SVG drawings — no icon library needed)
   ========================================================================= */
const ICONS = {
  logo:     '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  tasks:    '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  tag:      '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user:     '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  users:    '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.6"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  chart:    '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
  logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  login:    '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:     '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  bell:     '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  menu:     '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check:    '<path d="M20 6L9 17l-5-5"/>',
  x:        '<path d="M18 6L6 18M6 6l12 12"/>',
  info:     '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert:    '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  trash:    '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  edit:     '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  clock:    '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  flag:     '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  search:   '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  filter:   '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  sort:     '<path d="M3 6h13M3 12h9M3 18h5M17 8V20M14 17l3 3 3-3"/>',
  arrow:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  sparkle:  '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>'
};

/** Returns an SVG icon as text.  Example: button.innerHTML = icon('trash') + ' Delete'; */
function icon(name) {
  const drawing = ICONS[name] || ICONS.info;
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${drawing}</svg>`;
}


/* =========================================================================
   2. SIDEBAR LINKS  (add a new page here and it appears on every page)
   ========================================================================= */
const MENU_LINKS = [
  { page: 'tasks',      label: 'My Tasks',        href: 'tasks.html',      icon: 'tasks' },
  { page: 'task-form',  label: 'Add Task',        href: 'task-form.html',  icon: 'plus' },
  { page: 'categories', label: 'Categories',      href: 'categories.html', icon: 'tag' },
  { page: 'calendar',   label: 'Calendar',        href: 'calendar.html',   icon: 'calendar' },
  { page: 'profile',    label: 'Profile',         href: 'profile.html',    icon: 'user' }
];

const ADMIN_LINKS = [
  { page: 'admin',      label: 'Admin Dashboard', href: 'admin.html',      icon: 'shield' }
];


/* =========================================================================
   3. SIDEBAR
   ========================================================================= */
function renderSidebar(activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Builds one <li> link; adds "active" to the current page
  function makeLink(link) {
    const activeClass = link.page === activePage ? 'active' : '';
    return `
      <li>
        <a href="${link.href}" class="nav-link ${activeClass}" id="nav-${link.page}">
          ${icon(link.icon)}<span>${link.label}</span>
        </a>
      </li>`;
  }

  sidebar.innerHTML = `
    <a href="index.html" class="brand" id="sidebar-brand">
      <span class="brand-logo">${icon('logo')}</span>
      <span>Task<span class="text-gradient">Flow</span></span>
    </a>

    <nav aria-label="Main menu">
      <p class="nav-section-title">Menu</p>
      <ul class="nav-list">${MENU_LINKS.map(makeLink).join('')}</ul>
    </nav>

    <nav aria-label="Admin menu">
      <p class="nav-section-title">Admin</p>
      <ul class="nav-list">${ADMIN_LINKS.map(makeLink).join('')}</ul>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <span class="avatar" id="sidebar-avatar">G</span>
        <div class="sidebar-user-info">
          <p class="sidebar-user-name" id="sidebar-user-name">Guest</p>
          <p class="sidebar-user-role" id="sidebar-user-role">Not logged in</p>
        </div>
      </div>
      <a href="login.html" class="btn btn-secondary btn-block" id="sidebar-login-btn">
        ${icon('login')} Log in
      </a>
    </div>`;

  // Dark background behind the sidebar on mobile
  if (!document.querySelector('.sidebar-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.addEventListener('click', closeSidebar);
    document.body.appendChild(backdrop);
  }
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.querySelector('.sidebar-backdrop').classList.add('show');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('show');
}


/* =========================================================================
   4. TOPBAR
   ========================================================================= */
function renderTopbar(title, subtitle = '') {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  topbar.innerHTML = `
    <button class="btn-icon menu-toggle" id="menu-toggle" aria-label="Open menu">${icon('menu')}</button>

    <div>
      <h1 class="topbar-title">${escapeHTML(title)}</h1>
      ${subtitle ? `<p class="topbar-subtitle">${escapeHTML(subtitle)}</p>` : ''}
    </div>

    <div class="topbar-actions">
      <!-- Member 5 (reminders) uses #notif-bell and #notif-count -->
      <button class="btn-icon" id="notif-bell" aria-label="View deadlines">
        ${icon('bell')}<span class="dot hidden" id="notif-count">0</span>
      </button>
      <button class="btn-icon" id="theme-toggle" aria-label="Change theme"></button>
      <a href="task-form.html" class="btn btn-primary btn-sm" id="topbar-add-task">${icon('plus')} New Task</a>
    </div>`;

  document.getElementById('menu-toggle').addEventListener('click', openSidebar);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('notif-bell').addEventListener('click', () => {
    window.location.href = 'calendar.html';
  });
  applyTheme();
}


/* =========================================================================
   5. DARK / LIGHT THEME  (the choice is remembered by the browser)
   ========================================================================= */
function applyTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  const button = document.getElementById('theme-toggle');
  if (button) button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'dark';
  localStorage.setItem('theme', current === 'dark' ? 'light' : 'dark');
  applyTheme();
}


/* =========================================================================
   6. TOAST MESSAGES  (small pop-up in the corner)
      showToast('Task added!', 'success');
   ========================================================================= */
function showToast(message, type = 'info') {
  // Create the container the first time
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toastIcons = { success: 'check', error: 'x', warning: 'alert', info: 'info' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    ${icon(toastIcons[type])}
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Close">${icon('x')}</button>`;

  function removeToast() {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }

  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  container.appendChild(toast);
  setTimeout(removeToast, 3500); // disappears after 3.5 seconds
}


/* =========================================================================
   7. MODALS  (pop-up windows)
      HTML:  <div class="modal-overlay" id="my-modal"> <div class="modal"> ... </div> </div>
      JS:    openModal('my-modal');   closeModal('my-modal');
      Any button with  data-close-modal  inside the modal closes it.
   ========================================================================= */
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close a modal when clicking the dark background or a [data-close-modal] button
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('open');
  }
  const closeButton = event.target.closest('[data-close-modal]');
  if (closeButton) {
    closeButton.closest('.modal-overlay').classList.remove('open');
  }
});

// Close modals and the mobile sidebar with the Escape key
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => modal.classList.remove('open'));
    closeSidebar();
  }
});


/* =========================================================================
   8. CONFIRM DIALOG  (nicer version of the browser's confirm())
      const yes = await confirmDialog('Delete task?', 'This cannot be undone.', true);
      if (yes) { ...delete... }
   ========================================================================= */
function confirmDialog(title, message = '', isDanger = false) {
  return new Promise(function (resolve) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <div class="modal-icon ${isDanger ? 'danger' : ''}">${icon(isDanger ? 'trash' : 'info')}</div>
            <h3>${escapeHTML(title)}</h3>
          </div>
        </div>
        <div class="modal-body">${escapeHTML(message)}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-answer="no">Cancel</button>
          <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" data-answer="yes">
            ${isDanger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('open'), 10);

    overlay.addEventListener('click', function (event) {
      const button = event.target.closest('[data-answer]');
      const clickedBackground = event.target === overlay;
      if (!button && !clickedBackground) return;

      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
      resolve(button ? button.dataset.answer === 'yes' : false);
    });
  });
}


/* =========================================================================
   9. SMALL HELPERS
   ========================================================================= */

/** Makes user text safe before putting it in innerHTML (stops HTML injection). */
function escapeHTML(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** '2026-10-25T14:00'  →  'Oct 25, 2026, 2:00 PM' */
function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}


/* =========================================================================
   10. PAGE SETUP — call once at the top of your page script
       initPage('tasks', 'My Tasks', 'Stay organized');
   ========================================================================= */
function initPage(page, title, subtitle = '') {
  renderSidebar(page);
  renderTopbar(title, subtitle);
  document.title = `${title} · TaskFlow`;
}

// Apply the saved theme as soon as the file loads
applyTheme();
