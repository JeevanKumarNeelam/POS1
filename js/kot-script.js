// kot-script.js – Kitchen Order Ticket (Fully Working)

document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. STATE ======
  let orders = [];
  let currentFilter = 'all';
  let refreshInterval = null;

  // ====== 2. DOM REFS ======
  const ordersGrid = document.getElementById('ordersGrid');
  const emptyState = document.getElementById('emptyState');
  const orderCount = document.getElementById('orderCount');
  const refreshBtn = document.getElementById('refreshBtn');
  const filterBtns = document.querySelectorAll('.nav-btn');

  // KPI elements
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiPending = document.getElementById('kpiPending');
  const kpiPreparing = document.getElementById('kpiPreparing');
  const kpiReady = document.getElementById('kpiReady');
  const kpiCompleted = document.getElementById('kpiCompleted');

  // ====== 3. HELPERS ======
  function getOrders() {
    const stored = localStorage.getItem('kot_orders');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing orders:', e);
        return [];
      }
    }
    return [];
  }

  function saveOrders(ordersData) {
    localStorage.setItem('kot_orders', JSON.stringify(ordersData));
    localStorage.setItem('kot_last_update', Date.now().toString());
  }

  // ====== 4. LOAD ORDERS ======
  function loadOrders() {
    const allOrders = getOrders();
    // Get active orders (non-archived)
    orders = allOrders.filter(o => !o.archived);
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    updateKPIs(allOrders);
    renderOrders();
  }

  // ====== 5. UPDATE KPIs ======
  function updateKPIs(allOrders) {
    const active = allOrders.filter(o => !o.archived);
    const total = active.length;
    const pending = active.filter(o => o.status === 'pending').length;
    const preparing = active.filter(o => o.status === 'preparing').length;
    const ready = active.filter(o => o.status === 'ready').length;
    const completed = active.filter(o => o.status === 'completed').length;

    kpiTotal.textContent = total;
    kpiPending.textContent = pending;
    kpiPreparing.textContent = preparing;
    kpiReady.textContent = ready;
    kpiCompleted.textContent = completed;
  }

  // ====== 6. RENDER ORDERS ======
  function renderOrders() {
    let filtered = orders;
    if (currentFilter !== 'all') {
      filtered = orders.filter(o => o.status === currentFilter);
    }

    orderCount.textContent = `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`;

    // Clear previous cards
    const existingCards = ordersGrid.querySelectorAll('.order-card');
    existingCards.forEach(el => el.remove());

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';

      // Get the order ID (handle different field names)
      const orderId = order.orderId || order.id || order.order_number || 'UNKNOWN';

      // Header
      const header = document.createElement('div');
      header.className = 'order-card-header';
      const idBadge = document.createElement('span');
      idBadge.className = 'order-id-badge';
      idBadge.textContent = `#${orderId}`;
      const time = document.createElement('span');
      time.className = 'order-time';
      const date = new Date(order.timestamp);
      time.textContent = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      header.appendChild(idBadge);
      header.appendChild(time);
      card.appendChild(header);

      // Items
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'order-items';
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const row = document.createElement('div');
          row.className = 'order-item-row';
          const left = document.createElement('span');
          const qtySpan = document.createElement('span');
          qtySpan.className = 'item-qty';
          qtySpan.textContent = `${item.qty}×`;
          const nameSpan = document.createElement('span');
          nameSpan.className = 'item-name';
          nameSpan.textContent = item.name;
          left.appendChild(qtySpan);
          left.appendChild(nameSpan);
          const totalSpan = document.createElement('span');
          totalSpan.className = 'item-total';
          totalSpan.textContent = `₹${(item.qty * item.price).toFixed(2)}`;
          row.appendChild(left);
          row.appendChild(totalSpan);
          itemsContainer.appendChild(row);
        });
      }
      card.appendChild(itemsContainer);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'order-card-footer';
      const total = document.createElement('span');
      total.className = 'order-total';
      const totalAmount = order.total || order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
      total.textContent = `₹${parseFloat(totalAmount).toFixed(2)}`;

      const statusGroup = document.createElement('div');
      statusGroup.className = 'status-group';

      const statuses = [
        { key: 'pending', label: 'Pending' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'ready', label: 'Ready' },
        { key: 'completed', label: 'Done' }
      ];

      statuses.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'status-btn';
        if (order.status === s.key) {
          btn.classList.add(`active-${s.key}`);
        }
        btn.textContent = s.label;
        btn.disabled = order.status === s.key;
        // Store data attributes
        btn.dataset.orderId = orderId;
        btn.dataset.status = s.key;
        statusGroup.appendChild(btn);
      });

      footer.appendChild(total);
      footer.appendChild(statusGroup);
      card.appendChild(footer);
      ordersGrid.appendChild(card);
    });
  }

  // ====== 7. UPDATE ORDER STATUS (Fixed) ======
  function updateOrderStatus(orderId, newStatus) {
    console.log(`🔄 Updating order ${orderId} to ${newStatus}`);

    const allOrders = getOrders();
    
    // Find ALL orders with this ID, then pick the active one (non-archived)
    const matchingOrders = allOrders.filter(o => {
      const id = o.orderId || o.id || o.order_number;
      return id === orderId && !o.archived;
    });

    if (matchingOrders.length === 0) {
      console.error(`❌ No active order found with ID: ${orderId}`);
      alert(`Order #${orderId} not found. Please refresh.`);
      return;
    }

    // Take the first active match (should be the one on screen)
    const orderToUpdate = matchingOrders[0];
    const orderIndex = allOrders.indexOf(orderToUpdate);

    console.log(`✅ Found order at index ${orderIndex}:`, orderToUpdate);

    // Update status
    allOrders[orderIndex].status = newStatus;
    saveOrders(allOrders);
    
    // Force a complete refresh of the UI
    loadOrders();
  }

  // ====== 8. EVENT DELEGATION ======
  ordersGrid.addEventListener('click', function (e) {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;
    if (btn.disabled) return;
    
    const orderId = btn.dataset.orderId;
    const status = btn.dataset.status;
    if (!orderId || !status) return;
    
    console.log('🖱️ Button clicked:', { orderId, status });
    updateOrderStatus(orderId, status);
  });

  // ====== 9. FILTER ======
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderOrders();
    });
  });

  // ====== 10. REFRESH ======
  refreshBtn.addEventListener('click', function () {
    loadOrders();
    this.textContent = '⟳ Refreshed!';
    setTimeout(() => { this.textContent = '⟳ Refresh'; }, 1000);
  });

  // ====== 11. AUTO-REFRESH ======
  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      const allOrders = getOrders();
      const currentActive = allOrders.filter(o => !o.archived);
      if (JSON.stringify(currentActive) !== JSON.stringify(orders)) {
        console.log('🔄 Auto-refresh triggered');
        loadOrders();
      }
    }, 5000);
  }

  // ====== 12. CROSS-TAB SYNC ======
  window.addEventListener('storage', function (e) {
    if (e.key === 'kot_orders' || e.key === 'kot_last_update') {
      console.log('📡 Storage event detected');
      loadOrders();
    }
  });

  // ====== 13. LOGOUT ======
  document.querySelector('.logout-btn')?.addEventListener('click', function () {
    if (confirm('Logout from KOT?')) {
      window.location.href = 'index.html';
    }
  });

  // ====== 14. INIT ======
  console.log('🚀 KOT page initialized');
  loadOrders();
  startAutoRefresh();

  window.addEventListener('beforeunload', function () {
    if (refreshInterval) clearInterval(refreshInterval);
  });

});