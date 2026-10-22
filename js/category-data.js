const DEFAULT_TASK_CATEGORIES = [
  { id: 'work', name: 'Work', icon: '💼', color: '#5684f4', isDefault: true },
  { id: 'personal', name: 'Personal', icon: '🏠', color: '#ee60b7', isDefault: true },
  { id: 'school', name: 'School', icon: '🎓', color: '#f5c342', isDefault: true },
  { id: 'health', name: 'Health', icon: '💚', color: '#32c98f', isDefault: true },
  { id: 'other', name: 'Other', icon: '✨', color: '#38bdf8', isDefault: true }
];

const TASK_CATEGORIES_STORAGE_KEY = 'todo_categories';

function getTaskCategories() {
  const stored = localStorage.getItem(TASK_CATEGORIES_STORAGE_KEY);
  if (stored === null) {
    saveTaskCategories(DEFAULT_TASK_CATEGORIES);
    return DEFAULT_TASK_CATEGORIES.map(category => ({ ...category }));
  }

  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved categories must be an array.');
  }

  const categories = parsed.map(category => {
    if (!category || typeof category !== 'object' ||
      typeof category.id !== 'string' || typeof category.name !== 'string' ||
      typeof category.icon !== 'string' || !/^#[0-9a-f]{6}$/i.test(category.color)) {
      throw new Error('Saved category data is invalid.');
    }
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      isDefault: DEFAULT_TASK_CATEGORIES.some(item => item.id === category.id)
    };
  });

  DEFAULT_TASK_CATEGORIES.forEach(defaultCategory => {
    if (!categories.some(category => category.id === defaultCategory.id)) {
      categories.unshift({ ...defaultCategory });
    }
  });

  return categories;
}

function saveTaskCategories(categories) {
  localStorage.setItem(TASK_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
}

function findTaskCategory(id) {
  return getTaskCategories().find(category => category.id === id) || null;
}
