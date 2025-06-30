document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('clearCartModal');
  const openBtn = document.getElementById('openClearCartModal');
  const cancelBtn = document.getElementById('cancelClearCart');
  const confirmBtn = document.getElementById('confirmClearCart');
  const form = document.getElementById('clearCartForm');
  const controls = document.querySelectorAll('.quantity-controls');

  const updateCartSummary = () => {
    const itemRows = document.querySelectorAll('.cart-item');
    let totalItems = 0;
    let totalPrice = 0;

    itemRows.forEach(row => {
      const qty = parseInt(row.querySelector('.qty').textContent);
      const price = parseFloat(row.dataset.price);
      totalItems += qty;
      totalPrice += qty * price;

      row.querySelector('.item-total').textContent = `Total: ₹${(qty * price).toFixed(2)}`;
    });

    document.querySelector('.cart-summary p:nth-child(1)').textContent = `Total Items: ${totalItems}`;
    document.querySelector('.cart-summary p:nth-child(2)').textContent = `Total Price: ₹${totalPrice}`;
    document.querySelector('.checkout-btn').disabled = totalItems === 0;
  };

  const showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  controls.forEach(control => {
    const itemId = control.dataset.id;

    control.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('qty-btn')) return;

  let action = '';
  if (e.target.classList.contains('increase')) action = 'increase';
  else if (e.target.classList.contains('decrease')) action = 'decrease';
  else if (e.target.classList.contains('remove')) action = 'remove';

  try {
    const res = await fetch('/update-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, action })
    });

    const text = await res.text();
    console.log("🔍 Raw response:", text);
    const data = JSON.parse(text);

    if (!data.success) throw new Error('❌ Invalid response structure');

    if (res.ok && data.success) {
      const cartItem = control.closest('.cart-item');
      const qtyElem = cartItem.querySelector('.qty');

      let qty = parseInt(qtyElem.textContent, 10);
      if (isNaN(qty)) qty = 1;

      if (action === 'remove' || (action === 'decrease' && qty === 1)) {
        cartItem.remove();
      } else {
        qty = action === 'increase' ? qty + 1 : qty - 1;
        qty = Math.max(qty, 1);
        qtyElem.textContent = qty;
      }

      const unitPrice = parseFloat(cartItem.querySelector('.quantity-controls').dataset.price);
      if (!isNaN(unitPrice)) {
        cartItem.querySelector('.item-total').textContent = `Total: ₹${(qty * unitPrice).toFixed(2)}`;
      }

      updateCartSummary();
      showToast(action === 'remove' ? '🗑️ Item removed' : '✅ Cart updated');
    } else {
      showToast('❌ Failed to update cart');
    }
  } catch (err) {
    console.error('❌ Cart update error:', err);
    showToast('⚠️ Something went wrong');
  }
});
  });

  // 🔁 Order placed toast
  const params = new URLSearchParams(window.location.search);
  if (params.has('ordered')) {
    showToast('🎉 Order placed successfully!');
  }

  // ✅ Clear Cart Modal
  if (openBtn && modal && cancelBtn && confirmBtn && form) {
    openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    confirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      form.submit();
    });
  }

  // 🧹 Show cart cleared toast
  if (window.location.search.includes('cleared=true')) {
    showToast('🧹 Cart cleared');
  }

  updateCartSummary();
});

// 🛑 Log abandoned cart before unload
window.addEventListener('beforeunload', () => {
  const userLoggedIn = document.body.dataset.loggedin === 'true';
  const cartItems = [];

  document.querySelectorAll('.cart-item').forEach(item => {
    cartItems.push({
      id: item.dataset.id,
      name: item.querySelector('h4')?.textContent?.trim(),
      price: parseFloat(item.dataset.price),
      quantity: parseInt(item.querySelector('.qty').textContent),
      image: item.querySelector('img')?.getAttribute('src')?.split('/').pop()
    });
  });

  if (userLoggedIn && cartItems.length > 0) {
    navigator.sendBeacon('/save-abandoned-cart', JSON.stringify({ items: cartItems }));
  }
});