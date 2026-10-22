/* =========================================================================
   TaskFlow — task-form.js
   Owner: Member 3 (Task Creation, Management & Prioritization)

   Page-specific logic for task-form.html (Add / Edit task).
   Depends on: layout.js, auth.js, task-actions.js

   ── FUNCTIONS ─────────────────────────────────────────────────────────────
     initForm()              → Detects add/edit mode, sets up listeners
     loadTaskIntoForm(task)  → Populates form fields for editing
     validateTaskForm()      → Validates required fields, returns boolean
     createTask()            → Builds new task and saves to localStorage
     updateTask()            → Updates existing task in localStorage
     deleteTask()            → Deletes task (called from delete button)
     updatePreview()         → Refreshes the live preview card
   ========================================================================= */


/* =========================================================================
   1. STATE
   ========================================================================= */
let editingTaskId = null;       // null = add mode, string = edit mode
let selectedPriority = 'medium'; // default priority
const MAX_DESCRIPTION = 500;     // character limit


/* =========================================================================
   2. INIT
   ========================================================================= */

/**
 * Called on page load. Detects mode from URL, sets up event listeners.
 */
function initForm() {
  // Require login (allow guests)
  requireLogin(true);

  try {
    populateTaskCategoryOptions();
  } catch (err) {
    console.error('Unable to load task categories:', err);
    showToast('Custom categories could not be loaded. Check browser storage and try again.', 'error');
  }

  // Detect edit mode from URL: task-form.html?id=t_12345
  const params = new URLSearchParams(window.location.search);
  editingTaskId = params.get('id');

  const formTitle    = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');
  const deleteBtn    = document.getElementById('delete-task-btn');
  const saveBtn      = document.getElementById('save-task-btn');

  if (editingTaskId) {
    // ─── EDIT MODE ───
    const task = getTaskById(editingTaskId);
    if (!task) {
      showToast('Task not found', 'error');
      setTimeout(() => { window.location.href = 'tasks.html'; }, 800);
      return;
    }

    formTitle.textContent = 'Edit Task';
    formSubtitle.textContent = 'Update the details of your task';
    document.title = 'Edit Task · TaskFlow';

    // Update topbar title
    const topbarTitle = document.querySelector('.topbar-title');
    if (topbarTitle) topbarTitle.textContent = 'Edit Task';

    saveBtn.innerHTML = icon('check') + ' Update Task';
    deleteBtn.classList.remove('hidden');

    loadTaskIntoForm(task);
  } else {
    // ─── ADD MODE ───
    formTitle.textContent = 'Add New Task';
    formSubtitle.textContent = 'Create a new task to stay on track';
    deleteBtn.classList.add('hidden');

    // Set default date to today
    const today = new Date();
    const dateInput = document.getElementById('task-date');
    dateInput.value = today.toISOString().split('T')[0];

    // Set default time to next hour
    const timeInput = document.getElementById('task-time');
    const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
    timeInput.value = nextHour.toTimeString().slice(0, 5);
  }

  // Set up priority selector
  setupPrioritySelector();

  // Set up character counter
  setupCharCounter();

  // Set up live preview
  setupLivePreview();

  // Set up form submission
  document.getElementById('task-form').addEventListener('submit', handleSubmit);

  // Set up delete button
  deleteBtn.addEventListener('click', deleteTask);

  // Initial preview render
  updatePreview();
}

function populateTaskCategoryOptions() {
  const select = document.getElementById('task-category');
  const knownOptions = new Map(Array.from(select.options, option => [option.value, option]));
  getTaskCategories().forEach(category => {
    const option = knownOptions.get(category.id);
    if (option) {
      option.textContent = category.name;
      return;
    }
    const customOption = document.createElement('option');
    customOption.value = category.id;
    customOption.textContent = `${category.icon} ${category.name}`;
    select.appendChild(customOption);
  });
}


/* =========================================================================
   3. LOAD TASK INTO FORM (Edit Mode)
   ========================================================================= */

/**
 * Populates all form fields from an existing task object.
 * @param {Object} task - The task from localStorage.
 */
function loadTaskIntoForm(task) {
  document.getElementById('task-title').value       = task.title || '';
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-category').value    = task.category || 'other';
  document.getElementById('task-reminder').value    = task.reminder || 'none';

  // Date and time from deadline
  if (task.deadline) {
    const parts = task.deadline.split('T');
    document.getElementById('task-date').value = parts[0] || '';
    document.getElementById('task-time').value = parts[1] || '';
  }

  // Priority
  selectedPriority = task.priority || 'medium';
  highlightPriority(selectedPriority);

  // Update char counter
  updateCharCounter();
}


/* =========================================================================
   4. PRIORITY SELECTOR
   ========================================================================= */

function setupPrioritySelector() {
  const cards = document.querySelectorAll('.priority-card');
  cards.forEach(card => {
    card.addEventListener('click', function () {
      selectedPriority = this.dataset.priority;
      highlightPriority(selectedPriority);
      updatePreview();
    });
  });

  // Set initial highlight
  highlightPriority(selectedPriority);
}

function highlightPriority(priority) {
  document.querySelectorAll('.priority-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.priority === priority);
  });
}


/* =========================================================================
   5. CHARACTER COUNTER
   ========================================================================= */

function setupCharCounter() {
  const textarea = document.getElementById('task-description');
  const counter  = document.getElementById('char-counter');
  if (!textarea || !counter) return;

  textarea.addEventListener('input', updateCharCounter);
  updateCharCounter();
}

