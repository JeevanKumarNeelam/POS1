// admin-sales.js – Sales with 3 KPI cards (Revenue counts all orders)

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. DOM REFS ======
  const todaySalesEl = document.getElementById('todaySales');
  const monthSalesEl = document.getElementById('monthSales');
  const totalSalesEl = document.getElementById('totalSales');
  const salesBody = document.getElementById('salesBody');
  const salesCount = document.getElementById('salesCount');
  const refreshBtn = document.getElementById('refreshSalesBtn');
  const exportBtn = document.getElementById('exportSalesBtn');
  const resetMonthBtn = document.getElementById('resetMonthBtn');

  // ====== 2. GET ORDERS ======
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

  function saveOrders(orders) {
    localStorage.setItem('kot_orders', JSON.stringify(orders));
    localStorage.setItem('kot_last_update', Date.now().toString());
  }

  // ====== 3. ANIMATION ======
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

  // ====== 4. BUILD DAILY SUMMARY ======
  function buildDailySummary(orders) {
    const summary = {};

    orders.forEach(order => {
      const date = new Date(order.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!summary[dateKey]) {
        summary[dateKey] = {
          date: dateKey,
          day: dayName,
          cash: 0,
          card: 0,
          upi: 0,
          total: 0
        };
      }

      const method = (order.paymentMethod || 'Cash').toLowerCase();
      const amount = order.total || 0;
      summary[dateKey].total += amount;
      if (method === 'cash') summary[dateKey].cash += amount;
      else if (method === 'card') summary[dateKey].card += amount;
      else if (method === 'upi') summary[dateKey].upi += amount;
      else summary[dateKey].cash += amount;
    });

    const sortedDates = Object.keys(summary).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(key => summary[key]);
  }

  // ====== 5. RENDER SALES ======
  function renderSales() {
    const allOrders = getOrders();

    // Active orders (not archived) – for today's revenue and table
    const activeOrders = allOrders.filter(o => !o.archived);
    // All orders (including archived) – for month and annual totals
    const allOrdersWithPayment = allOrders.filter(o => o.total > 0 && o.paymentMethod);

    // Date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // TODAY REVENUE – from active orders placed today (any status)
    const todayOrders = activeOrders.filter(o => new Date(o.timestamp) >= today);
    const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // THIS MONTH – from ALL orders (including archived) placed this month
    const monthOrders = allOrdersWithPayment.filter(o => new Date(o.timestamp) >= monthStart);
    const monthTotal = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // ANNUAL – from ALL orders (including archived)
    const totalRevenue = allOrdersWithPayment.reduce((sum, o) => sum + (o.total || 0), 0);

    // Animate KPIs
    animateNumber(todaySalesEl, todayTotal, '₹', 2);
    animateNumber(monthSalesEl, monthTotal, '₹', 2);
    animateNumber(totalSalesEl, totalRevenue, '₹', 2);

    // Build daily summary from ALL orders (archived + active) for the table
    const dailyData = buildDailySummary(allOrdersWithPayment);

    salesCount.textContent = `${dailyData.length} day${dailyData.length !== 1 ? 's' : ''}`;

    if (dailyData.length === 0) {
      salesBody.innerHTML = `<tr><td colspan="7" class="empty-row">No sales data available</td></tr>`;
      return;
    }

    salesBody.innerHTML = dailyData.map((day, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${day.date}</td>
        <td>${day.day}</td>
        <td>₹${(day.cash || 0).toFixed(2)}</td>
        <td>₹${(day.card || 0).toFixed(2)}</td>
        <td>₹${(day.upi || 0).toFixed(2)}</td>
        <td>₹${(day.total || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  }

  // ====== 6. EXPORT CSV ======
  function exportSales() {
    const orders = getOrders();
    const allOrdersWithPayment = orders.filter(o => o.total > 0 && o.paymentMethod);
    const dailyData = buildDailySummary(allOrdersWithPayment);

    if (dailyData.length === 0) {
      alert('No sales data to export.');
      return;
    }

    let csv = 'S.No,Date,Day,Cash,Card,UPI,Total\n';
    dailyData.forEach((day, idx) => {
      csv += `${idx + 1},${day.date},${day.day},${(day.cash || 0).toFixed(2)},${(day.card || 0).toFixed(2)},${(day.upi || 0).toFixed(2)},${(day.total || 0).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const now = new Date();
    const dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    link.download = `sales_summary_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ====== 7. RESET MONTH ======
  function resetMonth() {
    if (!confirm('⚠️ Are you sure you want to reset this month\'s sales data?\n\nThis will archive all orders from the current month.')) {
      return;
    }

    const orders = getOrders();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const updatedOrders = orders.map(order => {
      const orderDate = new Date(order.timestamp);
      if (orderDate >= monthStart) {
        return { ...order, archived: true };
      }
      return order;
    });

    saveOrders(updatedOrders);
    renderSales();
    alert('✅ Current month\'s sales data has been reset.');
  }

  // ====== 8. LOGOUT ======
  function handleLogout() {
    if (confirm('Logout from Admin Panel?')) {
      window.location.href = '../index.html';
    }
  }
  document.getElementById('logoutTopBtn').addEventListener('click', handleLogout);

  // ====== 9. EVENT LISTENERS ======
  refreshBtn.addEventListener('click', function () {
    renderSales();
    this.textContent = '⟳ Refreshed!';
    setTimeout(() => { this.textContent = '⟳ Refresh'; }, 1000);
  });

  exportBtn.addEventListener('click', exportSales);
  resetMonthBtn.addEventListener('click', resetMonth);

  // ====== 10. STORAGE EVENT ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'kot_orders' || e.key === 'kot_last_update') {
      renderSales();
    }
  });

  // ====== 11. FOCUS EVENT ======
  window.addEventListener('focus', function () {
    renderSales();
  });

  // ====== 12. AUTO-REFRESH ======
  setInterval(renderSales, 5000);

  // ====== 13. INIT ======
  renderSales();
});