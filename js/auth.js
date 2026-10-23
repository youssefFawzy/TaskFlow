/* =========================================================================
   1. STORAGE ACCESSORS & SEEDING
   ========================================================================= */

/**
 * Initializes default accounts (Admin and Demo User) if not present.
 */
function initDefaultAdmin() {
  let users = [];
  try {
    const raw = localStorage.getItem('todo_users');
    users = raw ? JSON.parse(raw) : [];
  } catch (e) {
    users = [];
  }

  let changed = false;

  // 1. Default Administrator Account (required by specification)
  const hasAdmin = users.some(u => u.email.toLowerCase() === 'admin@taskflow.com');
  if (!hasAdmin) {
    users.unshift({
      id: 'u_admin_default',
      name: 'TaskFlow Admin',
      email: 'admin@taskflow.com',
      password: 'Admin@123',
      role: 'admin',
      createdAt: '2026-10-01T10:00:00.000Z',
      lastLogin: null
    });
    changed = true;
  }

  // 2. Sample Member Account for quick demo/testing
  const hasDemo = users.some(u => u.email.toLowerCase() === 'demo@taskflow.com');
  if (!hasDemo) {
    users.push({
      id: 'u_demo_default',
      name: 'Alex Morgan',
      email: 'demo@taskflow.com',
      password: 'Demo@123',
      role: 'user',
      createdAt: '2026-10-10T12:00:00.000Z',
      lastLogin: null
    });
    changed = true;
  }

  if (changed) {
    saveUsers(users);
  }
  return users;
}

// Automatically ensure default accounts on initial load
initDefaultAdmin();

function getUsers(autoSeed = true) {
  try {
    const raw = localStorage.getItem('todo_users');
    let users = raw ? JSON.parse(raw) : [];
    if (autoSeed && (!users || users.length === 0 || !users.some(u => u.email.toLowerCase() === 'admin@taskflow.com'))) {
      users = initDefaultAdmin();
    }
    return users;
  } catch (err) {
    console.error('Error reading todo_users from localStorage:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('todo_users', JSON.stringify(users));
  } catch (err) {
    console.error('Error saving todo_users to localStorage:', err);
  }
}

function getSession() {
  try {
    const raw = localStorage.getItem('todo_session');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading todo_session from localStorage:', err);
    return null;
  }
}

function setSession(userId, isGuest = false) {
  const session = {
    userId: userId,
    isGuest: Boolean(isGuest),
    loginAt: new Date().toISOString()
  };
  localStorage.setItem('todo_session', JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem('todo_session');
}

/* =========================================================================
   2. AUTH STATE HELPERS (Used across all pages)
   ========================================================================= */
function getCurrentUser() {
  const session = getSession();
  if (!session) return null;

  if (session.isGuest || session.userId === 'guest') {
    return {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@taskflow.local',
      role: 'guest',
      isGuest: true,
      createdAt: session.loginAt
    };
  }

  const users = getUsers();
  const found = users.find(u => u.id === session.userId);
  if (!found) {
    // Session points to a user that was deleted
    clearSession();
    return null;
  }
  return { ...found, isGuest: false };
}

function isLoggedIn() {
  const session = getSession();
  return Boolean(session && session.userId);
}

function isGuest() {
  const session = getSession();
  return Boolean(session && (session.isGuest || session.userId === 'guest'));
}

function isAdmin() {
  const user = getCurrentUser();
  return Boolean(user && user.role === 'admin');
}

/* =========================================================================
   3. ROUTE GUARDS (Functions other members need)
   ========================================================================= */

/**
 * Require user to be logged in.
 * If not logged in, redirects to login.html.
 * @param {boolean} allowGuest - if false, guest users will also be redirected. Default true.
 */
function requireLogin(allowGuest = true) {
  const session = getSession();
  if (!session || !session.userId) {
    const current = encodeURIComponent(window.location.pathname.split('/').pop() || 'tasks.html');
    window.location.href = `login.html?redirect=${current}`;
    return false;
  }

  if (!allowGuest && (session.isGuest || session.userId === 'guest')) {
    if (typeof showToast === 'function') {
      showToast('Please create an account or log in to access this page.', 'warning');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return false;
  }

  return true;
}

/**
 * Require user to have the "admin" role.
 * Non-admins are redirected back to tasks.html with an alert toast.
 */
function requireAdmin() {
  if (!requireLogin(false)) return false;

  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    if (typeof showToast === 'function') {
      showToast('Access denied: Administrator privileges required.', 'error');
    } else {
      alert('Access denied: Administrator privileges required.');
    }
    setTimeout(() => {
      window.location.href = 'tasks.html';
    }, 1200);
    return false;
  }

  return true;
}

/**
 * Log out the active user, clears session and redirects to login.html.
 */
function logoutUser() {
  clearSession();
  if (typeof showToast === 'function') {
    showToast('Logged out successfully.', 'info');
  }
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
}

/* =========================================================================
   4. CORE AUTH ACTIONS (Register, Login, Guest)
   ========================================================================= */

/**
 * Registers a new user.
 * @returns {{ success: boolean, message?: string, user?: object }}
 */
function registerUser(name, email, password) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = password || '';

  if (!cleanName || cleanName.length < 2) {
    return { success: false, message: 'Please enter your full name (at least 2 characters).' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  const users = getUsers();
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, message: 'An account with this email already exists. Try logging in.' };
  }

  const newUser = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: cleanName,
    email: cleanEmail,
    password: cleanPass,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login upon registration
  setSession(newUser.id, false);

  return { success: true, user: newUser };
}

/**
 * Logs in an existing user.
 * @returns {{ success: boolean, message?: string, user?: object }}
 */
function loginUser(email, password, remember = false) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = password || '';

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please enter both email and password.' };
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== cleanPass) {
    return { success: false, message: 'Invalid email or password. Please check your credentials.' };
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  // Save session
  setSession(user.id, false);

  // Handle remember me
  if (remember) {
    localStorage.setItem('todo_remembered_email', cleanEmail);
  } else {
    localStorage.removeItem('todo_remembered_email');
  }

  return { success: true, user: user };
}

