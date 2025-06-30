const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middlewares/authMiddleware');
const db = require('../db');

// Admin Dashboard
router.get('/admin', isAdmin, adminController.getAdminDashboard);


// Admin view by category (reuses admin.ejs)
router.get('/admin/category/:category', isAdmin, adminController.getAdminCategoryItems);

router.get('/admin/abandoned-carts', isAdmin, adminController.viewAbandonedCarts);


// Add Item
router.get('/admin/add-item', isAdmin, adminController.getAddItemForm);
router.post(
  '/admin/add-item',
  isAdmin,
  adminController.upload.single('image'),
  adminController.postAddItem
);

// Edit Item
router.get('/admin/edit-item/:id', isAdmin, adminController.getEditItemForm);
router.post(
  '/admin/edit-item/:id',
  isAdmin,
  adminController.upload.single('image'),
  adminController.postEditItem
);

// Delete Item
router.post('/admin/delete-item/:id', isAdmin, adminController.deleteItem);

// ✅ Track users, orders, carts overview
router.get('/admin/users', isAdmin, (req, res) => {
  const usersQuery = 'SELECT id, name, email, created_at FROM users';
  const ordersQuery = 'SELECT DISTINCT user_id FROM orders';
  const cartsQuery = 'SELECT DISTINCT user_id FROM abandoned_carts';

  db.query(usersQuery, (err, users) => {
    if (err) return res.status(500).send('Error fetching users');

    db.query(ordersQuery, (err, orderUsers) => {
      if (err) return res.status(500).send('Error fetching orders');

      db.query(cartsQuery, (err, cartUsers) => {
        if (err) return res.status(500).send('Error fetching carts');

        res.render('admin/adminUsers', {
          users,
          orderUserIds: orderUsers.map(o => o.user_id),
          cartUserIds: cartUsers.map(c => c.user_id)
        });
      });
    });
  });
});


// ✅ View a user's order history
router.get('/admin/user/:id/orders', isAdmin, (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT id, total_price, total_items, placed_at
    FROM orders
    WHERE user_id = ?
    ORDER BY placed_at DESC
  `;

  db.query(query, [userId], (err, orders) => {
    if (err) {
      console.error('❌ Error fetching orders for user:', err);
      return res.status(500).send('Server Error');
    }

    res.render('admin/adminUserOrders', { orders, userId });
  });
});


// ✅ View a user's abandoned cart (optional)
router.get('/admin/user/:id/cart', isAdmin, (req, res) => {
  const userId = req.params.id;

  db.query(
    'SELECT * FROM abandoned_carts WHERE user_id = ?',
    [userId],
    (err, items) => {
      if (err) {
        console.error('❌ Error fetching cart for user:', err);
        return res.status(500).send('Error loading cart');
      }

      res.render('admin/adminUserCart', { items, userId });
    }
  );
});

// Show all orders
router.get('/admin/orders', isAdmin, (req, res) => {
  const query = `
   SELECT o.id AS order_id, u.name AS user_name, o.total_price, o.placed_at
   FROM orders o
   LEFT JOIN users u ON o.user_id = u.id
   ORDER BY o.placed_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).send('Server Error');
    }

    res.render('admin/adminOrders', { orders: results });
  });
});


// 🆕 Abandoned Carts Route
router.get('/admin/abandoned-carts', isAdmin, (req, res) => {
  const query = `
    SELECT ac.*, u.name AS user_name, u.email AS user_email
    FROM abandoned_carts ac
    LEFT JOIN users u ON ac.user_id = u.id
    ORDER BY ac.saved_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching abandoned carts:', err);
      return res.status(500).send('Server Error');
    }

    res.render('admin/adminAbandonedCarts', { carts: results });
  });
});

module.exports = router;
