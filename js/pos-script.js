document.addEventListener('DOMContentLoaded', function () {

  // ====== 1. DEFAULT MENU ======
  const defaultMenu = [
    { id: 1, name: 'Coffee', price: 35, category: 'Beverages' },
    { id: 2, name: 'Tea', price: 25, category: 'Beverages' },
    { id: 3, name: 'Soda', price: 15, category: 'Beverages' },
    { id: 4, name: 'Water', price: 10, category: 'Beverages' },
    { id: 5, name: 'Sandwich', price: 65, category: 'Fast Food' },
    { id: 6, name: 'Burger', price: 85, category: 'Fast Food' },
    { id: 7, name: 'Fries', price: 30, price2: 120, category: 'Fast Food', size: 'Small / Large' },
    { id: 8, name: 'Pizza', price: 55, category: 'Fast Food' },
    { id: 9, name: 'Momos', price: 50, category: 'Fast Food' },
    { id: 10, name: 'Noodles', price: 70, category: 'Fast Food' },
    { id: 11, name: 'Cake', price: 45, category: 'Desserts' },
    { id: 12, name: 'Salad', price: 15, category: 'Healthy' }
  ];

  // ====== 2. STATE ======
  let menuItems = [];
  let currentCategory = null; // will be set dynamically
  let cart = [];
  let heldOrders = [];
  let orderCounter = 1;
  let previewOrderNumber = null;
  let selectedPayment = null;

  // ====== 3. DOM REFS ======
  const itemsGrid = document.getElementById('itemsGrid');
  const cartList = document.getElementById('cartList');
  const emptyCart = document.getElementById('emptyCart');
  const cartTotalEl = document.getElementById('cartTotal');
  const clearBtn = document.getElementById('clearCartBtn');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const paymentBtn = document.getElementById('paymentBtn');
  const holdBtn = document.getElementById('holdBtn');
  const recallBtn = document.getElementById('recallBtn');
  const printBtn = document.getElementById('printBtn');
  const orderIdDisplay = document.getElementById('orderIdDisplay');
  const datetimeEl = document.getElementById('datetime');
  const categoryListEl = document.getElementById('categoryList');
  const refreshMenuBtn = document.getElementById('refreshMenuBtn');

  // Payment Modal
  const paymentModal = document.getElementById('paymentModal');
  const paymentMethods = document.querySelectorAll('.payment-method');
  const paymentDoneBtn = document.getElementById('paymentDoneBtn');
  const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');

  // Recall Modal
  const recallModal = document.getElementById('recallModal');
  const heldOrdersContainer = document.getElementById('heldOrdersContainer');
  const closeRecallModalBtn = document.getElementById('closeRecallModalBtn');

  // ====== 4. ORDER COUNTER ======
  function loadOrderCounter() {
    const stored = parseInt(localStorage.getItem('order_counter'));
    if (!isNaN(stored) && stored > 0) {
      orderCounter = stored;
    } else {
      orderCounter = 1;
      localStorage.setItem('order_counter', orderCounter);
    }
    return orderCounter;
  }

  function saveOrderCounter() {
    localStorage.setItem('order_counter', orderCounter);
  }

  function getNextOrderNumber() {
    const next = orderCounter;
    orderCounter++;
    saveOrderCounter();
    return next;
  }

  function getCurrentOrderNumber() {
    return orderCounter;
  }

  // ====== 5. ORDER ID GENERATION ======
  function generateOrderIdString(num) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `${y}${m}${d}-`;
    return prefix + String(num).padStart(3, '0');
  }

  function updateOrderDisplay() {
    let num = previewOrderNumber;
    if (num === null) {
      num = getCurrentOrderNumber();
    }
    orderIdDisplay.textContent = `#${generateOrderIdString(num)}`;
  }

  // ====== 6. LOAD MENU FROM localStorage ======
  function loadMenu(category) {
    const stored = localStorage.getItem('admin_menu');
    if (stored) {
      try {
        menuItems = JSON.parse(stored);
        // Ensure all items have proper numeric price
        menuItems = menuItems.map(item => ({
          ...item,
          price: parseFloat(item.price) || 0
        }));
        // Remove any item with category "TOP SELLERS" just in case
        menuItems = menuItems.filter(item => item.category !== 'TOP SELLERS');
      } catch (e) {
        menuItems = defaultMenu;
        localStorage.setItem('admin_menu', JSON.stringify(menuItems));
      }
    } else {
      menuItems = defaultMenu;
      localStorage.setItem('admin_menu', JSON.stringify(menuItems));
    }
    // Build category buttons
    buildCategoryButtons();
    // If category is not set or invalid, set to first available category
    const categories = getCategories();
    if (!category || !categories.includes(category)) {
      category = categories.length > 0 ? categories[0] : null;
    }
    currentCategory = category;
    renderItems(currentCategory);
    // Highlight the active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });
  }

  // ====== 7. GET CATEGORIES FROM MENU ======
  function getCategories() {
    const cats = [...new Set(menuItems.map(item => item.category))];
    return cats.filter(c => c && c.trim() !== ''); // remove empty ones
  }

  // ====== 8. BUILD CATEGORY BUTTONS ======
  function buildCategoryButtons() {
    const categories = getCategories();
    categoryListEl.innerHTML = '';
    
    if (categories.length === 0) {
      const btn = document.createElement('button');
      btn.className = 'category-btn active';
      btn.textContent = 'No Items';
      categoryListEl.appendChild(btn);
      return;
    }

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.category = cat;
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        // Remove active from all
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        renderItems(currentCategory);
      });
      categoryListEl.appendChild(btn);
    });

    // Set initial active state
    if (currentCategory) {
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
      });
    } else if (categories.length > 0) {
      // Default to first category
      const firstBtn = categoryListEl.querySelector('.category-btn');
      if (firstBtn) {
        firstBtn.classList.add('active');
        currentCategory = firstBtn.dataset.category;
      }
    }
  }

  // ====== 9. RENDER ITEMS ======
  function renderItems(category) {
    if (!category) {
      itemsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#8a9aa8; padding:40px 0;">No category selected</p>`;
      return;
    }
    const filtered = menuItems.filter(item => item.category === category);

    itemsGrid.innerHTML = '';
    if (filtered.length === 0) {
      itemsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#8a9aa8; padding:40px 0;">No items in this category</p>`;
      return;
    }

    filtered.forEach(item => {
      const div = document.createElement('div');
      div.className = 'menu-item';
      div.dataset.id = item.id;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = item.name;

      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-price';

      if (item.price2) {
        priceSpan.innerHTML = `₹${item.price} <span class="price-divider">|</span> ₹${item.price2}`;
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'item-size';
        sizeSpan.textContent = item.size || 'Small / Large';
        div.appendChild(nameSpan);
        div.appendChild(priceSpan);
        div.appendChild(sizeSpan);
      } else {
        priceSpan.textContent = `₹${item.price}`;
        div.appendChild(nameSpan);
        div.appendChild(priceSpan);
      }

      div.addEventListener('click', function () {
        addToCart(item.id, item.name, item.price);
      });

      itemsGrid.appendChild(div);
    });
  }

  // ====== 10. REFRESH MENU ======
  refreshMenuBtn.addEventListener('click', function () {
    loadMenu(currentCategory);
    this.textContent = '⟳ Refreshed!';
    setTimeout(() => { this.textContent = '⟳ Refresh'; }, 1500);
  });

  // ====== 11. CLOCK ======
  function updateDateTime() {
    const now = new Date();
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    datetimeEl.textContent = now.toLocaleString('en-US', options).replace(/,/g, ',');
  }
  updateDateTime();
  setInterval(updateDateTime, 10000);

  // ====== 12. CART LOGIC ======
  function addToCart(id, name, price) {
    if (cart.length === 0 && previewOrderNumber === null) {
      previewOrderNumber = getCurrentOrderNumber();
    }
    const existing = cart.find(item => item.id === id && item.price === price);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, name, price, qty: 1 });
    }
    renderCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
  }

  function updateQuantity(index, delta) {
    const item = cart[index];
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      item.qty = newQty;
      renderCart();
    }
  }

  function renderCart() {
    cartList.innerHTML = '';
    if (cart.length === 0) {
      emptyCart.style.display = 'block';
      cartTotalEl.textContent = '₹0.00';
      printBtn.style.opacity = '0.5';
      printBtn.style.pointerEvents = 'none';
      previewOrderNumber = null;
      updateOrderDisplay();
      return;
    }
    emptyCart.style.display = 'none';
    printBtn.style.opacity = '1';
    printBtn.style.pointerEvents = 'auto';

    let total = 0;
    cart.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'cart-item';

      const details = document.createElement('div');
      details.className = 'item-details';

      const serialSpan = document.createElement('span');
      serialSpan.className = 'item-serial';
      serialSpan.textContent = (idx + 1) + '.';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name-cart';
      nameSpan.textContent = item.name;

      details.appendChild(serialSpan);
      details.appendChild(nameSpan);

      const controls = document.createElement('div');
      controls.className = 'qty-controls';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'qty-btn';
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        updateQuantity(idx, -1);
      });

      const qtySpan = document.createElement('span');
      qtySpan.className = 'item-qty';
      qtySpan.textContent = item.qty;

      const plusBtn = document.createElement('button');
      plusBtn.className = 'qty-btn';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        updateQuantity(idx, 1);
      });

      controls.appendChild(minusBtn);
      controls.appendChild(qtySpan);
      controls.appendChild(plusBtn);
      details.appendChild(controls);

      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-price-cart';
      const itemTotal = item.qty * item.price;
      priceSpan.textContent = `₹${itemTotal.toFixed(2)}`;
      total += itemTotal;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeFromCart(idx);
      });

      li.appendChild(details);
      li.appendChild(priceSpan);
      li.appendChild(removeBtn);
      cartList.appendChild(li);
    });

    cartTotalEl.textContent = `₹${total.toFixed(2)}`;
    updateOrderDisplay();
  }

  // ====== 13. CLEAR ======
  clearBtn.addEventListener('click', function () {
    cart = [];
    previewOrderNumber = null;
    renderCart();
  });

  // ====== 14. PAYMENT MODAL ======
  function openPaymentModal() {
    if (cart.length === 0) {
      alert('Cart is empty. Add items first.');
      return;
    }
    selectedPayment = null;
    paymentMethods.forEach(btn => btn.classList.remove('selected'));
    paymentModal.classList.add('active');
  }

  function closePaymentModal() {
    paymentModal.classList.remove('active');
  }

  paymentBtn.addEventListener('click', openPaymentModal);

  paymentMethods.forEach(btn => {
    btn.addEventListener('click', function () {
      paymentMethods.forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      selectedPayment = this.dataset.method;
    });
  });

  paymentDoneBtn.addEventListener('click', function () {
    if (!selectedPayment) {
      alert('Please select a payment method.');
      return;
    }
    alert(`✅ Payment done via ${selectedPayment}.`);
    closePaymentModal();
  });

  closePaymentModalBtn.addEventListener('click', closePaymentModal);
  paymentModal.addEventListener('click', function (e) {
    if (e.target === this) closePaymentModal();
  });

  // ====== 15. PLACE ORDER ======
  placeOrderBtn.addEventListener('click', function () {
    if (cart.length === 0) {
      alert('Cart is empty. Add items before placing an order.');
      return;
    }

    if (!selectedPayment) {
      alert('⚠️ Please complete the payment step first (select a method and click "Payment Done").');
      openPaymentModal();
      return;
    }

    const orderNumber = getNextOrderNumber();
    const orderId = generateOrderIdString(orderNumber);
    let total = 0;
    cart.forEach(item => total += item.qty * item.price);

    const orderData = {
      orderId: orderId,
      items: cart.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      total: total,
      timestamp: new Date().toISOString(),
      status: 'pending',
      paymentMethod: selectedPayment
    };

    const existing = JSON.parse(localStorage.getItem('kot_orders') || '[]');
    existing.push(orderData);
    localStorage.setItem('kot_orders', JSON.stringify(existing));
    localStorage.setItem('kot_last_update', Date.now().toString());

    alert(`✅ Order ${orderId} placed successfully!\nTotal: ₹${total.toFixed(2)}\nPayment: ${selectedPayment}\nKitchen has been notified.`);

    selectedPayment = null;
    cart = [];
    previewOrderNumber = null;
    renderCart();
  });

  // ====== 16. HOLD ======
  holdBtn.addEventListener('click', function () {
    if (cart.length === 0) {
      alert('Cart is empty. Nothing to hold.');
      return;
    }
    const heldItems = cart.map(item => ({ ...item }));
    heldOrders.push({
      id: heldOrders.length + 1,
      items: heldItems,
      timestamp: new Date().toLocaleString()
    });
    cart = [];
    previewOrderNumber = null;
    renderCart();
    alert(`Order placed on hold.`);
  });

  // ====== 17. RECALL ======
  function renderHeldOrdersTable() {
    if (heldOrders.length === 0) {
      heldOrdersContainer.innerHTML = `<p style="text-align:center; color:#8a9aa8;">No orders on hold.</p>`;
      return;
    }

    let tableHtml = `
      <table class="held-orders-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Items</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    heldOrders.forEach((order, idx) => {
      const itemsStr = order.items.map(item => `${item.name} (${item.qty})`).join(', ');
      const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
      tableHtml += `
        <tr class="order-row" data-order-id="${idx}">
          <td>${idx + 1}</td>
          <td class="item-list">${itemsStr}</td>
          <td class="order-total">₹${total.toFixed(2)}</td>
          <td>
            <button class="recall-single-btn" data-order-id="${idx}">Recall</button>
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    heldOrdersContainer.innerHTML = tableHtml;

    document.querySelectorAll('.recall-single-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const orderIdx = parseInt(this.dataset.orderId);
        recallOrder(orderIdx);
      });
    });
  }

  function recallOrder(orderIdx) {
    if (orderIdx < 0 || orderIdx >= heldOrders.length) return;
    const order = heldOrders[orderIdx];
    if (cart.length > 0) {
      if (!confirm('Current cart has items. Do you want to add held items to the current cart?')) {
        return;
      }
    }
    order.items.forEach(heldItem => {
      const existing = cart.find(item => item.id === heldItem.id && item.price === heldItem.price);
      if (existing) {
        existing.qty += heldItem.qty;
      } else {
        cart.push({ ...heldItem });
      }
    });
    if (cart.length > 0 && previewOrderNumber === null) {
      previewOrderNumber = getCurrentOrderNumber();
    }
    heldOrders.splice(orderIdx, 1);
    renderCart();
    renderHeldOrdersTable();
    alert(`Order recalled.`);
    if (heldOrders.length === 0) {
      closeRecallModal();
    }
  }

  function openRecallModal() {
    if (heldOrders.length === 0) {
      alert('No orders on hold.');
      return;
    }
    renderHeldOrdersTable();
    recallModal.classList.add('active');
  }

  function closeRecallModal() {
    recallModal.classList.remove('active');
  }

  recallBtn.addEventListener('click', openRecallModal);
  closeRecallModalBtn.addEventListener('click', closeRecallModal);
  recallModal.addEventListener('click', function (e) {
    if (e.target === this) closeRecallModal();
  });

  // ====== 18. PRINT ======
  printBtn.addEventListener('click', function () {
    if (cart.length === 0) {
      alert('No items to print. Add items first.');
      return;
    }

    const CGST_RATE = 0.025;
    const SGST_RATE = 0.025;

    const orderNumber = previewOrderNumber !== null ? previewOrderNumber : 'Draft';
    const orderId = generateOrderIdString(orderNumber);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let subtotal = 0;
    let itemsRows = '';
    cart.forEach((item, idx) => {
      const lineTotal = item.qty * item.price;
      subtotal += lineTotal;
      itemsRows += `
        <tr>
          <td class="num">${idx + 1}</td>
          <td>${item.name}</td>
          <td class="num">${item.qty}</td>
          <td class="amt">${item.price.toFixed(2)}</td>
          <td class="amt">${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const cgst = subtotal * CGST_RATE;
    const sgst = subtotal * SGST_RATE;
    const grandTotal = subtotal + cgst + sgst;

    const billHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill – Cafe Barista</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
            display: flex;
            justify-content: center;
            font-size: 11.5px;
            line-height: 1.45;
          }
          .receipt {
            width: 80mm;
            max-width: 80mm;
            padding: 6mm 5mm 8mm;
            background: #fff;
            color: #000;
          }
          .rule { border: none; border-top: 1px dashed #000; margin: 3mm 0; }
          .rule.solid { border-top: 2px solid #000; }
          .brand { text-align: center; margin-bottom: 2mm; }
          .brand .name { font-size: 16px; font-weight: 700; letter-spacing: 2px; }
          .brand .addr { font-size: 10px; margin-top: 2px; }
          .bill-title {
            text-align: center;
            font-weight: 700;
            letter-spacing: 3px;
            font-size: 12px;
            margin: 1mm 0 2mm;
          }
          .meta { display: flex; justify-content: space-between; margin-bottom: 0.5mm; }
          .meta .label { font-weight: 700; }
          table.items { width: 100%; border-collapse: collapse; font-size: 11px; }
          table.items thead th {
            text-align: left;
            font-weight: 700;
            border-bottom: 1px dashed #000;
            padding-bottom: 1.5mm;
          }
          table.items th.num, table.items td.num { text-align: center; }
          table.items th.amt, table.items td.amt { text-align: right; }
          table.items td { padding: 1mm 0; vertical-align: top; }
          .totals { margin-top: 1mm; font-size: 11.5px; }
          .totals .row { display: flex; justify-content: space-between; padding: 0.8mm 0; }
          .totals .row.sub { padding-top: 2mm; }
          .totals .row.grand {
            font-size: 14px;
            font-weight: 700;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            margin-top: 2mm;
            padding: 1.5mm 0;
          }
          .footer { text-align: center; margin-top: 3mm; }
          .thank-you { font-size: 13px; font-weight: 700; letter-spacing: 2px; }
          .footer .sub-msg { font-size: 10px; margin-top: 1.5mm; }
          .gst-line { text-align: center; font-size: 10px; margin-top: 3mm; letter-spacing: 0.5px; }
          .scissors { text-align: center; margin-top: 5mm; font-size: 10px; letter-spacing: 4px; }
          @media print {
            body { padding: 0; }
            .receipt { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="brand">
            <div class="name">CAFE BARISTA</div>
            <div class="addr">123 Coffee Street, City<br>Ph: +91 98765 43210</div>
          </div>
          <hr class="rule solid">
          <div class="bill-title">TAX INVOICE</div>
          <div class="meta"><span class="label">DATE</span><span>${dateStr}</span></div>
          <div class="meta"><span class="label">TIME</span><span>${timeStr}</span></div>
          <div class="meta"><span class="label">ORDER ID</span><span>#${orderId}</span></div>
          <hr class="rule">
          <table class="items">
            <thead>
              <tr>
                <th class="num" style="width:8%;">SNO</th>
                <th style="width:40%;">ITEM</th>
                <th class="num" style="width:14%;">QTY</th>
                <th class="amt" style="width:18%;">RATE</th>
                <th class="amt" style="width:20%;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <hr class="rule">
          <div class="totals">
            <div class="row sub"><span>SUBTOTAL</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="row"><span>CGST @ ${(CGST_RATE * 100).toFixed(1)}%</span><span>₹${cgst.toFixed(2)}</span></div>
            <div class="row"><span>SGST @ ${(SGST_RATE * 100).toFixed(1)}%</span><span>₹${sgst.toFixed(2)}</span></div>
            <div class="row grand"><span>GRAND TOTAL</span><span>₹${grandTotal.toFixed(2)}</span></div>
          </div>
          <hr class="rule">
          <div class="footer">
            <div class="thank-you">THANK YOU, VISIT AGAIN!</div>
            <div class="sub-msg">** This is a computer-generated bill **</div>
          </div>
          <div class="gst-line">GSTIN: 12ABCDE3456F1Z5</div>
          <div class="scissors">✂ - - - - - - - - - - - - - - - - - - - -</div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Please allow pop‑ups to print the bill.');
      return;
    }
    printWindow.document.write(billHtml);
    printWindow.document.close();
    printWindow.focus();
  });

  // ====== 19. LOGOUT ======
  document.querySelector('.logout-btn').addEventListener('click', function () {
    if (confirm('Logout from POS?')) {
      window.location.href = 'index.html';
    }
  });

  // ====== 20. INIT ======
  loadOrderCounter();
  // Load menu and set default category to first available
  const stored = localStorage.getItem('admin_menu');
  if (stored) {
    try {
      menuItems = JSON.parse(stored);
      menuItems = menuItems.filter(item => item.category !== 'TOP SELLERS');
    } catch (e) { /* ignore */ }
  }
  const cats = getCategories();
  const defaultCat = cats.length > 0 ? cats[0] : null;
  loadMenu(defaultCat);
  previewOrderNumber = getCurrentOrderNumber();
  renderCart();
});