/**
 * Starts a guest session and navigates to tasks.
 */
function loginAsGuest() {
  setSession('guest', true);
  if (typeof showToast === 'function') {
    showToast('Browsing in guest mode.', 'info');
  }
  window.location.href = 'tasks.html';
}

/* =========================================================================
   5. PASSWORD STRENGTH CALCULATION
   ========================================================================= */
function checkPasswordStrength(password) {
  const str = password || '';
  if (!str) {
    return { score: 0, label: 'None', textClass: '', className: '' };
  }

  let score = 0;
  if (str.length >= 6) score++;
  if (str.length >= 8) score++;
  if (/[A-Z]/.test(str) && /[a-z]/.test(str)) score++;
  if (/[0-9]/.test(str)) score++;
  if (/[^A-Za-z0-9]/.test(str)) score++;

  // Normalize score to 1..4
  if (score <= 1) {
    return { score: 1, label: 'Weak', className: 'strength-weak' };
  } else if (score === 2) {
    return { score: 2, label: 'Fair', className: 'strength-fair' };
  } else if (score === 3 || score === 4) {
    return { score: 3, label: 'Good', className: 'strength-good' };
  } else {
    return { score: 4, label: 'Strong', className: 'strength-strong' };
  }
}

/* =========================================================================
   6. SIDEBAR SYNCHRONIZATION
   Updates the user details displayed in the sidebar generated by layout.js
   ========================================================================= */
