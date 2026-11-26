// admin-menu.js – Category & Menu page logic

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. STATE ======
  let menuItems = [];
  let selectedCategory = 'All';
  let editingItemId = null;

  // ====== 2. DOM REFS ======
  const categoryList = document.getElementById('categoryList');
  const menuItemsGrid = document.getElementById('menuItemsGrid');
  const categoryTitle = document.getElementById('categoryTitle');
  const itemCount = document.getElementById('itemCount');

  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
  const addItemBtn = document.getElementById('addItemBtn');
  const refreshBtn = document.getElementById('refreshMenuBtn');

  // Item Modal
  const itemModal = document.getElementById('itemModal');
  const modalTitle = document.getElementById('modalTitle');
  const itemForm = document.getElementById('itemForm');
  const itemCategory = document.getElementById('itemCategory');
  const itemName = document.getElementById('itemName');
  const itemPrice = document.getElementById('itemPrice');
  const modalCancelBtn = document.getElementById('modalCancelBtn');

  // Delete Category Modal
  const deleteCategoryModal = document.getElementById('deleteCategoryModal');
  const deleteCategorySelect = document.getElementById('deleteCategorySelect');
  const deleteCategoryCancelBtn = document.getElementById('deleteCategoryCancelBtn');
  const deleteCategoryConfirmBtn = document.getElementById('deleteCategoryConfirmBtn');

  // Delete Item Modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteItemName = document.getElementById('deleteItemName');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');

  let deleteTargetId = null;

  // ====== 3. DEFAULT MENU ======
  const defaultMenu = [
    { id: 1, name: 'Coffee', price: 35, category: 'Beverages' },
    { id: 2, name: 'Tea', price: 25, category: 'Beverages' },
    { id: 3, name: 'Soda', price: 15, category: 'Beverages' },
    { id: 4, name: 'Water', price: 10, category: 'Beverages' },
    { id: 5, name: 'Sandwich', price: 65, category: 'Fast Food' },
    { id: 6, name: 'Burger', price: 85, category: 'Fast Food' },
    { id: 7, name: 'Fries', price: 30, category: 'Fast Food' },
    { id: 8, name: 'Pizza', price: 55, category: 'Fast Food' },
    { id: 9, name: 'Momos', price: 50, category: 'Fast Food' },
    { id: 10, name: 'Noodles', price: 70, category: 'Fast Food' },
    { id: 11, name: 'Cake', price: 45, category: 'Desserts' },
    { id: 12, name: 'Salad', price: 15, category: 'Healthy' }
  ];

  // ====== 4. LOAD & SAVE ======
  function loadMenuItems() {
    const stored = localStorage.getItem('admin_menu');
    if (stored) {
      try {
        menuItems = JSON.parse(stored);
        menuItems = menuItems.map(item => ({
          ...item,
          price: parseFloat(item.price) || 0
        }));
        menuItems = menuItems.filter(item => item.category !== 'TOP SELLERS');
      } catch (e) {
        menuItems = defaultMenu;
        saveMenuItems();
      }
    } else {
      menuItems = defaultMenu;
      saveMenuItems();
    }
    if (menuItems.length === 0) {
      menuItems = defaultMenu;
      saveMenuItems();
    }
    renderAll();
  }

  function saveMenuItems() {
    localStorage.setItem('admin_menu', JSON.stringify(menuItems));
  }

  // ====== 5. GET CATEGORIES ======
  function getCategories() {
    const cats = [...new Set(menuItems.map(item => item.category))];
    return cats.filter(c => c && c.trim() !== '');
  }

  // ====== 6. RENDER CATEGORIES ======
  function renderCategories() {
    const categories = ['All', ...getCategories()];
    categoryList.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-item' + (cat === selectedCategory ? ' active' : '');
      btn.dataset.category = cat;
      const count = cat === 'All' ? menuItems.length : menuItems.filter(item => item.category === cat).length;
      btn.innerHTML = `${cat} <span class="cat-count">${count}</span>`;
      btn.addEventListener('click', function () {
        selectedCategory = this.dataset.category;
        renderCategories();
        renderItems();
      });
      categoryList.appendChild(btn);
    });
  }

  // ====== 7. RENDER ITEMS ======
  function renderItems() {
    const filtered = selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory);

    categoryTitle.textContent = selectedCategory === 'All' ? 'All Items' : `${selectedCategory}`;
    itemCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      menuItemsGrid.innerHTML = `<div class="empty-items">No items in this category</div>`;
      return;
    }

    menuItemsGrid.innerHTML = filtered.map(item => `
      <div class="menu-item-card" data-id="${item.id}">
        <span class="item-name">${item.name}</span>
        <span class="item-price">₹${item.price}</span>
        <span class="item-category-tag">${item.category}</span>
        <div class="action-buttons">
          <button class="edit-btn" data-id="${item.id}">Edit</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = parseInt(this.dataset.id);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = parseInt(this.dataset.id);
        openDeleteModal(id);
      });
    });
  }

  // ====== 8. RENDER ALL ======
  function renderAll() {
    renderCategories();
    renderItems();
  }

  // ====== 9. ADD CATEGORY ======
  function addCategory() {
    const name = prompt('Enter new category name:');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Category name cannot be empty.');
      return;
    }
    const categories = getCategories();
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Category already exists.');
      return;
    }
    // Add a dummy item so the category appears
    const dummyItem = {
      id: Date.now(),
      name: 'New Item',
      price: 10,
      category: trimmed
    };
    menuItems.push(dummyItem);
    saveMenuItems();
    renderAll();
    // Open add item modal with this category pre-selected
    populateCategoryDropdown();
    itemCategory.value = trimmed;
    itemName.value = '';
    itemPrice.value = '';
    modalTitle.textContent = 'Add Menu Item';
    editingItemId = null;
    itemModal.classList.add('active');
  }

  // ====== 10. DELETE CATEGORY ======
  function openDeleteCategoryModal() {
    const categories = getCategories();
    if (categories.length === 0) {
      alert('No categories to delete.');
      return;
    }
    deleteCategorySelect.innerHTML = '<option value="">-- Select Category --</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      deleteCategorySelect.appendChild(opt);
    });
    deleteCategoryModal.classList.add('active');
  }

  function confirmDeleteCategory() {
    const category = deleteCategorySelect.value;
    if (!category) {
      alert('Please select a category to delete.');
      return;
    }
    const count = menuItems.filter(item => item.category === category).length;
    if (!confirm(`⚠️ Are you sure you want to delete category "${category}"?\n\nThis will delete ${count} item(s) in this category.\nThis action cannot be undone.`)) {
      return;
    }
    // Remove all items in this category
    menuItems = menuItems.filter(item => item.category !== category);
    saveMenuItems();
    renderAll();
    closeDeleteCategoryModal();
    alert(`✅ Category "${category}" and ${count} item(s) deleted successfully.`);
  }

  function closeDeleteCategoryModal() {
    deleteCategoryModal.classList.remove('active');
    deleteCategorySelect.value = '';
  }

  // ====== 11. ITEM MODAL FUNCTIONS ======
  function openAddModal() {
    modalTitle.textContent = 'Add Menu Item';
    editingItemId = null;
    itemForm.reset();
    populateCategoryDropdown();
    itemCategory.value = '';
    itemModal.classList.add('active');
  }

  function openEditModal(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    modalTitle.textContent = 'Edit Menu Item';
    editingItemId = id;
    populateCategoryDropdown();
    itemCategory.value = item.category;
    itemName.value = item.name;
    itemPrice.value = item.price;
    itemModal.classList.add('active');
  }

  function populateCategoryDropdown() {
    const categories = getCategories();
    itemCategory.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      itemCategory.appendChild(opt);
    });
  }

  function saveItem(e) {
    e.preventDefault();
    const category = itemCategory.value.trim();
    const name = itemName.value.trim();
    const price = parseFloat(itemPrice.value);
    if (!category || !name || isNaN(price) || price < 0) {
      alert('Please fill all fields correctly.');
      return;
    }
    // If category doesn't exist, add it
    if (!getCategories().includes(category)) {
      // Add a dummy item to create the category
      // But we're already adding an item, so we'll just create it
    }
    if (editingItemId) {
      const index = menuItems.findIndex(i => i.id === editingItemId);
      if (index !== -1) {
        menuItems[index] = { ...menuItems[index], category, name, price };
      }
    } else {
      const newItem = { id: Date.now(), name, price, category };
      menuItems.push(newItem);
    }
    saveMenuItems();
    renderAll();
    closeModal();
  }

  function closeModal() {
    itemModal.classList.remove('active');
  }

  // ====== 12. DELETE ITEM ======
  function openDeleteModal(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    deleteTargetId = id;
    deleteItemName.textContent = item.name;
    deleteModal.classList.add('active');
  }

  function confirmDeleteItem() {
    if (deleteTargetId === null) return;
    menuItems = menuItems.filter(item => item.id !== deleteTargetId);
    saveMenuItems();
    renderAll();
    closeDeleteModal();
    deleteTargetId = null;
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
  }

  // ====== 13. LOGOUT ======
  function handleLogout() {
    if (confirm('Logout from Admin Panel?')) {
      window.location.href = '../index.html';
    }
  }

  // ====== 14. EVENT LISTENERS ======
  addCategoryBtn.addEventListener('click', addCategory);
  deleteCategoryBtn.addEventListener('click', openDeleteCategoryModal);
  addItemBtn.addEventListener('click', openAddModal);
  refreshBtn.addEventListener('click', function () {
    loadMenuItems();
    this.textContent = '⟳ Refreshed!';
    setTimeout(() => { this.textContent = '⟳ Refresh'; }, 1000);
  });

  modalCancelBtn.addEventListener('click', closeModal);
  itemForm.addEventListener('submit', saveItem);

  deleteCategoryCancelBtn.addEventListener('click', closeDeleteCategoryModal);
  deleteCategoryConfirmBtn.addEventListener('click', confirmDeleteCategory);
  deleteCategoryModal.addEventListener('click', function (e) {
    if (e.target === this) closeDeleteCategoryModal();
  });

  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteConfirmBtn.addEventListener('click', confirmDeleteItem);
  deleteModal.addEventListener('click', function (e) {
    if (e.target === this) closeDeleteModal();
  });
  itemModal.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('logoutTopBtn').addEventListener('click', handleLogout);

  // ====== 15. STORAGE CHANGE ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'admin_menu') {
      loadMenuItems();
    }
  });

  // ====== 16. INIT ======
  loadMenuItems();

});