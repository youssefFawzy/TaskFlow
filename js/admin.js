/* =========================================================================
   ADMIN DASHBOARD MODULE (js/admin.js)
   TaskFlow · Member 5 — Feature 2: Admin Dashboard
   Pure Canvas Charts · User Analytics · Activity Reports
   ========================================================================= */

// Sample seed tasks to ensure admin dashboard displays rich metrics out-of-the-box
const INITIAL_DEMO_TASKS = [
  {
    id: 't_demo_1',
    userId: 'u_admin_default',
    title: 'Finalize Software Architecture Diagram',
    description: 'Prepare the component diagram and dataflow specification for milestone 1 review.',
    deadline: '2026-10-28T18:00',
    priority: 'high',
    category: 'work',
    status: 'completed',
    reminder: '1day',
    createdAt: '2026-10-15T09:30:00.000Z',
    completedAt: '2026-10-18T14:20:00.000Z'
  },
  {
    id: 't_demo_2',
    userId: 'u_demo_default',
    title: 'Complete Software 1 Milestone Submission',
    description: 'Consolidate individual member modules, perform end-to-end testing and deploy.',
    deadline: '2026-10-25T23:59',
    priority: 'high',
    category: 'school',
    status: 'pending',
    reminder: '1hour',
    createdAt: '2026-10-16T11:00:00.000Z',
    completedAt: null
  },
  {
    id: 't_demo_3',
    userId: 'u_demo_default',
    title: 'Weekly Grocery Shopping & Meal Prep',
    description: 'Pick up fresh produce and organic ingredients for the upcoming study week.',
    deadline: '2026-10-24T12:00',
    priority: 'medium',
    category: 'personal',
    status: 'completed',
    reminder: '15min',
    createdAt: '2026-10-17T15:00:00.000Z',
    completedAt: '2026-10-20T10:15:00.000Z'
  },
  {
    id: 't_demo_4',
    userId: 'u_admin_default',
    title: 'Review System Access Logs and Security Audits',
    description: 'Inspect user login sessions, token validations, and permission checks.',
    deadline: '2026-10-22T17:00',
    priority: 'high',
    category: 'work',
    status: 'completed',
    reminder: '1day',
    createdAt: '2026-10-18T08:00:00.000Z',
    completedAt: '2026-10-21T16:00:00.000Z'
  },
  {
    id: 't_demo_5',
    userId: 'u_demo_default',
    title: 'Morning 5K Jog & Cardio Session',
    description: 'Maintain healthy habits with a morning workout session in the park.',
    deadline: '2026-10-26T07:30',
    priority: 'low',
    category: 'health',
    status: 'pending',
    reminder: '15min',
    createdAt: '2026-10-19T13:45:00.000Z',
    completedAt: null
  },
  {
    id: 't_demo_6',
    userId: 'u_demo_default',
    title: 'Database Normalization Review Session',
    description: 'Analyze 3NF schemas and prepare notes for the software engineering quiz.',
    deadline: '2026-10-20T16:00',
    priority: 'medium',
    category: 'school',
    status: 'pending', // overdue
    reminder: '1hour',
    createdAt: '2026-10-12T10:00:00.000Z',
    completedAt: null
  },
  {
    id: 't_demo_7',
    userId: 'u_admin_default',
    title: 'Backup LocalStorage Snapshot to Cloud Archive',
    description: 'Create encrypted backup of user account credentials and task state tables.',
    deadline: '2026-10-30T19:00',
    priority: 'medium',
    category: 'other',
    status: 'pending',
    reminder: 'none',
    createdAt: '2026-10-20T14:10:00.000Z',
    completedAt: null
  }
];

/**
 * Ensures demo tasks exist if localStorage is empty.
 */
function ensureSampleTasks() {
  try {
    const raw = localStorage.getItem('todo_tasks');
    if (!raw || raw === '[]') {
      localStorage.setItem('todo_tasks', JSON.stringify(INITIAL_DEMO_TASKS));
    }
  } catch (e) {
    console.error('Error seeding tasks:', e);
  }
}