function syncSidebarUser() {
  const user = getCurrentUser();
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const loginBtn = document.getElementById('sidebar-login-btn');

  if (!avatarEl || !nameEl || !roleEl) return;

  if (user && !user.isGuest) {
    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
    avatarEl.textContent = initial;
    nameEl.textContent = user.name || 'User';
    roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Member';

    // Replace login button with logout button if not already replaced
    if (loginBtn) {
      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn btn-secondary btn-block';
      logoutBtn.id = 'sidebar-logout-btn';
      const iconMarkup = typeof icon === 'function' ? icon('logout') : '⎋';
      logoutBtn.innerHTML = `${iconMarkup} Log out`;
      logoutBtn.addEventListener('click', logoutUser);
      loginBtn.parentNode.replaceChild(logoutBtn, loginBtn);
    }
  } else if (user && user.isGuest) {
    avatarEl.textContent = 'G';
    nameEl.textContent = 'Guest User';
    roleEl.textContent = 'Temporary session';
    if (loginBtn) {
      const iconMarkup = typeof icon === 'function' ? icon('login') : '→';
      loginBtn.innerHTML = `${iconMarkup} Log in`;
      loginBtn.href = 'login.html';
    }
  } else {
    avatarEl.textContent = 'G';
    nameEl.textContent = 'Guest';
    roleEl.textContent = 'Not logged in';
  }

  // Update admin dashboard navigation visibility in sidebar
  const adminNav = document.getElementById('sidebar-admin-nav');
  if (adminNav) {
    if (user && user.role === 'admin') {
      adminNav.classList.remove('hidden');
    } else {
      adminNav.classList.add('hidden');
    }
  }
}

/* =========================================================================
   7. PAGE-SPECIFIC CONTROLLERS
   ========================================================================= */

// --- LOGIN PAGE ---
function setupLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('remember-me');
  const errorBox = document.getElementById('login-error');
  const guestBtn = document.getElementById('continue-guest-btn');
  const fillAdminBtn = document.getElementById('fill-admin-btn');
  const fillDemoBtn = document.getElementById('fill-demo-btn');

  // Pre-fill remembered email
  const remembered = localStorage.getItem('todo_remembered_email');
  if (remembered && emailInput) {
    emailInput.value = remembered;
    if (rememberCheckbox) rememberCheckbox.checked = true;
    if (passwordInput) passwordInput.focus();
  }

  // Quick autofill buttons for testing/marking
  if (fillAdminBtn) {
    fillAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (emailInput) emailInput.value = 'admin@taskflow.com';
      if (passwordInput) passwordInput.value = 'Admin@123';
      if (errorBox) errorBox.classList.add('hidden');
    });
  }
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (emailInput) emailInput.value = 'demo@taskflow.com';
      if (passwordInput) passwordInput.value = 'Demo@123';
      if (errorBox) errorBox.classList.add('hidden');
    });
  }

  // Guest login link
  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginAsGuest();
    });
  }

  // Password toggle
  setupPasswordToggles();

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorBox) errorBox.classList.add('hidden');

    const email = emailInput ? emailInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    const remember = rememberCheckbox ? rememberCheckbox.checked : false;

    const result = loginUser(email, password, remember);

    if (!result.success) {
      if (errorBox) {
        errorBox.textContent = result.message;
        errorBox.classList.remove('hidden');
      } else if (typeof showToast === 'function') {
        showToast(result.message, 'error');
      }
      return;
    }

    if (typeof showToast === 'function') {
      showToast(`Welcome back, ${result.user.name}!`, 'success');
    }

    // Determine redirect destination
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect');

    setTimeout(() => {
      if (redirectUrl && !redirectUrl.includes('login.html')) {
        window.location.href = decodeURIComponent(redirectUrl);
      } else if (result.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'tasks.html';
      }
    }, 500);
  });
}

// --- REGISTER PAGE ---
function setupRegisterPage() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm');
  const strengthMeter = document.getElementById('strength-meter');
  const strengthText = document.getElementById('strength-text');
  const errorBox = document.getElementById('register-error');
  const guestBtn = document.getElementById('continue-guest-btn');

  setupPasswordToggles();

  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginAsGuest();
    });
  }

  // Live password strength indicator
  if (passwordInput && strengthMeter && strengthText) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      const res = checkPasswordStrength(val);
      strengthMeter.className = 'strength-meter ' + res.className;
      strengthText.textContent = res.label;
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorBox) errorBox.classList.add('hidden');

    const name = nameInput ? nameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const pass = passwordInput ? passwordInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';

    if (pass !== confirm) {
      if (errorBox) {
        errorBox.textContent = 'Passwords do not match. Please re-enter.';
        errorBox.classList.remove('hidden');
      } else if (typeof showToast === 'function') {
        showToast('Passwords do not match.', 'error');
      }
      return;
    }

    const result = registerUser(name, email, pass);

    if (!result.success) {
      if (errorBox) {
        errorBox.textContent = result.message;
        errorBox.classList.remove('hidden');
      } else if (typeof showToast === 'function') {
        showToast(result.message, 'error');
      }
      return;
    }

    if (typeof showToast === 'function') {
      showToast(`Account created! Welcome, ${result.user.name}.`, 'success');
    }

    setTimeout(() => {
      window.location.href = 'tasks.html';
    }, 600);
  });
}

