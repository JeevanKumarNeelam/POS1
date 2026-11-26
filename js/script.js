document.addEventListener('DOMContentLoaded', function () {
  const signInBtn = document.getElementById('signInBtn');
  const roleSelect = document.getElementById('role');
  const usernameInput = document.getElementById('username');
  const pinInput = document.getElementById('pin');
  const notification = document.getElementById('notification');

  // Redirect mapping
  const redirectMap = {
    Admin: 'admin.html',
    Cashier: 'pos.html',
    Kitchen: 'kot.html'
  };

  const credentials = {
    Admin: { username: 'admin', pin: '1234' },
    Cashier: { username: 'cashier', pin: '1234' },
    Kitchen: { username: 'kitchen', pin: '1234' }
  };

  let redirectTimeout = null;
  let hideTimeout = null;

  // Show notification with type (success/error)
  function showNotification(message, type = 'success') {
    // Clear any existing timeouts
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
      redirectTimeout = null;
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    notification.textContent = message;
    notification.className = 'notification'; // reset
    // Force reflow to restart animation
    void notification.offsetWidth;
    notification.className = `notification ${type} show`;
  }

  // Hide notification (with optional delay)
  function hideNotification(delay = 0) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    if (delay > 0) {
      hideTimeout = setTimeout(() => {
        notification.className = 'notification';
      }, delay);
    } else {
      notification.className = 'notification';
    }
  }

  // Hide on role change
  roleSelect.addEventListener('change', function () {
    usernameInput.placeholder = `Enter ${this.value.toLowerCase()} username`;
    hideNotification(0);
  });

  // Sign In
  signInBtn.addEventListener('click', function (e) {
    e.preventDefault();

    const role = roleSelect.value;
    const username = usernameInput.value.trim();
    const pin = pinInput.value.trim();

    // Clear previous timeouts
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
      redirectTimeout = null;
    }
    hideNotification(0);

    // Validations
    if (!username) {
      showNotification('Please enter your username.', 'error');
      usernameInput.focus();
      hideNotification(3000); // auto-hide error after 3s
      return;
    }
    if (!pin) {
      showNotification('Please enter your PIN.', 'error');
      pinInput.focus();
      hideNotification(3000);
      return;
    }

    const expected = credentials[role];

    if (username === expected.username && pin === expected.pin) {
      // Success
      showNotification('✅ Logged in Successfully', 'success');

      // Redirect after 1 second
      redirectTimeout = setTimeout(function () {
        const redirectUrl = redirectMap[role] || 'dashboard.html';
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      showNotification(`❌ Invalid username or PIN for ${role}.`, 'error');
      pinInput.value = '';
      pinInput.focus();
      hideNotification(3000);
    }
  });

  // Enter key support
  document.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        signInBtn.click();
      }
    });
  });
});