/* =========================================================================
   1. MAIN INITIALIZATION
   ========================================================================= */
function initAdminDashboard() {
  // Enforce Admin Route Guard
  if (typeof requireAdmin === 'function') {
    if (!requireAdmin()) return;
  }

  ensureSampleTasks();

  // Load and render all dashboard components
  renderDashboardStats();
  renderAdminCharts();
  renderUsersTable();
  initReportSection();
  initDashboardEvents();
}

/* =========================================================================
   2. STAT CARDS (#admin-stats)
   ========================================================================= */
function renderDashboardStats() {
  const users = typeof getUsers === 'function' ? getUsers() : [];
  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  // 1. Total Users (#total-users)
  const totalUsersEl = document.getElementById('total-users');
  if (totalUsersEl) {
    totalUsersEl.textContent = users.length;
  }

  // 2. Active Users in last 7 days (#active-users)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeUsersCount = users.filter(user => {
    if (user.lastLogin) {
      return new Date(user.lastLogin) >= sevenDaysAgo;
    }
    if (user.createdAt) {
      return new Date(user.createdAt) >= sevenDaysAgo;
    }
    return user.role === 'admin';
  }).length;

  const activeUsersEl = document.getElementById('active-users');
  if (activeUsersEl) {
    activeUsersEl.textContent = activeUsersCount;
  }

  // 3. Total Tasks (#total-tasks)
  const totalTasksEl = document.getElementById('total-tasks');
  if (totalTasksEl) {
    totalTasksEl.textContent = tasks.length;
  }

  // 4. Completion Rate (%) (#completion-rate)
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const rate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completionRateEl = document.getElementById('completion-rate');
  if (completionRateEl) {
    completionRateEl.textContent = `${rate}%`;
  }
}

/* =========================================================================
   3. PURE CANVAS CHARTS (#charts) - NO LIBRARIES
   ========================================================================= */

/** Helper to handle retina / HiDPI crispness */
function setupCanvasDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement.clientWidth || 300;
  const height = rect.height || canvas.parentElement.clientHeight || 220;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext('2d');
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

/** Theme colors for canvas */
function getCanvasThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    textColor: isDark ? '#cbd5e1' : '#334155',
    subtextColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
}

/**
 * Chart 1: Status & Completion Bar Chart (<canvas id="completion-chart">)
 */
function drawCompletionChart() {
  const canvas = document.getElementById('completion-chart');
  if (!canvas) return;

  const { ctx, width, height } = setupCanvasDPI(canvas);
  const theme = getCanvasThemeColors();

  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  const now = new Date();
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  tasks.forEach(t => {
    if (t.status === 'completed') {
      completed++;
    } else if (t.deadline && new Date(t.deadline) < now) {
      overdue++;
    } else {
      pending++;
    }
  });

  const data = [
    { label: 'Completed', count: completed, color: '#10b981' },
    { label: 'Pending', count: pending, color: '#5684f4' },
    { label: 'Overdue', count: overdue, color: '#ef4444' }
  ];

  ctx.clearRect(0, 0, width, height);

  const paddingBottom = 38;
  const paddingTop = 28;
  const paddingLeft = 36;
  const paddingRight = 16;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const maxVal = Math.max(5, Math.ceil(Math.max(...data.map(d => d.count), 1) * 1.25));

  // Draw Horizontal Grid lines
  const gridSteps = 4;
  ctx.lineWidth = 1;
  ctx.font = `11px ${theme.fontFamily}`;
  ctx.fillStyle = theme.subtextColor;
  ctx.textAlign = 'right';

  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((maxVal / gridSteps) * i);
    const y = paddingTop + chartHeight - (chartHeight * (val / maxVal));

    ctx.strokeStyle = theme.gridColor;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(String(val), paddingLeft - 8, y + 4);
  }

  // Draw Bars
  const barCount = data.length;
  const barWidth = Math.min(54, (chartWidth / barCount) * 0.45);
  const step = chartWidth / barCount;

  data.forEach((item, idx) => {
    const x = paddingLeft + (idx * step) + (step - barWidth) / 2;
    const barH = (item.count / maxVal) * chartHeight;
    const y = paddingTop + chartHeight - barH;

    // Bar fill with rounded top
    ctx.fillStyle = item.color;
    drawRoundedTopRect(ctx, x, y, barWidth, barH, 6);

    // Value on top
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold 12px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(item.count), x + barWidth / 2, Math.max(16, y - 6));

    // Label on bottom
    ctx.fillStyle = theme.subtextColor;
    ctx.font = `500 11px ${theme.fontFamily}`;
    ctx.fillText(item.label, x + barWidth / 2, height - 12);
  });
}

