// admin-orders.js – Orders page logic with Reset & Clear + instant sync

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. DOM REFS (with null checks) ======
  const ordersBody = document.getElementById('ordersBody');
  const orderStatusFilter = document.getElementById('orderStatusFilter');
  const paymentFilter = document.getElementById('paymentFilter');
  const refreshBtn = document.getElementById('refreshOrdersBtn');
  const resetBtn = document.getElementById('resetOrderBtn');
  const clearTodayBtn = document.getElementById('clearTodayBtn');
  const clearAllBtn = document.getElementById('clearOrdersBtn');
  const orderCount = document.getElementById('orderCount');

  // KPI Cards
  const totalOrdersEl = document.getElementById('totalOrders');
  const pendingOrdersEl = document.getElementById('pendingOrders');
  const preparingOrdersEl = document.getElementById('preparingOrders');
  const readyOrdersEl = document.getElementById('readyOrders');
  const completedOrdersEl = document.getElementById('completedOrders');

  // ====== 2. HELPERS ======
  function getOrders() {
    const stored = localStorage.getItem('kot_orders');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('📦 Orders loaded:', parsed.length, 'orders');
        return parsed;
      } catch (e) {
        console.error('❌ Error parsing orders:', e);
        return [];
      }
    }
    console.log('ℹ️ No orders found in localStorage');
    return [];
  }

  function saveOrders(orders) {
    localStorage.setItem('kot_orders', JSON.stringify(orders));
    localStorage.setItem('kot_last_update', Date.now().toString());
    console.log('💾 Orders saved:', orders.length, 'orders');
  }

  // ====== 3. UPDATE KPI CARDS ======
  function updateKPIs(allOrders) {
    const activeOrders = allOrders.filter(o => !o.archived);
    const total = activeOrders.length;
    const pending = activeOrders.filter(o => o.status === 'pending').length;
    const preparing = activeOrders.filter(o => o.status === 'preparing').length;
    const ready = activeOrders.filter(o => o.status === 'ready').length;
    const completed = activeOrders.filter(o => o.status === 'completed').length;

    if (totalOrdersEl) totalOrdersEl.textContent = total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pending;
    if (preparingOrdersEl) preparingOrdersEl.textContent = preparing;
    if (readyOrdersEl) readyOrdersEl.textContent = ready;
    if (completedOrdersEl) completedOrdersEl.textContent = completed;
  }

  // ====== 4. RENDER ORDERS ======
  function renderOrders() {
    console.log('🔄 Rendering Orders...');
    const allOrders = getOrders();
    let orders = allOrders.filter(o => !o.archived); // only active

    // Apply filters
    const statusFilter = orderStatusFilter ? orderStatusFilter.value : 'all';
    const paymentFilterVal = paymentFilter ? paymentFilter.value : 'all';

    if (statusFilter !== 'all') {
      orders = orders.filter(o => o.status === statusFilter);
    }
    if (paymentFilterVal !== 'all') {
      orders = orders.filter(o => (o.paymentMethod || 'Cash') === paymentFilterVal);
    }

    // Update KPIs (based on all active orders, not filtered)
    updateKPIs(allOrders);

    // Sort: newest first
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Update count
    if (orderCount) {
      orderCount.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;
    }

    if (!ordersBody) {
      console.error('❌ ordersBody element not found!');
      return;
    }

    if (orders.length === 0) {
      ordersBody.innerHTML = `<tr><td colspan="8" class="empty-row">No active orders found</td></tr>`;
      return;
    }

    // Build table rows
    ordersBody.innerHTML = orders.map(order => {
      const date = new Date(order.timestamp);
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const itemsHtml = order.items.map(item => `
        <li><span class="item-qty">${item.qty}×</span> ${item.name}</li>
      `).join('');

      const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
      const prices = order.items.map(item => `₹${item.price}`);
      const pricePerItem = prices.join(', ');

      const status = order.status || 'pending';
      const payment = order.paymentMethod || 'Cash';
      const amount = (order.total || 0).toFixed(2);
      const paymentClass = payment.toLowerCase();

      return `
        <tr>
          <td><strong>#${order.orderId}</strong></td>
          <td>${dateStr}, ${timeStr}</td>
          <td>
            <ul class="order-items-list">${itemsHtml}</ul>
          </td>
          <td>${totalQty}</td>
          <td>${pricePerItem}</td>
          <td>₹${amount}</td>
          <td><span class="payment-badge ${paymentClass}">${payment}</span></td>
          <td><span class="status-badge ${status}">${status}</span></td>
        </tr>
      `;
    }).join('');
    console.log('✅ Orders rendered:', orders.length, 'orders shown');
  }

  // ====== 5. RESET ORDER ID ======
  function resetOrderId() {
    if (!confirm('⚠️ Are you sure you want to reset the Order ID counter?\n\nThis will make the next order start from 001 for today.')) {
      return;
    }

    localStorage.setItem('order_counter', '0');
    localStorage.setItem('kot_last_update', Date.now().toString());

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    alert(`✅ Order ID counter reset successfully!\n\nNext order will be: #${y}${m}${d}-001`);
    renderOrders();
  }

  // ====== 6. CLEAR TODAY'S ORDERS ======
  function clearTodayOrders() {
    if (!confirm('⚠️ Are you sure you want to clear TODAY\'S orders?\n\nThis will archive today\'s orders.')) {
      return;
    }

    const orders = getOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedOrders = orders.map(order => {
      const orderDate = new Date(order.timestamp);
      if (orderDate >= today) {
        return { ...order, archived: true };
      }
      return order;
    });

    saveOrders(updatedOrders);
    renderOrders();
    alert('✅ Today\'s orders archived successfully.');
  }

  // ====== 7. CLEAR ALL ORDERS ======
  function clearAllOrders() {
    if (!confirm('⚠️⚠️⚠️ DANGER: This will archive ALL orders permanently!\n\nThey will remain in sales totals but will not appear in active tables.')) {
      return;
    }
    if (!confirm('Final confirmation: Archive all orders?')) {
      return;
    }

    const orders = getOrders();
    const archivedOrders = orders.map(order => ({ ...order, archived: true }));
    saveOrders(archivedOrders);
    localStorage.setItem('order_counter', '0');
    localStorage.setItem('kot_last_update', Date.now().toString());

    alert('✅ All orders archived successfully.');
    renderOrders();
  }

  // ====== 8. EVENT LISTENERS (with null checks) ======
  if (orderStatusFilter) orderStatusFilter.addEventListener('change', renderOrders);
  if (paymentFilter) paymentFilter.addEventListener('change', renderOrders);

  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      renderOrders();
      this.textContent = '⟳ Refreshed!';
      setTimeout(() => { this.textContent = '⟳ Refresh'; }, 1000);
    });
  }

  if (resetBtn) resetBtn.addEventListener('click', resetOrderId);
  if (clearTodayBtn) clearTodayBtn.addEventListener('click', clearTodayOrders);
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllOrders);

  const logoutTopBtn = document.getElementById('logoutTopBtn');
  if (logoutTopBtn) {
    logoutTopBtn.addEventListener('click', function () {
      if (confirm('Logout from Admin Panel?')) {
        window.location.href = '../index.html';
      }
    });
  }

  // ====== 9. STORAGE CHANGE (cross-tab sync) ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'kot_orders' || e.key === 'kot_last_update' || e.key === 'order_counter') {
      console.log('📡 Storage event detected, refreshing...');
      renderOrders();
    }
  });

  // ====== 10. AUTO-REFRESH ======
  setInterval(renderOrders, 5000);

  // ====== 11. INIT ======
  console.log('🚀 Admin Orders page initialized');
  renderOrders();

});