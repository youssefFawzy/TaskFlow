let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = toCalendarDate(new Date());

function initCalendarPage() {
  if (!requireLogin(true)) return;

  // Navigation & Today Controls
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const todayBtn = document.getElementById('today-btn');
  if (prevBtn) prevBtn.addEventListener('click', () => changeCalendarMonth(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeCalendarMonth(1));
  if (todayBtn) todayBtn.addEventListener('click', goToToday);


  // Native Date Picker Quick Jump
  const jumpInput = document.getElementById('calendar-quick-jump');
  if (jumpInput) {
    jumpInput.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      const parsed = parseCalendarDate(val);
      calendarMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      selectedCalendarDate = val;
      renderCalendarPage();
    });
  }

  // Month & Year Quick Selectors
  initMonthYearSelectors();

  // Admin User Filter Setup
  initAdminUserFilter();

  // Grid Cell Click
  const grid = document.getElementById('calendar-grid');
  if (grid) grid.addEventListener('click', selectCalendarDay);

  document.addEventListener('taskflow:tasks-changed', renderCalendarPage);
  window.addEventListener('storage', (e) => {
    if (e.key === 'todo_tasks' || e.key === 'todo_users') {
      renderCalendarPage();
    }
  });

  renderCalendarPage();
}

/** Populate and wire quick Month & Year dropdowns */
function initMonthYearSelectors() {
  const monthSelect = document.getElementById('quick-month-select');
  const yearSelect = document.getElementById('quick-year-select');

  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let y = currentYear - 3; y <= currentYear + 6; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }

    yearSelect.addEventListener('change', (e) => {
      const newYear = parseInt(e.target.value, 10);
      calendarMonth = new Date(newYear, calendarMonth.getMonth(), 1);
      renderCalendarPage();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      const newMonth = parseInt(e.target.value, 10);
      calendarMonth = new Date(calendarMonth.getFullYear(), newMonth, 1);
      renderCalendarPage();
    });
  }
}