// --- PROFILE PAGE ---
function setupProfilePage() {
  const profileContainer = document.getElementById('profile-view');
  if (!profileContainer) return;

  // Protect page
  if (!requireLogin(true)) return;

  const user = getCurrentUser();
  if (!user) return;

  const isUserGuest = user.isGuest || user.id === 'guest';

  // Elements
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const roleBadgeEl = document.getElementById('profile-role-badge');
  const joinedDateEl = document.getElementById('profile-joined-date');
  const guestBanner = document.getElementById('profile-guest-banner');
  const memberSections = document.getElementById('profile-member-sections');

  // Populate info
  if (avatarEl) {
    avatarEl.textContent = (user.name || 'G').charAt(0).toUpperCase();
  }
  if (nameEl) nameEl.textContent = user.name || 'Guest User';
  if (emailEl) emailEl.textContent = user.email || 'None';
  if (roleBadgeEl) {
    if (user.role === 'admin') {
      roleBadgeEl.className = 'badge badge-high';
      roleBadgeEl.textContent = 'Admin';
    } else if (isUserGuest) {
      roleBadgeEl.className = 'badge badge-medium';
      roleBadgeEl.textContent = 'Guest';
    } else {
      roleBadgeEl.className = 'badge badge-low';
      roleBadgeEl.textContent = 'Member';
    }
  }

  if (joinedDateEl) {
    if (isUserGuest) {
      joinedDateEl.textContent = 'Active now';
    } else if (user.createdAt) {
      const dt = new Date(user.createdAt);
      joinedDateEl.textContent = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  // Guest vs Registered User visibility
  if (isUserGuest) {
    if (guestBanner) guestBanner.classList.remove('hidden');
    if (memberSections) memberSections.classList.add('hidden');
  } else {
    if (guestBanner) guestBanner.classList.add('hidden');
    if (memberSections) memberSections.classList.remove('hidden');
  }

  // Load Task Stats for current user
  loadProfileStats(user.id);

  // Edit Name Form
  const editNameForm = document.getElementById('edit-profile-form');
  const editNameInput = document.getElementById('edit-name-input');
  if (editNameForm && editNameInput && !isUserGuest) {
    editNameInput.value = user.name || '';
    editNameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = editNameInput.value.trim();
      if (!newName || newName.length < 2) {
        if (typeof showToast === 'function') showToast('Please enter a valid name (min 2 characters).', 'warning');
        return;
      }

      const users = getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx].name = newName;
        saveUsers(users);
        if (nameEl) nameEl.textContent = newName;
        if (avatarEl) avatarEl.textContent = newName.charAt(0).toUpperCase();
        syncSidebarUser();
        if (typeof showToast === 'function') showToast('Profile name updated!', 'success');
      }
    });
  }

  // Change Password Form
  const changePassForm = document.getElementById('change-password-form');
  const currentPassInput = document.getElementById('current-password-input');
  const newPassInput = document.getElementById('new-password-input');
  const confirmPassInput = document.getElementById('confirm-new-password-input');
  const passErrorBox = document.getElementById('password-change-error');

  setupPasswordToggles();

  if (changePassForm && !isUserGuest) {
    changePassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (passErrorBox) passErrorBox.classList.add('hidden');

      const oldPass = currentPassInput ? currentPassInput.value : '';
      const newPass = newPassInput ? newPassInput.value : '';
      const confirmPass = confirmPassInput ? confirmPassInput.value : '';

      const users = getUsers();
      const currentStored = users.find(u => u.id === user.id);

      if (!currentStored || currentStored.password !== oldPass) {
        const msg = 'Current password is incorrect.';
        if (passErrorBox) {
          passErrorBox.textContent = msg;
          passErrorBox.classList.remove('hidden');
        } else if (typeof showToast === 'function') {
          showToast(msg, 'error');
        }
        return;
      }

      if (newPass.length < 6) {
        const msg = 'New password must be at least 6 characters.';
        if (passErrorBox) {
          passErrorBox.textContent = msg;
          passErrorBox.classList.remove('hidden');
        } else if (typeof showToast === 'function') {
          showToast(msg, 'warning');
        }
        return;
      }

      if (newPass !== confirmPass) {
        const msg = 'New passwords do not match.';
        if (passErrorBox) {
          passErrorBox.textContent = msg;
          passErrorBox.classList.remove('hidden');
        } else if (typeof showToast === 'function') {
          showToast(msg, 'error');
        }
        return;
      }

      currentStored.password = newPass;
      saveUsers(users);

      if (currentPassInput) currentPassInput.value = '';
      if (newPassInput) newPassInput.value = '';
      if (confirmPassInput) confirmPassInput.value = '';

      if (typeof showToast === 'function') {
        showToast('Password changed successfully!', 'success');
      }
    });
  }

  // Delete Account
  const deleteBtn = document.getElementById('delete-account-btn');
  if (deleteBtn && !isUserGuest) {
    deleteBtn.addEventListener('click', async () => {
      let confirmed = false;
      if (typeof confirmDialog === 'function') {
        confirmed = await confirmDialog(
          'Delete Account?',
          'Are you sure you want to permanently delete your account and all associated tasks? This cannot be undone.',
          true
        );
      } else {
        confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
      }

      if (!confirmed) return;

      // 1. Remove user from todo_users
      const users = getUsers().filter(u => u.id !== user.id);
      saveUsers(users);

      // 2. Remove user's tasks from todo_tasks
      try {
        const rawTasks = localStorage.getItem('todo_tasks');
        if (rawTasks) {
          const tasks = JSON.parse(rawTasks);
          const remainingTasks = tasks.filter(t => t.userId !== user.id);
          localStorage.setItem('todo_tasks', JSON.stringify(remainingTasks));
        }
      } catch (err) {
        console.error('Error cleaning up tasks:', err);
      }

      // 3. Clear session and redirect
      clearSession();
      if (typeof showToast === 'function') {
        showToast('Your account has been deleted.', 'info');
      }
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    });
  }
}

