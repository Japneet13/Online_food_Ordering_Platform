// === Centralized Cart Box Updater ===
async function updateCartBox() {
  const goToCartBox = document.getElementById('goToCartBox');
  const cartInfo = document.getElementById('cartInfo');

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

document.addEventListener('DOMContentLoaded', async () => {
  // ✅ Show initial cart count
  await updateCartBox();

  // ✅ Handle Add-to-Cart form submits
  document.querySelectorAll('.add-to-cart-form').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        const response = await fetch('/add-to-cart', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await updateCartBox(); // 🔄 Refresh cart UI
        }
      } catch (err) {
        console.error("Add-to-cart or update failed:", err);
      }
    });
  });
});

// ✅ Optional: Category toggle logic (used only if category buttons are present)
function showCategory(category) {
  document.querySelectorAll('.menu-section').forEach(section => {
    section.style.display = 'none';
  });

  const target = document.getElementById(category);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });
}
