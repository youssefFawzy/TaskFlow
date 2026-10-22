let taskView = 'list';

function initTasksPage() {
  if (!requireLogin(true)) return;

  document.getElementById('search-input').addEventListener('input', renderTasksPage);
  ['filter-category', 'filter-priority', 'filter-status', 'sort-by', 'sort-order'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderTasksPage);
  });

  document.getElementById('view-toggle').addEventListener('click', toggleTaskView);
  document.addEventListener('taskflow:tasks-changed', renderTasksPage);

  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  try {
    populateCategoryFilter(requestedCategory);
    renderTasksPage();
  } catch (err) {
    console.error('Unable to load tasks:', err);
    showToast('Tasks or categories could not be loaded. Check browser storage and try again.', 'error');
  }
}

function populateCategoryFilter(selectedCategory = null) {
  const select = document.getElementById('filter-category');
  const categories = getTaskCategories();
  select.innerHTML = '<option value="all">All categories</option>' +
    categories.map(category =>
      `<option value="${escapeHTML(category.id)}">${escapeHTML(category.icon)} ${escapeHTML(category.name)}</option>`
    ).join('');

  if (selectedCategory && categories.some(category => category.id === selectedCategory)) {
    select.value = selectedCategory;
  }
}

function getCurrentUserTasks() {
  const user = getCurrentUser();
  if (!user) return [];
  const stored = localStorage.getItem('todo_tasks');
  if (stored === null) return [];
  const tasks = JSON.parse(stored);
  if (!Array.isArray(tasks) || tasks.some(task => !task || typeof task !== 'object' || Array.isArray(task))) {
    throw new Error('Saved task data is invalid.');
  }
  return tasks.filter(task => task.userId === user.id);
}

function renderTasksPage() {
  try {
    const tasks = getCurrentUserTasks();
    const filtered = filterAndSortTasks(tasks);
    updateTaskStats(tasks);

    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const emptyTitle = document.getElementById('empty-state-title');
    const emptyMessage = document.getElementById('empty-state-message');
    const emptyAdd = document.getElementById('empty-state-add');

    taskList.classList.toggle('is-grid', taskView === 'grid');
    taskList.innerHTML = filtered.map(createTaskCard).join('');
    document.getElementById('task-result-count').textContent =
      `${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`;
    emptyState.classList.toggle('hidden', filtered.length > 0);

    if (!tasks.length) {
      emptyTitle.textContent = 'No tasks yet';
      emptyMessage.textContent = 'Add your first task and it will show up here.';
      emptyAdd.classList.remove('hidden');
    } else if (!filtered.length) {
      emptyTitle.textContent = 'No matching tasks';
      emptyMessage.textContent = 'Try changing your search or filters.';
      emptyAdd.classList.add('hidden');
    }
  } catch (err) {
    console.error('Unable to render tasks:', err);
    showToast('Tasks could not be displayed. Check browser storage and try again.', 'error');
  }
}

function filterAndSortTasks(tasks) {
  const query = document.getElementById('search-input').value.trim().toLocaleLowerCase();
  const category = document.getElementById('filter-category').value;
  const priority = document.getElementById('filter-priority').value;
  const status = document.getElementById('filter-status').value;
  const sortBy = document.getElementById('sort-by').value;
  const direction = document.getElementById('sort-order').value === 'desc' ? -1 : 1;

  return tasks
    .filter(task => {
      const matchesTitle = !query || String(task.title || '').toLocaleLowerCase().includes(query);
      const matchesCategory = category === 'all' || task.category === category;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const overdue = isOverdue(task);
      const matchesStatus = status === 'all' ||
        (status === 'overdue' ? overdue : task.status === status && !overdue);
      return matchesTitle && matchesCategory && matchesPriority && matchesStatus;
    })
    .sort((a, b) => compareTasks(a, b, sortBy, direction));
}

function compareTasks(a, b, sortBy, direction) {
  if (sortBy === 'priority') {
    return (getPriorityValue(a.priority) - getPriorityValue(b.priority)) * direction;
  }
  if (sortBy === 'category') {
    return getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category)) * direction;
  }
  if (sortBy === 'newest') {
    const aCreated = getDateValue(a.createdAt);
    const bCreated = getDateValue(b.createdAt);
    if (aCreated === null) return bCreated === null ? 0 : 1;
    if (bCreated === null) return -1;
    return (aCreated - bCreated) * direction;
  }

  const aDeadline = getDateValue(a.deadline);
  const bDeadline = getDateValue(b.deadline);
  if (aDeadline === null) return bDeadline === null ? 0 : 1;
  if (bDeadline === null) return -1;
  return (aDeadline - bDeadline) * direction;
}

function getDateValue(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function updateTaskStats(tasks) {
  const completed = tasks.filter(task => task.status === 'completed').length;
  const overdue = tasks.filter(isOverdue).length;
  document.getElementById('stat-total').textContent = tasks.length;
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-overdue').textContent = overdue;
  document.getElementById('stat-pending').textContent = tasks.length - completed - overdue;
}

function toggleTaskView() {
  taskView = taskView === 'list' ? 'grid' : 'list';
  const button = document.getElementById('view-toggle');
  button.setAttribute('aria-pressed', String(taskView === 'grid'));
  button.innerHTML = taskView === 'grid'
    ? `${icon('tasks')} List view`
    : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> Grid view';
  renderTasksPage();
}
