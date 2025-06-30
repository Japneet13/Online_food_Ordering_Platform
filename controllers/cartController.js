// controllers/cartController.js
const db = require('../db'); 


function saveUserCartToDB(userId, cart) {
  // First, delete existing cart for that user
  const deleteQuery = 'DELETE FROM user_cart WHERE user_id = ?';
  db.query(deleteQuery, [userId], (delErr) => {
    if (delErr) {
      console.error('❌ Failed to clear existing cart for user:', delErr);
      return;
    }

    // Then insert all current cart items
    const values = cart.map(item => [userId, item.id, item.name, item.price, item.quantity, item.image]);

    if (values.length === 0) return;

    const insertQuery = `
      INSERT INTO user_cart (user_id, item_id, name, price, quantity, image)
      VALUES ?
    `;

    db.query(insertQuery, [values], (insErr) => {
      if (insErr) {
        console.error('❌ Failed to save cart items:', insErr);
      } else {
        console.log('💾 Cart saved for user:', userId);
      }
    });
  });
}


// View cart
exports.getCart = (req, res) => {
  let cart = req.session.cart || [];

  // Fix: Ensure price is a number
  cart = cart.map(item => {
    return {
      ...item,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity, 10) || 1
    };
  });

  // Recalculate totals
  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.quantity * item.price;
  });

  req.session.cart = cart; // overwrite cleaned cart

  res.render('cart', {
    user: req.session.user,
    cart,
    totalItems,
    totalPrice
  });
};



// Add to cart
exports.addToCart = (req, res) => {
  console.log("🛒 Incoming body:", req.body);

  // Extracting JSON data correctly
  let { id, name, price, image, quantity } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  price = parseFloat(price);

  if (!id || !name || !price || !image) {
    console.warn("❌ Missing item details in cart request:", req.body);
    return res.status(400).json({ success: false, message: "Invalid cart item data." });
  }

  if (!req.session.cart) req.session.cart = [];

  const existing = req.session.cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += qty;
  } else {
    req.session.cart.push({ id, name, price, image, quantity: qty });
  }

  const totalItems = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = req.session.cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  if (req.session.user?.id) {
   saveUserCartToDB(req.session.user.id, req.session.cart);
  }

  console.log("✅ Cart updated:", req.session.cart);

  return res.json({ success: true, totalItems, totalPrice });
};


// Cart summary (AJAX /cart-count)
exports.getCartSummary = (req, res) => {
  const cart = req.session.cart || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  res.json({
    count: totalItems,
    totalItems,
    totalPrice
  });
};

// Place order


exports.placeOrder = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login?from=cart');
  }

  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const userId = req.session.user.id;

  const orderQuery = 'INSERT INTO orders (user_id, total_items, total_price) VALUES (?, ?, ?)';

  db.query(orderQuery, [userId, totalItems, totalPrice], (err, orderResult) => {
    if (err) {
      console.error('❌ Order insert failed:', err);
      return res.status(500).send('Error placing order');
    }

    const orderId = orderResult.insertId;

    const itemQueries = cart.map(item => [
      orderId,
      item.name,
      item.price,
      item.quantity,
      item.image
    ]);

    const itemsQuery = `
      INSERT INTO order_items (order_id, name, price, quantity, image)
      VALUES ?
    `;

    db.query(itemsQuery, [itemQueries], (err2) => {
      if (err2) {
        console.error('❌ Order items insert failed:', err2);
        return res.status(500).send('Error saving order items');
      }
      if (req.session.user?.id) {
       db.query('DELETE FROM user_cart WHERE user_id = ?', [req.session.user.id]);
      }


      req.session.cart = [];
      res.redirect('/cart?ordered=1');
    });
  });
};

// Update cart
exports.updateCart = (req, res) => {
  let cart = req.session.cart || [];
  const { id, action } = req.body;

  const itemIndex = cart.findIndex(i => i.id == id);
  if (itemIndex !== -1) {
    if (action === 'increase') {
      cart[itemIndex].quantity += 1;
    } else if (action === 'decrease') {
      cart[itemIndex].quantity -= 1;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
    } else if (action === 'remove') {
      cart.splice(itemIndex, 1);
    }
  }

  // ✅ Sanitize cart data
  cart = cart.map(item => ({
    ...item,
    price: parseFloat(item.price),
    quantity: parseInt(item.quantity, 10) || 1
  }));

  req.session.cart = cart; // ✅ Save updated cart in session

  // ✅ Save updated cart in DB AFTER session is updated
  if (req.session.user?.id) {
    saveUserCartToDB(req.session.user.id, req.session.cart);
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return res.json({
    success: true,
    totalItems,
    totalPrice
  });
};


// clear cart
exports.clearCart = (req, res) => {
  req.session.cart = [];
  res.redirect('/cart?cleared=true');
};

// Abandoned carts
exports.saveAbandonedCart = (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    console.log('⛔ Abandoned cart: No logged-in user.');
    return res.sendStatus(204);
  }

  const userId = req.session.user.id;
  const items = req.body.items;

  console.log("💾 Attempting to save abandoned cart for user:", userId);
  console.log("📦 Cart items received:", items);

  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log("⚠️ No cart items to save.");
    return res.sendStatus(204);
  }

  const query = 'INSERT INTO abandoned_carts (user_id, items) VALUES (?, ?)';

  db.query(query, [userId, JSON.stringify(items)], (err) => {
    if (err) {
      console.error('❌ Failed to save abandoned cart:', err);
      return res.sendStatus(500);
    }
    console.log('✅ Abandoned cart saved successfully for user:', userId);
    res.sendStatus(200);
  });
};