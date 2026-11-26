// admin.js – Dashboard with correct KPI values

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. DOM REFS ======
  const totalRevenueEl = document.getElementById('totalRevenue');
  const totalOrdersEl = document.getElementById('totalOrders');
  const cashOrdersEl = document.getElementById('cashOrders');
  const cardOrdersEl = document.getElementById('cardOrders');
  const upiOrdersEl = document.getElementById('upiOrders');

  // ====== 2. GET ORDERS (same as sales page) ======
  function getOrders() {
    const stored = localStorage.getItem('kot_orders');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // ====== 3. ANIMATION (same as sales page) ======
  function animateNumber(element, targetValue, prefix = '₹', decimals = 2) {
    const startValue = 0;
    const duration = 800;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * eased;

      if (decimals === 0) {
        element.textContent = prefix + Math.round(current);
      } else {
        element.textContent = prefix + current.toFixed(decimals);
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        if (decimals === 0) {
          element.textContent = prefix + Math.round(targetValue);
        } else {
          element.textContent = prefix + targetValue.toFixed(decimals);
        }
      }
    }
    requestAnimationFrame(updateCounter);
  }

  // ====== 4. RENDER DASHBOARD ======
  function renderDashboard() {
  const allOrders = getOrders();
  const activeOrders = allOrders.filter(o => !o.archived);
  const total = activeOrders.length;
  const revenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  let cash = 0, card = 0, upi = 0;
  activeOrders.forEach(o => {
    const method = (o.paymentMethod || 'Cash').toLowerCase();
    if (method === 'cash') cash++;
    else if (method === 'card') card++;
    else if (method === 'upi') upi++;
    else cash++;
  });

  animateNumber(totalRevenueEl, revenue, '₹', 2);
  animateNumber(totalOrdersEl, total, '', 0);
  animateNumber(cashOrdersEl, cash, '', 0);
  animateNumber(cardOrdersEl, card, '', 0);
  animateNumber(upiOrdersEl, upi, '', 0);
}

  // ====== 5. LOGOUT ======
  function handleLogout() {
    if (confirm('Logout from Admin Panel?')) {
      window.location.href = '../index.html';
    }
  }
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('logoutTopBtn')?.addEventListener('click', handleLogout);

  // ====== 6. STORAGE CHANGE (cross-tab) ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'kot_orders' || e.key === 'order_counter') {
      renderDashboard();
    }
  });

  // ====== 7. AUTO-REFRESH ======
  setInterval(renderDashboard, 10000);

  // ====== 8. INIT ======
  renderDashboard();

}); 