/** Admin filter initialization if logged in as administrator */
function initAdminUserFilter() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const filterWrapper = document.getElementById('calendar-user-filter-wrapper');
  const userFilter = document.getElementById('calendar-user-filter');

  if (!user || user.role !== 'admin' || !filterWrapper || !userFilter) return;

  filterWrapper.style.display = 'inline-flex';

  const users = typeof getUsers === 'function' ? getUsers() : [];
  userFilter.innerHTML = '<option value="all">All Users (Admin View)</option>';
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.name || u.email} (${u.role === 'admin' ? 'Admin' : 'Member'})`;
    userFilter.appendChild(opt);
  });

  userFilter.addEventListener('change', () => {
    renderCalendarPage();
  });
}

function changeCalendarMonth(amount) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1);
  renderCalendarPage();
}

function goToToday() {
  const today = new Date();
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedCalendarDate = toCalendarDate(today);
  renderCalendarPage();
}

function selectCalendarDay(event) {
  const dayButton = event.target.closest('[data-calendar-date]');
  if (!dayButton) return;
  selectedCalendarDate = dayButton.dataset.calendarDate;
  renderCalendarPage();
}

function getCalendarTasks() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) return [];

  let tasks = [];
  try {
    const stored = localStorage.getItem('todo_tasks');
    tasks = stored ? JSON.parse(stored) : [];
  } catch (e) {
    tasks = [];
  }
  if (!Array.isArray(tasks)) return [];

  const userIsAdmin = user.role === 'admin';
  const userFilterEl = document.getElementById('calendar-user-filter');
  const filterUid = userFilterEl ? userFilterEl.value : 'all';

  return tasks.filter(task => {
    if (!task || typeof task !== 'object') return false;
    if (!task.deadline || Number.isNaN(new Date(task.deadline).getTime())) return false;

    if (!userIsAdmin) {
      return task.userId === user.id;
    }

    if (filterUid === 'all') return true;
    return task.userId === filterUid;
  });
}

function renderCalendarPage() {
  try {
    // Synchronize month & year selectors
    const monthSelect = document.getElementById('quick-month-select');
    const yearSelect = document.getElementById('quick-year-select');
    const jumpInput = document.getElementById('calendar-quick-jump');

    if (monthSelect) monthSelect.value = calendarMonth.getMonth();
    if (yearSelect) yearSelect.value = calendarMonth.getFullYear();
    if (jumpInput) jumpInput.value = selectedCalendarDate;

    const tasks = getCalendarTasks();
    renderCalendarGrid(tasks);
    renderDayPanel(tasks);
    renderUpcomingTasks(tasks);
  } catch (err) {
    console.error('Unable to render calendar:', err);
    if (typeof showToast === 'function') {
      showToast('Calendar tasks could not be loaded. Check browser storage and try again.', 'error');
    }
  }
}

function renderCalendarGrid(tasks) {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthTitle = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const titleEl = document.getElementById('month-title');
  if (titleEl) titleEl.textContent = monthTitle;
  grid.setAttribute('aria-label', monthTitle);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toCalendarDate(new Date());
  const cells = weekdays.map(day => `<div class="calendar-weekday" role="columnheader">${day}</div>`);

  for (let blank = 0; blank < firstWeekday; blank++) {
    cells.push('<div class="calendar-day calendar-day-blank" role="gridcell" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = toCalendarDate(date);
    const dayTasks = tasks.filter(task => toCalendarDate(new Date(task.deadline)) === dateKey);
    const dots = dayTasks.slice(0, 4).map(task =>
      `<i class="priority-dot ${getCalendarPriority(task)}" aria-hidden="true"></i>`
    ).join('');
    const dayNames = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const classes = [
      'calendar-day',
      dateKey === today ? 'is-today' : '',
      dateKey === selectedCalendarDate ? 'is-selected' : '',
      dayTasks.length ? 'has-tasks' : ''
    ].filter(Boolean).join(' ');

    cells.push(`
      <button type="button" class="${classes}" role="gridcell" data-calendar-date="${dateKey}"
              aria-label="${dayNames}, ${dayTasks.length} ${dayTasks.length === 1 ? 'task' : 'tasks'}"
              aria-pressed="${dateKey === selectedCalendarDate}">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-dots">${dots}</span>
      </button>`);
  }

  grid.innerHTML = cells.join('');
}

function renderDayPanel(tasks) {
  const panel = document.getElementById('day-panel');
  const countEl = document.getElementById('day-task-count');
  const titleEl = document.getElementById('day-panel-title');
  if (!panel) return;

  const selected = parseCalendarDate(selectedCalendarDate);
  const selectedTasks = tasks.filter(task => toCalendarDate(new Date(task.deadline)) === selectedCalendarDate);
  const title = selected.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  if (titleEl) {
    titleEl.textContent = selectedCalendarDate === toCalendarDate(new Date()) ? 'Tasks for today' : `Tasks for ${title}`;
  }
  if (countEl) {
    countEl.textContent = `${selectedTasks.length} ${selectedTasks.length === 1 ? 'task' : 'tasks'}`;
  }

  panel.innerHTML = selectedTasks.length
    ? selectedTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map(createTaskCard).join('')
    : '<p class="calendar-empty text-muted">No tasks due on this day.</p>';
}

function renderUpcomingTasks(tasks) {
  const upcomingList = document.getElementById('upcoming-list');
  if (!upcomingList) return;

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = tasks
    .filter(task => task.status !== 'completed')
    .filter(task => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= end;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const userIsAdmin = user && user.role === 'admin';
  const allUsers = userIsAdmin && typeof getUsers === 'function' ? getUsers(false) : [];
  const userMap = {};
  allUsers.forEach(u => { userMap[u.id] = u.name || u.email; });

  upcomingList.innerHTML = upcoming.length
    ? upcoming.map(task => {
        const ownerName = userIsAdmin && task.userId ? (userMap[task.userId] || 'Member') : null;
        return `
          <a class="upcoming-task" href="task-form.html?id=${encodeURIComponent(task.id)}">
            <span class="upcoming-priority ${getCalendarPriority(task)}"></span>
            <span class="upcoming-task-info">
              <strong>${escapeHTML(task.title || 'Untitled task')}</strong>
              <small>${escapeHTML(formatDate(task.deadline))}</small>
              ${ownerName ? `<small class="upcoming-task-owner"><svg class="icon" viewBox="0 0 24 24" style="width:11px;height:11px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${escapeHTML(ownerName)}</small>` : ''}
            </span>
            ${icon('arrow')}
          </a>`;
      }).join('')
    : '<p class="calendar-empty text-muted">No upcoming deadlines in the next 7 days.</p>';
}

function getCalendarPriority(task) {
  return ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'low';
}

function toCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