// Calculate stats from todo_tasks
function loadProfileStats(userId) {
  let tasks = [];
  try {
    const raw = localStorage.getItem('todo_tasks');
    if (raw) tasks = JSON.parse(raw);
  } catch (err) {
    tasks = [];
  }

  // Filter tasks for this user (if guest, tasks with userId 'guest')
  const userTasks = tasks.filter(t => t.userId === userId || (!t.userId && userId === 'guest'));

  const total = userTasks.length;
  const completed = userTasks.filter(t => t.status === 'completed').length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalEl = document.getElementById('stat-profile-total');
  const completedEl = document.getElementById('stat-profile-completed');
  const pendingEl = document.getElementById('stat-profile-pending');
  const rateEl = document.getElementById('stat-profile-rate');

  if (totalEl) totalEl.textContent = total;
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;
  if (rateEl) rateEl.textContent = `${rate}%`;
}

// Password show/hide helper
function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach(btn => {
    // Prevent duplicate listeners
    if (btn.dataset.initialized) return;
    btn.dataset.initialized = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Switch icon
      const eyeOpen = '<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      const eyeSlash = '<svg class="icon" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

      btn.innerHTML = isPassword ? eyeSlash : eyeOpen;
    });
  });
}

// Standalone theme toggle support for login & register pages
function setupStandaloneThemeToggle() {
  if (typeof applyTheme === 'function') {
    applyTheme();
  }
}

/* =========================================================================
   8. BOOTSTRAP ON LOAD
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  setupStandaloneThemeToggle();
  syncSidebarUser();
  setupLoginPage();
  setupRegisterPage();
  setupProfilePage();
});

// Run immediate sync if DOM is already ready
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  setupStandaloneThemeToggle();
  syncSidebarUser();
}
