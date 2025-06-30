const db = require('../db');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: './public/images',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
exports.upload = upload;

// View items filtered by category using admin.ejs
exports.getAdminCategoryItems = (req, res) => {
  const category = req.params.category;

  const query = 'SELECT * FROM menu WHERE category = ?';
  db.query(query, [category], (err, results) => {
    if (err) {
      console.error('❌ Error fetching items:', err);
      return res.status(500).send('Server Error');
    }

    res.render('admin/admin', {
      items: results,
      user: req.session.user,
      updated: null,
      currentCategory: category,
      totalUsers: 0,
      totalOrders: 0,
      abandonedCarts: 0,
      totalMenuItems: results.length
    });
  });
};


// 🧠 Dashboard View
exports.getAdminDashboard = (req, res) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COUNT(*) FROM abandoned_carts) AS abandonedCarts,
      (SELECT COUNT(*) FROM menu) AS totalMenuItems
  `;

  const itemsQuery = `SELECT * FROM menu`;

  db.query(statsQuery, (err1, statsResult) => {
    if (err1) {
      console.error('❌ Error fetching admin dashboard stats:', err1);
      return res.status(500).send('Server Error (Stats)');
    }

    const stats = statsResult[0] || {
      totalUsers: 0,
      totalOrders: 0,
      abandonedCarts: 0,
      totalMenuItems: 0
    };

    db.query(itemsQuery, (err2, menuItems) => {
      if (err2) {
        console.error('❌ Error fetching menu items:', err2);
        return res.status(500).send('Server Error (Menu)');
      }

      // ✅ Optional logging to verify what admin sees
      console.log('📊 Admin Dashboard Stats:', stats);

      res.render('admin/admin', {
        items: menuItems,
        user: req.session.user,
        updated: req.query.updated || null, 
        totalUsers: stats.totalUsers,
        totalOrders: stats.totalOrders,
        abandonedCarts: stats.abandonedCarts,
        totalMenuItems: stats.totalMenuItems,
        currentCategory: null
      });
    });
  });
};



// 📋 Add Item Form
exports.getAddItemForm = (req, res) => {
  res.render('admin/addItem', { user: req.session.user });
};

// 💾 Add Item to DB
exports.postAddItem = (req, res) => {
  const { name, description, price, category, type, spice_level, price_level } = req.body;

  if (!req.file) {
    return res.status(400).send('Image is required.');
  }

  const image = req.file.filename;

  db.query(
    'INSERT INTO menu (name, description, price, image, category, type, spice_level, price_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, price, image, category, type, spice_level, price_level],
    (err) => {
      if (err) {
        console.error('DB Error:', err);
        return res.status(500).send('Database error.');
      }       
      req.session.updated = 'added';
      res.redirect('/admin');
    }
  );
};


// 🗑️ Delete Item
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM menu WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Delete failed');        
    req.session.updated = 'deleted';
    res.redirect('/admin');
  });
};

// GET Edit Form
exports.getEditItemForm = (req, res) => {
  const itemId = req.params.id;

  db.query('SELECT * FROM menu WHERE id = ?', [itemId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Item not found');
    }
    res.render('admin/editItem', {
      item: results[0],
      user: req.session.user
    });
  });
};

// POST Edit Item
exports.postEditItem = (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, type, spice_level, price_level } = req.body;

  if (!req.file) {
    db.query('SELECT image FROM menu WHERE id = ?', [id], (err, result) => {
      if (err || result.length === 0) return res.status(500).send('Image fallback failed.');
      updateItem(result[0].image); 
    });
  } else {
    updateItem(req.file.filename);
  }

  function updateItem(image) {
    db.query(
      'UPDATE menu SET name = ?, description = ?, price = ?, image = ?, category = ?, type = ?, spice_level = ?, price_level = ? WHERE id = ?',
      [name, description, price, image, category, type, spice_level, price_level, id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error updating item');
        }

        req.session.updated = 'edited'; 
        res.redirect('/admin');
      }
    );
  }
};

// 📦 View abandoned carts
exports.viewAbandonedCarts = (req, res) => {
  const query = `
    SELECT a.id, u.name, u.email, a.items, a.saved_at
    FROM abandoned_carts a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.saved_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Failed to load abandoned carts:', err);
      return res.status(500).send('Error loading carts');
    }

    // Parse JSON safely
    results.forEach(row => {
      try {
        row.parsedItems = JSON.parse(row.items);
      } catch (e) {
        row.parsedItems = [];
        console.warn('⚠️ Failed to parse cart JSON for abandoned cart ID:', row.id);
      }
    });

    res.render('admin/adminAbandonedCarts', { carts: results });
  });
};


exports.saveAbandonedCart = (req, res) => {
  if (!req.session.user || !req.session.user.id) return res.sendStatus(204);

  const userId = req.session.user.id;
  const items = JSON.stringify(req.body.items || []);

  const query = 'INSERT INTO abandoned_carts (user_id, items) VALUES (?, ?)';

  db.query(query, [userId, items], (err) => {
    if (err) {
      console.error('❌ Failed to save abandoned cart:', err);
      return res.sendStatus(500);
    }
    console.log('💾 Abandoned cart saved for user:', userId);
    res.sendStatus(200);
  });
};
