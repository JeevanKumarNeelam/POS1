// admin-settings.js – Settings page logic

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. DOM REFS ======
  const nextOrderDisplay = document.getElementById('nextOrderDisplay');
  const resetOrderBtn = document.getElementById('resetOrderBtn');
  const clearOrdersBtn = document.getElementById('clearOrdersBtn');
  const clearAnnualBtn = document.getElementById('clearAnnualBtn');
  const usersTableBody = document.getElementById('usersTableBody');

  // Cafe Settings
  const cafeName = document.getElementById('cafeName');
  const cafeAddress = document.getElementById('cafeAddress');
  const cafePhone = document.getElementById('cafePhone');
  const cafeGst = document.getElementById('cafeGst');
  const cafeForm = document.getElementById('cafeSettingsForm');

  // Add User
  const addUserForm = document.getElementById('addUserForm');
  const newUsername = document.getElementById('newUsername');
  const newPassword = document.getElementById('newPassword');
  const newRole = document.getElementById('newRole');

  // Password Modal
  const passwordModal = document.getElementById('passwordModal');
  const passwordForm = document.getElementById('passwordForm');
  const currentPassword = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordCancelBtn = document.getElementById('passwordCancelBtn');
  let passwordTargetUser = null;

  // ====== 2. DEFAULT USERS ======
  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'cashier', password: 'cashier123', role: 'cashier' },
    { username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
  ];

  // ====== 3. USER MANAGEMENT ======
  function getUsers() {
    const stored = localStorage.getItem('users');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return defaultUsers;
      }
    }
    return defaultUsers;
  }

  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  function renderUsers() {
    const users = getUsers();
    if (users.length === 0) {
      usersTableBody.innerHTML = `<tr><td colspan="3" class="empty-row">No users found</td></tr>`;
      return;
    }
    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td><strong>${user.username}</strong></td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>
          <button class="action-btn password-btn" data-username="${user.username}">Change Password</button>
          <button class="action-btn delete-user-btn" data-username="${user.username}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Change Password handlers
    document.querySelectorAll('.password-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        passwordTargetUser = this.dataset.username;
        passwordModal.classList.add('active');
        passwordForm.reset();
      });
    });

    // Delete User handlers
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const username = this.dataset.username;
        // Prevent deleting the last admin
        const users = getUsers();
        const admins = users.filter(u => u.role === 'admin');
        if (admins.length === 1 && admins[0].username === username) {
          alert('❌ Cannot delete the only admin user.');
          return;
        }
        if (confirm(`⚠️ Are you sure you want to delete user "${username}"?`)) {
          const updated = users.filter(u => u.username !== username);
          saveUsers(updated);
          renderUsers();
        }
      });
    });
  }

  // ====== 4. CHANGE PASSWORD ======
  function changePassword(e) {
    e.preventDefault();

    const current = currentPassword.value.trim();
    const newPass = newPasswordInput.value.trim();
    const confirm = confirmPassword.value.trim();

    if (!current || !newPass || !confirm) {
      alert('Please fill all fields.');
      return;
    }

    if (newPass.length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }

    if (newPass !== confirm) {
      alert('New passwords do not match.');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username === passwordTargetUser);
    if (!user) {
      alert('User not found.');
      return;
    }

    // Verify current password
    if (user.password !== current) {
      alert('❌ Current password is incorrect.');
      return;
    }

    user.password = newPass;
    saveUsers(users);
    renderUsers();
    closePasswordModal();
    alert(`✅ Password for "${passwordTargetUser}" updated successfully!`);
  }

  // ====== 5. ADD USER ======
  function addUser(e) {
    e.preventDefault();

    const username = newUsername.value.trim();
    const password = newPassword.value.trim();
    const role = newRole.value;

    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }

    if (password.length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }

    const users = getUsers();
    if (users.find(u => u.username === username)) {
      alert(`❌ Username "${username}" already exists.`);
      return;
    }

    users.push({ username, password, role });
    saveUsers(users);
    renderUsers();
    addUserForm.reset();
    alert(`✅ User "${username}" added successfully!`);
  }

  // ====== 6. LOAD CAFE SETTINGS ======
  function loadCafeSettings() {
    const settings = JSON.parse(localStorage.getItem('cafe_settings') || '{}');
    cafeName.value = settings.name || 'Cafe Barista';
    cafeAddress.value = settings.address || '123 Coffee Street, City';
    cafePhone.value = settings.phone || '+91 98765 43210';
    cafeGst.value = settings.gst || '12ABCDE3456F1Z5';
  }

  // ====== 7. SAVE CAFE SETTINGS ======
  function saveCafeSettings(e) {
    e.preventDefault();
    const settings = {
      name: cafeName.value.trim(),
      address: cafeAddress.value.trim(),
      phone: cafePhone.value.trim(),
      gst: cafeGst.value.trim()
    };
    localStorage.setItem('cafe_settings', JSON.stringify(settings));
    alert('✅ Cafe settings saved successfully!');
  }

  // ====== 8. GET NEXT ORDER ID ======
  function getNextOrderNumber() {
    const counter = parseInt(localStorage.getItem('order_counter') || '0');
    const next = counter + 1;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}-${String(next).padStart(3, '0')}`;
  }

  function updateNextOrderDisplay() {
    nextOrderDisplay.textContent = `#${getNextOrderNumber()}`;
  }

  // ====== 9. RESET ORDER ID ======
  function resetOrderId() {
    if (!confirm('⚠️ Are you sure you want to reset the Order ID counter?\n\nThis will make the next order start from 001 for today.\nExisting orders will NOT be deleted.')) {
      return;
    }

    localStorage.setItem('order_counter', '0');
    updateNextOrderDisplay();

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    alert(`✅ Order ID counter reset successfully!\n\nNext order will be: #${y}${m}${d}-001`);
  }

  // ====== 10. CLEAR ALL ORDERS ======
  function clearAllOrders() {
    if (!confirm('⚠️⚠️⚠️ DANGER: This will delete ALL orders permanently!\n\nAre you absolutely sure?')) {
      return;
    }
    if (!confirm('Final confirmation: Delete all orders?')) {
      return;
    }

    localStorage.removeItem('kot_orders');
    localStorage.removeItem('kot_last_update');
    localStorage.setItem('order_counter', '0');
    updateNextOrderDisplay();
    alert('✅ All orders cleared and counter reset.');
  }

  // ====== 11. CLEAR ANNUAL SALES ======
  function clearAnnualSales() {
    if (!confirm('⚠️⚠️⚠️ DANGER: This will delete ALL sales data (orders and summaries) permanently!\n\nAre you absolutely sure?')) {
      return;
    }
    if (!confirm('Final confirmation: Clear all sales data?')) {
      return;
    }

    localStorage.removeItem('kot_orders');
    localStorage.removeItem('kot_last_update');
    localStorage.removeItem('sales_summary');
    localStorage.setItem('order_counter', '0');
    updateNextOrderDisplay();
    alert('✅ All sales data cleared. Annual sales reset successfully.');
  }

  // ====== 12. MODAL CONTROLS ======
  function closePasswordModal() {
    passwordModal.classList.remove('active');
    passwordTargetUser = null;
    passwordForm.reset();
  }

  // ====== 13. LOGOUT ======
  function handleLogout() {
    if (confirm('Logout from Admin Panel?')) {
      window.location.href = '../index.html';
    }
  }

  // ====== 14. EVENT LISTENERS ======
  resetOrderBtn.addEventListener('click', resetOrderId);
  clearOrdersBtn.addEventListener('click', clearAllOrders);
  clearAnnualBtn.addEventListener('click', clearAnnualSales);
  cafeForm.addEventListener('submit', saveCafeSettings);
  addUserForm.addEventListener('submit', addUser);
  passwordForm.addEventListener('submit', changePassword);
  passwordCancelBtn.addEventListener('click', closePasswordModal);
  passwordModal.addEventListener('click', function (e) {
    if (e.target === this) closePasswordModal();
  });

  document.getElementById('logoutTopBtn').addEventListener('click', handleLogout);

  // ====== 15. STORAGE CHANGE (cross-tab) ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'kot_orders' || e.key === 'order_counter') {
      updateNextOrderDisplay();
    }
    if (e.key === 'users') {
      renderUsers();
    }
  });

  // ====== 16. INIT ======
  loadCafeSettings();
  updateNextOrderDisplay();
  renderUsers();

});