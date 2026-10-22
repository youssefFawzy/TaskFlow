function initCategoriesPage() {
  if (!requireLogin(true)) return;

  document.getElementById('add-category-form').addEventListener('submit', addCategory);
  document.getElementById('edit-category-form').addEventListener('submit', saveCategoryEdit);
  document.getElementById('categories-grid').addEventListener('click', handleCategoryAction);

  renderCategories();
}

function readCategoryPageTasks() {
  const stored = localStorage.getItem('todo_tasks');
  if (stored === null) return [];
  const tasks = JSON.parse(stored);
  if (!Array.isArray(tasks) || tasks.some(task => !task || typeof task !== 'object' || Array.isArray(task))) {
    throw new Error('Saved task data is invalid.');
  }
  return tasks;
}

function renderCategories() {
  const categoriesGrid = document.getElementById('categories-grid');
  try {
    const categories = getTaskCategories();
    const user = getCurrentUser();
    const tasks = user ? readCategoryPageTasks().filter(task => task.userId === user.id) : [];
    document.getElementById('category-count').textContent =
      `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`;
    categoriesGrid.innerHTML = categories.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category.id);
      const completed = categoryTasks.filter(task => task.status === 'completed').length;
      const progress = categoryTasks.length ? Math.round(completed / categoryTasks.length * 100) : 0;
      const href = `tasks.html?category=${encodeURIComponent(category.id)}`;
      return `
        <article class="card category-card" style="--category-color:${category.color}">
          <a class="category-card-link" href="${escapeHTML(href)}" aria-label="View ${escapeHTML(category.name)} tasks">
            <div class="category-card-top">
              <span class="category-icon" aria-hidden="true">${escapeHTML(category.icon)}</span>
              ${category.isDefault ? '<span class="badge badge-primary no-dot">Default</span>' : ''}
            </div>
            <h3 class="category-card-title">${escapeHTML(category.name)}</h3>
            <p class="category-task-count">${categoryTasks.length} ${categoryTasks.length === 1 ? 'task' : 'tasks'}</p>
            <div class="category-progress-label">
              <span>Completion</span><strong>${progress}%</strong>
            </div>
            <div class="category-progress-track" role="progressbar" aria-label="${escapeHTML(category.name)} completion"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
              <span class="category-progress-fill" style="width:${progress}%"></span>
            </div>
          </a>
          <div class="category-card-actions">
            <button class="btn btn-ghost btn-sm" type="button" data-edit-category="${escapeHTML(category.id)}">
              ${icon('edit')} Rename
            </button>
            <button class="btn btn-ghost btn-sm category-delete" type="button"
                    data-delete-category="${escapeHTML(category.id)}"
                    ${category.isDefault ? 'disabled title="Default categories cannot be deleted"' : ''}>
              ${icon('trash')} Delete
            </button>
          </div>
        </article>`;
    }).join('');
  } catch (err) {
    console.error('Unable to load categories:', err);
    categoriesGrid.innerHTML = `
      <div class="card category-error" role="alert">
        <h3>Categories could not be loaded</h3>
        <p class="text-muted mt-2">Check browser storage and reload this page.</p>
      </div>`;
    showToast('Categories could not be loaded. Check browser storage and try again.', 'error');
  }
}

function addCategory(event) {
  event.preventDefault();
  const nameInput = document.getElementById('category-name');
  const iconInput = document.getElementById('category-icon');
  const name = nameInput.value.trim();
  const categoryIcon = iconInput.value.trim() || '✨';
  if (!name) {
    nameInput.focus();
    showToast('Enter a name for the category.', 'warning');
    return;
  }

  try {
    const categories = getTaskCategories();
    if (categories.some(category => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      nameInput.focus();
      showToast('A category with that name already exists.', 'warning');
      return;
    }
    categories.push({
      id: `category_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      icon: categoryIcon,
      color: document.getElementById('category-color').value,
      isDefault: false
    });
    saveTaskCategories(categories);
    event.target.reset();
    document.getElementById('category-icon').value = '✨';
    document.getElementById('category-color').value = '#8b78ff';
    renderCategories();
    showToast('Category created.', 'success');
  } catch (err) {
    console.error('Unable to save category:', err);
    showToast('Category could not be saved. Check browser storage and try again.', 'error');
  }
}

function handleCategoryAction(event) {
  const editButton = event.target.closest('[data-edit-category]');
  if (editButton) {
    openCategoryEditor(editButton.dataset.editCategory);
    return;
  }
  const deleteButton = event.target.closest('[data-delete-category]');
  if (deleteButton && !deleteButton.disabled) {
    deleteCategory(deleteButton.dataset.deleteCategory);
  }
}

function openCategoryEditor(id) {
  try {
    const category = findTaskCategory(id);
    if (!category) {
      showToast('Category not found.', 'error');
      return;
    }
    document.getElementById('edit-category-id').value = category.id;
    document.getElementById('edit-category-name').value = category.name;
    document.getElementById('edit-category-icon').value = category.icon;
    document.getElementById('edit-category-color').value = category.color;
    openModal('edit-category-modal');
  } catch (err) {
    console.error('Unable to edit category:', err);
    showToast('Category could not be opened for editing.', 'error');
  }
}

function saveCategoryEdit(event) {
  event.preventDefault();
  const id = document.getElementById('edit-category-id').value;
  const name = document.getElementById('edit-category-name').value.trim();
  const categoryIcon = document.getElementById('edit-category-icon').value.trim() || '✨';
  if (!name) {
    document.getElementById('edit-category-name').focus();
    showToast('Enter a name for the category.', 'warning');
    return;
  }

  try {
    const categories = getTaskCategories();
    if (categories.some(category =>
      category.id !== id && category.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    )) {
      showToast('A category with that name already exists.', 'warning');
      return;
    }
    const category = categories.find(item => item.id === id);
    if (!category) {
      showToast('Category not found.', 'error');
      closeModal('edit-category-modal');
      return;
    }
    category.name = name;
    category.icon = categoryIcon;
    category.color = document.getElementById('edit-category-color').value;
    saveTaskCategories(categories);
    closeModal('edit-category-modal');
    renderCategories();
    showToast('Category updated.', 'success');
  } catch (err) {
    console.error('Unable to save category changes:', err);
    showToast('Category changes could not be saved. Check browser storage and try again.', 'error');
  }
}

async function deleteCategory(id) {
  try {
    const category = findTaskCategory(id);
    if (!category || category.isDefault) return;

    const tasks = readCategoryPageTasks();
    if (tasks.some(task => task.category === id)) {
      showToast('Move this category’s tasks before deleting it.', 'warning');
      return;
    }

    const confirmed = await confirmDialog(
      'Delete this category?',
      `"${category.name}" will be permanently removed.`,
      true
    );
    if (!confirmed) return;

    saveTaskCategories(getTaskCategories().filter(item => item.id !== id));
    renderCategories();
    showToast('Category deleted.', 'success');
  } catch (err) {
    console.error('Unable to delete category:', err);
    showToast('Category could not be deleted. Check browser storage and try again.', 'error');
  }
}