function drawRoundedTopRect(ctx, x, y, width, height, radius) {
  if (height <= 0) return;
  const r = Math.min(radius, width / 2, height);
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Chart 2: Category Donut Chart (<canvas id="category-chart">)
 */
function drawCategoryChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;

  const { ctx, width, height } = setupCanvasDPI(canvas);
  const theme = getCanvasThemeColors();

  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  const categories = typeof getTaskCategories === 'function' ? getTaskCategories() : [
    { id: 'work', name: 'Work', color: '#5684f4' },
    { id: 'personal', name: 'Personal', color: '#ee60b7' },
    { id: 'school', name: 'School', color: '#f5c342' },
    { id: 'health', name: 'Health', color: '#32c98f' },
    { id: 'other', name: 'Other', color: '#38bdf8' }
  ];

  const catCounts = {};
  categories.forEach(c => { catCounts[c.id] = 0; });
  tasks.forEach(t => {
    const cid = (t.category || 'other').toLowerCase();
    catCounts[cid] = (catCounts[cid] || 0) + 1;
  });

  const slices = categories.map(c => ({
    label: c.name,
    count: catCounts[c.id] || 0,
    color: c.color || '#5684f4'
  })).filter(s => s.count > 0);

  ctx.clearRect(0, 0, width, height);

  const total = tasks.length;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(centerX, centerY) - 20;
  const innerRadius = outerRadius * 0.58;

  if (total === 0 || slices.length === 0) {
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.subtextColor;
    ctx.font = `12px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('No tasks yet', centerX, centerY + 4);
    return;
  }

  let startAngle = -Math.PI / 2;

  slices.forEach(slice => {
    const sliceAngle = (slice.count / total) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    startAngle = endAngle;
  });

  // Center Text
  ctx.fillStyle = theme.textColor;
  ctx.font = `bold 20px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(String(total), centerX, centerY + 3);

  ctx.fillStyle = theme.subtextColor;
  ctx.font = `11px ${theme.fontFamily}`;
  ctx.fillText('Total Tasks', centerX, centerY + 18);

  // Update Legend HTML
  const legendEl = document.getElementById('category-chart-legend');
  if (legendEl) {
    legendEl.innerHTML = categories.map(cat => {
      const count = catCounts[cat.id] || 0;
      return `
        <div class="chart-legend-item">
          <span class="chart-legend-dot" style="background:${cat.color}"></span>
          <span>${escapeHTML(cat.name)}: <strong>${count}</strong></span>
        </div>`;
    }).join('');
  }
}

/**
 * Chart 3: Priority Donut Chart (<canvas id="priority-chart">)
 */
function drawPriorityChart() {
  const canvas = document.getElementById('priority-chart');
  if (!canvas) return;

  const { ctx, width, height } = setupCanvasDPI(canvas);
  const theme = getCanvasThemeColors();

  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  let high = 0;
  let medium = 0;
  let low = 0;

  tasks.forEach(t => {
    const p = (t.priority || 'medium').toLowerCase();
    if (p === 'high') high++;
    else if (p === 'low') low++;
    else medium++;
  });

  const total = high + medium + low;
  const slices = [
    { label: 'High', count: high, color: '#ef4444' },
    { label: 'Medium', count: medium, color: '#f59e0b' },
    { label: 'Low', count: low, color: '#10b981' }
  ];

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(centerX, centerY) - 20;
  const innerRadius = outerRadius * 0.58;

  if (total === 0) {
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.subtextColor;
    ctx.font = `12px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('No tasks yet', centerX, centerY + 4);
    return;
  }

  let startAngle = -Math.PI / 2;

  slices.forEach(slice => {
    if (slice.count <= 0) return;
    const sliceAngle = (slice.count / total) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    startAngle = endAngle;
  });

  // Center Text
  ctx.fillStyle = theme.textColor;
  ctx.font = `bold 18px ${theme.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${high} High`, centerX, centerY + 2);

  ctx.fillStyle = theme.subtextColor;
  ctx.font = `11px ${theme.fontFamily}`;
  ctx.fillText('Priority Level', centerX, centerY + 18);

  // Update Legend HTML
  const legendEl = document.getElementById('priority-chart-legend');
  if (legendEl) {
    legendEl.innerHTML = slices.map(s => `
      <div class="chart-legend-item">
        <span class="chart-legend-dot" style="background:${s.color}"></span>
        <span>${s.label}: <strong>${s.count}</strong></span>
      </div>`).join('');
  }
}

/** Render all charts */
function renderAdminCharts() {
  drawCompletionChart();
  drawCategoryChart();
  drawPriorityChart();
}

/* =========================================================================
   4. USERS TABLE SECTION (#users-table)
   ========================================================================= */
function renderUsersTable(filterQuery = '') {
  const tbody = document.getElementById('users-table-body');
  const countEl = document.getElementById('users-count-badge');
  if (!tbody) return;

  const users = typeof getUsers === 'function' ? getUsers() : [];
  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  const query = (filterQuery || '').trim().toLowerCase();

  const filteredUsers = users.filter(u => {
    if (!query) return true;
    const nameMatch = (u.name || '').toLowerCase().includes(query);
    const emailMatch = (u.email || '').toLowerCase().includes(query);
    const roleMatch = (u.role || '').toLowerCase().includes(query);
    return nameMatch || emailMatch || roleMatch;
  });

  if (countEl) {
    countEl.textContent = `${filteredUsers.length} ${filteredUsers.length === 1 ? 'user' : 'users'}`;
  }

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-state">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <p><strong>No users found</strong> matching "${escapeHTML(filterQuery)}"</p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map(user => {
    // Tasks for this user
    const userTasks = tasks.filter(t => t.userId === user.id);
    const totalT = userTasks.length;
    const completedT = userTasks.filter(t => t.status === 'completed').length;
    const pct = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

    // Registered date
    let regDate = 'N/A';
    if (user.createdAt) {
      const d = new Date(user.createdAt);
      regDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Last Login date
    let lastLogin = '<span class="text-muted">Never</span>';
    if (user.lastLogin) {
      const d = new Date(user.lastLogin);
      const diffHrs = Math.round((new Date() - d) / (1000 * 60 * 60));
      if (diffHrs < 1) {
        lastLogin = '<span class="text-success font-semibold">Active now</span>';
      } else if (diffHrs < 24) {
        lastLogin = `${diffHrs}h ago`;
      } else {
        lastLogin = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
    const roleBadge = user.role === 'admin'
      ? '<span class="badge badge-high">Admin</span>'
      : '<span class="badge badge-low">Member</span>';

    return `
      <tr data-user-id="${user.id}">
        <td>
          <div class="user-cell">
            <span class="user-table-avatar">${escapeHTML(initial)}</span>
            <div class="user-cell-meta">
              <span class="user-cell-name">${escapeHTML(user.name || 'Unnamed')}</span>
              <span class="user-cell-email">${escapeHTML(user.email)}</span>
            </div>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td>${escapeHTML(regDate)}</td>
        <td>${lastLogin}</td>
        <td><strong>${totalT}</strong> <span class="text-muted text-xs">tasks</span></td>
        <td>
          <div class="progress-pill">
            <div class="progress-track">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="progress-percent">${pct}%</span>
          </div>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-secondary btn-sm view-user-tasks-btn" data-user-id="${user.id}" data-user-name="${escapeHTML(user.name || user.email)}">
            View Tasks
          </button>
        </td>
      </tr>`;
  }).join('');

  // Attach click listeners to "View Tasks" buttons
  tbody.querySelectorAll('.view-user-tasks-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.userId;
      const uname = btn.dataset.userName;
      openUserTasksModal(uid, uname);
    });
  });
}

/** User detail modal */
function openUserTasksModal(userId, userName) {
  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  const userTasks = tasks.filter(t => t.userId === userId);
  const modalTitle = document.getElementById('user-tasks-modal-title');
  const modalBody = document.getElementById('user-tasks-modal-content');

  if (modalTitle) modalTitle.textContent = `Tasks for ${userName} (${userTasks.length})`;

  if (modalBody) {
    if (userTasks.length === 0) {
      modalBody.innerHTML = `<p class="text-muted text-center py-4">This user has not created any tasks yet.</p>`;
    } else {
      modalBody.innerHTML = `
        <div class="user-tasks-modal-list">
          ${userTasks.map(t => {
            const isDone = t.status === 'completed';
            const cat = t.category || 'General';
            const prio = (t.priority || 'medium').toUpperCase();
            return `
              <div class="user-task-row ${isDone ? 'completed' : ''}">
                <div class="user-task-info">
                  <span class="user-task-status-icon ${isDone ? 'done' : 'pending'}">${isDone ? '✓' : '○'}</span>
                  <div>
                    <strong style="${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${escapeHTML(t.title)}</strong>
                    <div class="text-xs text-muted flex gap-2 mt-1">
                      <span>Category: ${escapeHTML(cat)}</span>
                      <span>•</span>
                      <span>Priority: ${escapeHTML(prio)}</span>
                      ${t.deadline ? `<span>• Due: ${formatDate(t.deadline)}</span>` : ''}
                    </div>
                  </div>
                </div>
                <span class="badge ${isDone ? 'badge-low' : 'badge-medium'}">${t.status}</span>
              </div>`;
          }).join('')}
        </div>`;
    }
  }

  if (typeof openModal === 'function') {
    openModal('user-tasks-modal');
  }
}

/* =========================================================================
   5. REPORT SECTION (#report-section) & CSV EXPORT
   ========================================================================= */
function initReportSection() {
  const startInput = document.getElementById('report-start-date');
  const endInput = document.getElementById('report-end-date');
  const exportBtn = document.getElementById('export-csv-btn');
  const summaryText = document.getElementById('report-summary-text');

  if (!startInput || !endInput || !exportBtn) return;

  // Default to Last 30 Days
  const today = new Date();
  const past30 = new Date();
  past30.setDate(today.getDate() - 30);

  endInput.value = today.toISOString().split('T')[0];
  startInput.value = past30.toISOString().split('T')[0];

  function updateSummary() {
    const sDate = startInput.value ? new Date(startInput.value) : null;
    const eDate = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;

    let tasks = [];
    try {
      tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
    } catch (e) {
      tasks = [];
    }

    const matched = tasks.filter(t => {
      const taskDate = new Date(t.createdAt || t.deadline || Date.now());
      if (sDate && taskDate < sDate) return false;
      if (eDate && taskDate > eDate) return false;
      return true;
    });

    if (summaryText) {
      summaryText.innerHTML = `Date filter matches <strong>${matched.length}</strong> tasks from <strong>${usersCountForTasks(matched)}</strong> accounts.`;
    }
  }

  function usersCountForTasks(taskList) {
    const uids = new Set(taskList.map(t => t.userId || 'guest'));
    return uids.size;
  }

  startInput.addEventListener('change', updateSummary);
  endInput.addEventListener('change', updateSummary);

  // Preset Buttons
  document.querySelectorAll('[data-report-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-report-preset]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.reportPreset;
      const now = new Date();
      endInput.value = now.toISOString().split('T')[0];

      if (preset === '7days') {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        startInput.value = d.toISOString().split('T')[0];
      } else if (preset === '30days') {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        startInput.value = d.toISOString().split('T')[0];
      } else if (preset === 'all') {
        startInput.value = '2026-01-01';
      }
      updateSummary();
    });
  });

  // Export CSV Handler (#export-csv-btn)
  exportBtn.addEventListener('click', () => {
    exportCSVReport(startInput.value, endInput.value);
  });

  updateSummary();
}

/**
 * Generates and triggers download of CSV report
 */
function exportCSVReport(startDateStr, endDateStr) {
  let tasks = [];
  try {
    tasks = JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    tasks = [];
  }

  const users = typeof getUsers === 'function' ? getUsers() : [];
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const sDate = startDateStr ? new Date(startDateStr) : null;
  const eDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

  const matchedTasks = tasks.filter(t => {
    const taskDate = new Date(t.createdAt || t.deadline || Date.now());
    if (sDate && taskDate < sDate) return false;
    if (eDate && taskDate > eDate) return false;
    return true;
  });

  if (matchedTasks.length === 0) {
    if (typeof showToast === 'function') {
      showToast('No tasks found within the selected date range to export.', 'warning');
    }
    return;
  }

  // Build CSV content
  const headers = [
    'Task ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Created At',
    'Deadline',
    'Completed At',
    'Assigned User Name',
    'Assigned User Email'
  ];

  function escapeCSV(str) {
    const val = String(str ?? '');
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  const rows = [headers.join(',')];

  matchedTasks.forEach(t => {
    const user = userMap[t.userId] || { name: 'Guest / Unknown', email: 'guest@taskflow.local' };
    const row = [
      escapeCSV(t.id),
      escapeCSV(t.title),
      escapeCSV(t.category || 'General'),
      escapeCSV(t.priority || 'Medium'),
      escapeCSV(t.status || 'pending'),
      escapeCSV(t.createdAt || ''),
      escapeCSV(t.deadline || ''),
      escapeCSV(t.completedAt || ''),
      escapeCSV(user.name || 'Member'),
      escapeCSV(user.email || '')
    ];
    rows.push(row.join(','));
  });

  const csvString = rows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const dateStamp = new Date().toISOString().split('T')[0];
  a.download = `taskflow-admin-report-${dateStamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast(`Exported ${matchedTasks.length} tasks to CSV successfully!`, 'success');
  }
}

/* =========================================================================
   6. EVENT LISTENERS & RESIZE
   ========================================================================= */
function initDashboardEvents() {
  // Live user search (#user-search)
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderUsersTable(e.target.value);
    });
  }

  // Refresh Button
  const refreshBtn = document.getElementById('refresh-admin-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderDashboardStats();
      renderAdminCharts();
      renderUsersTable(searchInput ? searchInput.value : '');
      initReportSection();
      if (typeof showToast === 'function') {
        showToast('Dashboard metrics refreshed!', 'info');
      }
    });
  }

  // Listen for storage changes across other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'todo_tasks' || e.key === 'todo_users') {
      renderDashboardStats();
      renderAdminCharts();
      renderUsersTable(searchInput ? searchInput.value : '');
    }
  });

  // Re-draw canvas charts on window resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderAdminCharts();
    }, 150);
  });

  // Re-draw canvas charts when theme changes
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTimeout(renderAdminCharts, 50);
    });
  }
}
