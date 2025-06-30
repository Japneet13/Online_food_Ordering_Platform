document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.filter-btn');
  const priceSelect = document.getElementById('priceFilter');
  const spiceSelect = document.getElementById('spiceFilter');
  const searchInput = document.getElementById('searchInput');
  const resetBtn = document.getElementById('resetFilters');
  const cards = document.querySelectorAll('.card');
  const menuGrid = document.querySelector('.menu-grid');
  const goToCartBox = document.getElementById('goToCartBox');
  const cartInfo = document.getElementById('cartInfo');

  let currentType = 'All';

  async function updateGoToCartBox() {
    if (goToCartBox && cartInfo) {
      try {
        const res = await fetch('/cart-count');
        const data = await res.json();
        if (data.totalItems > 0) {
          goToCartBox.style.display = 'flex';
          cartInfo.textContent = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice}`;
        } else {
          goToCartBox.style.display = 'none';
        }
      } catch (err) {
        console.error('Cart box fetch failed:', err);
      }
    }
  }

  function filterCards() {
    const selectedPrice = priceSelect ? priceSelect.value : 'All';
    const selectedSpice = spiceSelect ? spiceSelect.value : 'All';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    cards.forEach(card => {
      const type = card.dataset.type;
      const price = card.dataset.price;
      const spice = card.dataset.spice;
      const name = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();

      const typeMatch = currentType === 'All' || type === currentType;
      const priceMatch = selectedPrice === 'All' || price === selectedPrice;
      const spiceMatch = selectedSpice === 'All' || spice === selectedSpice;
      const searchMatch = name.includes(searchTerm) || description.includes(searchTerm);

      card.style.display = (typeMatch && priceMatch && spiceMatch && searchMatch) ? 'block' : 'none';
    });
  }

  function fadeAndFilter() {
    if (!menuGrid) return;
    menuGrid.classList.remove('fade-in');
    menuGrid.classList.add('fade-out');
    setTimeout(() => {
      filterCards();
      menuGrid.classList.remove('fade-out');
      menuGrid.classList.add('fade-in');
    }, 200);
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentType = button.getAttribute('data-filter');
      fadeAndFilter();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentType = 'All';
      buttons.forEach(btn => btn.classList.remove('active'));
      buttons[0].classList.add('active');
      if (priceSelect) priceSelect.value = 'All';
      if (spiceSelect) spiceSelect.value = 'All';
      if (searchInput) searchInput.value = '';
      fadeAndFilter();
    });
  }

  if (priceSelect) priceSelect.addEventListener('change', filterCards);
  if (spiceSelect) spiceSelect.addEventListener('change', filterCards);
  if (searchInput) searchInput.addEventListener('input', filterCards);

  filterCards();

  document.querySelectorAll('.cart-interaction').forEach(container => {
    const form = container.querySelector('.add-to-cart-form');
    const controls = container.querySelector('.pre-add-controls');
    const qtyDisplay = controls?.querySelector('.qty');
    const qtyInput = controls?.querySelector('.qty-input');
    const incBtn = controls?.querySelector('.inc-btn');
    const decBtn = controls?.querySelector('.dec-btn');

    let currentQty = parseInt(qtyInput?.value) || 1;

    if (form) {
      form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const plain = Object.fromEntries(formData.entries());

  plain.price = parseFloat(plain.price); 

  try {
    const response = await fetch('/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plain)
    });

    if (!response.ok) throw new Error('Server error');

    const data = await response.json();

    form.classList.add('hidden');
    if (controls) {
      controls.classList.remove('hidden');
      qtyDisplay.textContent = currentQty;
      qtyInput.value = currentQty;
    }

    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    if (data.totalItems !== undefined && data.totalPrice !== undefined) {
      cartInfo.textContent = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice}`;
      goToCartBox.style.display = 'flex';
    } else {
      await updateGoToCartBox();
    }
  } catch (error) {
    console.error('Add to cart failed:', error);
  }
});
    }

    if (incBtn) {
  incBtn.addEventListener('click', async () => {
  currentQty++;
  qtyDisplay.textContent = currentQty;
  qtyInput.value = currentQty;

  try {
    const res = await fetch('/update-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: container.dataset.id,
        action: 'increase'
      })
    });

    const data = await res.json();
    if (data.totalItems !== undefined && data.totalPrice !== undefined) {
      cartInfo.textContent = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice}`;
      goToCartBox.style.display = 'flex';
    } else {
  await updateGoToCartBox(); // 🔁 Add this fallback
  }

  } catch (err) {
    console.error('Error updating cart:', err);
  }
});
}


    if (decBtn) {
      decBtn.addEventListener('click', async () => {
        if (currentQty > 1) {
          currentQty--;
          qtyDisplay.textContent = currentQty;
          qtyInput.value = currentQty;

          try {
            const res = await fetch('/update-cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: container.dataset.id,
                action: 'decrease'
              })
            });

            const data = await res.json();
            if (data.totalItems !== undefined) {
              cartInfo.textContent = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice}`;
              goToCartBox.style.display = 'flex';
            }
          } catch (err) {
            console.error('Error decreasing cart:', err);
          }
        } else {
          currentQty = 1;
          controls.classList.add('hidden');
          form.classList.remove('hidden');
          qtyDisplay.textContent = '1';
          qtyInput.value = '1';

          try {
            const res = await fetch('/update-cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: container.dataset.id,
                action: 'remove'
              })
            });

            const data = await res.json();
            if (data.totalItems !== undefined) {
              cartInfo.textContent = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice}`;
              goToCartBox.style.display = data.totalItems > 0 ? 'flex' : 'none';
            } else {
               await updateGoToCartBox(); 
              }
          } catch (err) {
            console.error('Error removing from cart:', err);
          }
        }
      });
    }
  });

  updateGoToCartBox(); // Initial check
});
