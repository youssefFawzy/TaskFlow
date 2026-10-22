/* =========================================================================
   1. STORAGE HELPERS
   ========================================================================= */

/** Returns the full array of tasks from localStorage. */
function getAllTasks() {
  try {
    return JSON.parse(localStorage.getItem('todo_tasks') || '[]');
  } catch (e) {
    return [];
  }
}

/** Saves the full array of tasks back to localStorage. */
function saveTasks(tasks) {
  localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}

/** Finds a single task by its id. Returns the task object or null. */
function getTaskById(id) {
  const task = getAllTasks().find(item => item.id === id);
  return isTaskOwnedByCurrentUser(task) ? task : null;
}

function isTaskOwnedByCurrentUser(task) {
  if (!task || typeof getCurrentUser !== 'function') return false;
  const user = getCurrentUser();
  return Boolean(user && task.userId === user.id);
}


/* =========================================================================
   2. CATEGORY HELPERS
   ========================================================================= */

/** Maps category keys to display labels and CSS color variables. */
const CATEGORY_MAP = {
  work: { label: 'Work', color: 'var(--cat-work)' },
  personal: { label: 'Personal', color: 'var(--cat-personal)' },
  school: { label: 'School', color: 'var(--cat-school)' },
  health: { label: 'Health', color: 'var(--success)' },
  other: { label: 'Other', color: 'var(--info)' }
};

/** Returns the display label for a category key. */
function getCategoryLabel(key) {
  if (typeof findTaskCategory === 'function') {
    try {
      const category = findTaskCategory(key);
      if (category) {
        return category.isDefault ? category.name : `${category.icon} ${category.name}`;
      }
    } catch (err) {
      console.error('Error reading task categories:', err);
    }
  }
  return CATEGORY_MAP[key] ? CATEGORY_MAP[key].label : (key || 'Other');
}

/** Returns the CSS color variable for a category key. */
function getCategoryColor(key) {
  if (typeof findTaskCategory === 'function') {
    try {
      const category = findTaskCategory(key);
      const defaultCategory = typeof DEFAULT_TASK_CATEGORIES === 'undefined'
        ? null
        : DEFAULT_TASK_CATEGORIES.find(item => item.id === key);
      if (category && (!category.isDefault || category.color !== defaultCategory?.color)) {
        return category.color;
      }
    } catch (err) {
      console.error('Error reading task categories:', err);
    }
  }
  return CATEGORY_MAP[key] ? CATEGORY_MAP[key].color : 'var(--info)';
}


/* =========================================================================
   3. PRIORITY HELPERS
   ========================================================================= */

/**
 * Returns a numeric value for sorting by priority.
 * @param {string} p - 'low', 'medium', or 'high'
 * @returns {number} 1, 2, or 3
 */
function getPriorityValue(p) {
  const map = { low: 1, medium: 2, high: 3 };
  return map[p] || 0;
}

/** Returns the CSS badge class for a given priority. */
function getPriorityBadgeClass(p) {
  const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
  return map[p] || 'badge-info';
}


/* =========================================================================
   4. DEADLINE HELPERS
   ========================================================================= */

/** Returns true if the task's deadline has passed and it is still pending. */
function isOverdue(task) {
  if (!task.deadline || task.status === 'completed') return false;
  return new Date(task.deadline) < new Date();
}


/* =========================================================================
   5. CREATE TASK CARD   (returns HTML string)
      Used by:  task-form.js (live preview)  ·  Member 4 (tasks.html list)
   ========================================================================= */

/**
 * Builds the full HTML for a single task card.
 * @param {Object} task - The task object from localStorage.
 * @returns {string} HTML string for the card.
 */
