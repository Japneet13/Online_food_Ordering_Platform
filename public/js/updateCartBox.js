async function updateCartBox() {
  const goToCartBox = document.getElementById('goToCartBox');
  const cartInfo = document.getElementById('cartInfo');

  if (goToCartBox && cartInfo) {
    try {
      const res = await fetch('/cart-count');
      const data = await res.json();

      if (data.totalItems > 0) {
        const newText = `🧺 ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} • ₹${data.totalPrice.toLocaleString('en-IN')}`;
        
        goToCartBox.style.display = 'flex';

        if (cartInfo.textContent !== newText) {
          cartInfo.textContent = newText;
        }
      } else {
        goToCartBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Cart box fetch failed:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBox(); // Initial check

  // ⏱️ Poll every 2 seconds for updates
  setInterval(updateCartBox, 2000);
});