function updateCharCounter() {
  const textarea = document.getElementById('task-description');
  const counter  = document.getElementById('char-counter');
  if (!textarea || !counter) return;

  const len = textarea.value.length;
  counter.textContent = `${len} / ${MAX_DESCRIPTION}`;

  counter.classList.remove('warn', 'limit');
  if (len >= MAX_DESCRIPTION) {
    counter.classList.add('limit');
    textarea.value = textarea.value.substring(0, MAX_DESCRIPTION);
    counter.textContent = `${MAX_DESCRIPTION} / ${MAX_DESCRIPTION}`;
  } else if (len >= MAX_DESCRIPTION * 0.85) {
    counter.classList.add('warn');
  }
}


/* =========================================================================
   6. LIVE PREVIEW
   ========================================================================= */

function setupLivePreview() {
  const fields = ['task-title', 'task-description', 'task-date', 'task-time', 'task-category', 'task-reminder'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
    if (el) el.addEventListener('change', updatePreview);
  });
}

function updatePreview() {
  const container = document.getElementById('preview-card-container');
  if (!container) return;

  const title       = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const date        = document.getElementById('task-date').value;
  const time        = document.getElementById('task-time').value;
  const category    = document.getElementById('task-category').value;
  const reminder    = document.getElementById('task-reminder').value;

  // If title is empty, show placeholder
  if (!title) {
    container.innerHTML = `
      <div class="preview-placeholder">
        ${icon('edit')}
        <p>Start typing to see a live preview of your task card</p>
      </div>`;
    return;
  }

  // Build a temporary task object for preview
  const previewTask = {
    id:          editingTaskId || 'preview',
    title:       title,
    description: description,
    deadline:    date && time ? `${date}T${time}` : (date ? `${date}T00:00` : ''),
    priority:    selectedPriority,
    category:    category,
    status:      editingTaskId ? (getTaskById(editingTaskId)?.status || 'pending') : 'pending',
    reminder:    reminder,
    createdAt:   new Date().toISOString(),
    completedAt: null
  };

  container.innerHTML = createTaskCard(previewTask);

  // Disable action buttons in preview (they should not be clickable)
  container.querySelectorAll('.task-card-checkbox, .btn-edit, .btn-delete').forEach(btn => {
    btn.style.pointerEvents = 'none';
  });
}


/* =========================================================================
   7. FORM VALIDATION
   ========================================================================= */

/**
 * Validates the form. Returns true if valid, false otherwise.
 * Adds .is-invalid class and shows error text for invalid fields.
 */
function validateTaskForm() {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

  // Title (required)
  const titleInput = document.getElementById('task-title');
  const titleError = document.getElementById('title-error');
  if (!titleInput.value.trim()) {
    titleInput.classList.add('is-invalid');
    titleError.textContent = 'Task title is required';
    isValid = false;
  }

  // Date (required)
  const dateInput = document.getElementById('task-date');
  const dateError = document.getElementById('date-error');
  if (!dateInput.value) {
    dateInput.classList.add('is-invalid');
    dateError.textContent = 'Please select a deadline date';
    isValid = false;
  }

  // Time (required)
  const timeInput = document.getElementById('task-time');
  const timeError = document.getElementById('time-error');
  if (!timeInput.value) {
    timeInput.classList.add('is-invalid');
    timeError.textContent = 'Please select a deadline time';
    isValid = false;
  }

  return isValid;
}


/* =========================================================================
   8. CREATE TASK
   ========================================================================= */

function createTask() {
  const currentUser = getCurrentUser();

  const newTask = {
    id:          't_' + Date.now(),
    userId:      currentUser ? currentUser.id : 'guest',
    title:       document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-description').value.trim(),
    deadline:    document.getElementById('task-date').value + 'T' + document.getElementById('task-time').value,
    priority:    selectedPriority,
    category:    document.getElementById('task-category').value,
    status:      'pending',
    reminder:    document.getElementById('task-reminder').value,
    createdAt:   new Date().toISOString(),
    completedAt: null
  };

  const tasks = getAllTasks();
  tasks.push(newTask);
  saveTasks(tasks);

  showToast('Task created successfully! 🎉', 'success');
  setTimeout(() => { window.location.href = 'tasks.html'; }, 600);
}


/* =========================================================================
   9. UPDATE TASK
   ========================================================================= */

function updateTask() {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === editingTaskId);
  const currentUser = getCurrentUser();
  if (index === -1 || !currentUser || tasks[index].userId !== currentUser.id) {
    showToast('Task not found or you do not have permission to edit it.', 'error');
    setTimeout(() => { window.location.href = 'tasks.html'; }, 800);
    return;
  }

  tasks[index] = {
    ...tasks[index],
    title:       document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-description').value.trim(),
    deadline:    document.getElementById('task-date').value + 'T' + document.getElementById('task-time').value,
    priority:    selectedPriority,
    category:    document.getElementById('task-category').value,
    reminder:    document.getElementById('task-reminder').value
  };

  saveTasks(tasks);

  showToast('Task updated successfully! ✅', 'success');
  setTimeout(() => { window.location.href = 'tasks.html'; }, 600);
}


/* =========================================================================
   10. DELETE TASK (from the form page)
   ========================================================================= */

async function deleteTask() {
  if (!editingTaskId) return;
  await confirmDelete(editingTaskId);
}


/* =========================================================================
   11. FORM SUBMIT HANDLER
   ========================================================================= */

function handleSubmit(e) {
  e.preventDefault();

  if (!validateTaskForm()) {
    showToast('Please fix the errors above', 'warning');
    return;
  }

  if (editingTaskId) {
    updateTask();
  } else {
    createTask();
  }
}