function createTaskCard(task) {
  const isCompleted = task.status === 'completed';
  const overdue = isOverdue(task);
  const catLabel = getCategoryLabel(task.category);
  const catColor = getCategoryColor(task.category);
  const badgeClass = getPriorityBadgeClass(task.priority);
  const priority = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low';

  // Deadline display
  let deadlineHTML = '';
  if (task.deadline) {
    const deadlineText = formatDate(task.deadline);
    deadlineHTML = `
      <span class="task-card-deadline ${overdue ? 'overdue' : ''}">
        ${icon('clock')}
        ${overdue ? 'Overdue · ' : ''}${escapeHTML(deadlineText)}
      </span>`;
  }

  return `
    <div class="task-card ${isCompleted ? 'completed' : ''}"
         id="card-${task.id}"
         data-id="${task.id}"
         data-priority="${task.priority || 'low'}"
         data-category="${task.category || 'other'}"
         data-status="${task.status || 'pending'}">

      <div class="task-card-header">
        <button class="task-card-checkbox"
                id="check-${task.id}"
                onclick="toggleTaskComplete('${task.id}')"
                aria-label="${isCompleted ? 'Mark as pending' : 'Mark as complete'}">
          ${icon('check')}
        </button>

        <div class="task-card-title-area">
          <p class="task-card-title">${escapeHTML(task.title || 'Untitled Task')}</p>
        </div>

        <div class="task-card-actions">
          <a href="task-form.html?id=${task.id}" class="btn-icon btn-edit" aria-label="Edit task">
            ${icon('edit')}
          </a>
          <button class="btn-icon btn-delete"
                  onclick="confirmDelete('${task.id}')"
                  aria-label="Delete task">
            ${icon('trash')}
          </button>
        </div>
      </div>

      ${task.description ? `<p class="task-card-description">${escapeHTML(task.description)}</p>` : ''}

      <div class="task-card-meta">
        <span class="badge ${badgeClass}">${escapeHTML(priority)}</span>
        <span class="tag" style="--tag-color: ${catColor}">${escapeHTML(catLabel)}</span>
        ${deadlineHTML}
      </div>
    </div>`;
}


/* =========================================================================
   6. TOGGLE TASK COMPLETE
      Switches a task between 'pending' and 'completed'.
   ========================================================================= */

/**
 * Toggles the status of a task between pending and completed.
 * Updates localStorage and re-renders the card in the DOM.
 * @param {string} id - The task id.
 */
function toggleTaskComplete(id) {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = tasks[index];
  if (!isTaskOwnedByCurrentUser(task)) return;
  if (task.status === 'completed') {
    task.status = 'pending';
    task.completedAt = null;
  } else {
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
  }

  tasks[index] = task;
  saveTasks(tasks);

  // Update the card in the DOM if it exists
  const cardEl = document.getElementById('card-' + id);
  if (cardEl) {
    cardEl.outerHTML = createTaskCard(task);

    // Show toast feedback
    if (task.status === 'completed') {
      showToast('Task completed! 🎉', 'success');
    } else {
      showToast('Task marked as pending', 'info');
    }
  }
  document.dispatchEvent(new Event('taskflow:tasks-changed'));
}


/* =========================================================================
   7. CONFIRM DELETE
      Shows a confirmation dialog then removes the task from localStorage.
   ========================================================================= */

/**
 * Asks the user to confirm deletion, then removes the task.
 * @param {string} id - The task id.
 */
async function confirmDelete(id) {
  const task = getTaskById(id);
  if (!task) return;

  const yes = await confirmDialog(
    'Delete this task?',
    `"${task.title}" will be permanently removed. This cannot be undone.`,
    true
  );

  if (!yes) return;

  // Remove from localStorage
  const tasks = getAllTasks().filter(t => t.id !== id);
  saveTasks(tasks);

  // Animate removal in the DOM
  const cardEl = document.getElementById('card-' + id);
  if (cardEl) {
    cardEl.classList.add('removing');
    setTimeout(() => {
      cardEl.remove();
      document.dispatchEvent(new Event('taskflow:tasks-changed'));
    }, 300);
  } else {
    document.dispatchEvent(new Event('taskflow:tasks-changed'));
  }

  showToast('Task deleted', 'error');

  // If we are on the task-form page in edit mode, redirect to tasks
  const params = new URLSearchParams(window.location.search);
  if (params.get('id') === id) {
    setTimeout(() => { window.location.href = 'tasks.html'; }, 400);
  }
}
