let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = toCalendarDate(new Date());

function initCalendarPage() {
  if (!requireLogin(true)) return;
  document.getElementById('prev-month').addEventListener('click', () => changeCalendarMonth(-1));
  document.getElementById('next-month').addEventListener('click', () => changeCalendarMonth(1));
  document.getElementById('today-btn').addEventListener('click', goToToday);
  document.getElementById('calendar-grid').addEventListener('click', selectCalendarDay);
  document.addEventListener('taskflow:tasks-changed', renderCalendarPage);
  renderCalendarPage();
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
  const user = getCurrentUser();
  if (!user) return [];
  const stored = localStorage.getItem('todo_tasks');
  if (stored === null) return [];
  const tasks = JSON.parse(stored);
  if (!Array.isArray(tasks) || tasks.some(task => !task || typeof task !== 'object' || Array.isArray(task))) {
    throw new Error('Saved task data is invalid.');
  }
  return tasks.filter(task => task.userId === user.id && task.deadline && !Number.isNaN(new Date(task.deadline).getTime()));
}

function renderCalendarPage() {
  try {
    const tasks = getCalendarTasks();
    renderCalendarGrid(tasks);
    renderDayPanel(tasks);
    renderUpcomingTasks(tasks);
  } catch (err) {
    console.error('Unable to render calendar:', err);
    showToast('Calendar tasks could not be loaded. Check browser storage and try again.', 'error');
  }
}

function renderCalendarGrid(tasks) {
  const grid = document.getElementById('calendar-grid');
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthTitle = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('month-title').textContent = monthTitle;
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
  const selected = parseCalendarDate(selectedCalendarDate);
  const selectedTasks = tasks.filter(task => toCalendarDate(new Date(task.deadline)) === selectedCalendarDate);
  const title = selected.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  document.getElementById('day-panel-title').textContent =
    selectedCalendarDate === toCalendarDate(new Date()) ? 'Tasks for today' : `Tasks for ${title}`;
  document.getElementById('day-task-count').textContent =
    `${selectedTasks.length} ${selectedTasks.length === 1 ? 'task' : 'tasks'}`;
  document.getElementById('day-panel').innerHTML = selectedTasks.length
    ? selectedTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map(createTaskCard).join('')
    : '<p class="calendar-empty text-muted">No tasks due on this day.</p>';
}

function renderUpcomingTasks(tasks) {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = tasks
    .filter(task => task.status !== 'completed')
    .filter(task => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= end;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  document.getElementById('upcoming-list').innerHTML = upcoming.length
    ? upcoming.map(task => `
      <a class="upcoming-task" href="task-form.html?id=${encodeURIComponent(task.id)}">
        <span class="upcoming-priority ${getCalendarPriority(task)}"></span>
        <span class="upcoming-task-info">
          <strong>${escapeHTML(task.title || 'Untitled task')}</strong>
          <small>${escapeHTML(formatDate(task.deadline))}</small>
        </span>
        ${icon('arrow')}
      </a>`).join('')
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
