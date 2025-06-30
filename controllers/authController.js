const bcrypt = require('bcrypt'); 
const db = require('../config/db');

// POST Signup Logic
exports.postSignup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      (err, results) => {
        if (err) {
          console.error('❌ DB Insert Error:', err);
          return res.status(500).send('Something went wrong.');
        }

        // Auto-login the user by creating a session manually
        const newUser = {
          id: results.insertId,
          name,
          email,
          role: 'user' // default role
        };
        req.session.user = newUser;
        req.session.showGreeting = true;

        console.log(`✅ New user registered & auto-logged in: ${email}`);
        return res.redirect('/'); // Redirect to home or dashboard
      }
    );
  } catch (error) {
    console.error('❌ Signup Error:', error);
    res.status(500).send('Something went wrong.');
  }
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log("📥 Login attempt:", email);

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      console.error("❌ Login DB error or user not found");
      return res.redirect('/?loginError=1');
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log("❌ Invalid password");
      return res.redirect('/?loginError=1');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    };

    // ✅ Load saved cart from actual user_cart table (one row per item)
    db.query(
      'SELECT item_id, name, price, quantity, image FROM user_cart WHERE user_id = ?',
      [user.id],
      (cartErr, cartRows) => {
        if (cartErr) {
          console.error("❌ Error loading cart:", cartErr);
          req.session.cart = [];
        } else if (cartRows.length > 0) {
          req.session.cart = cartRows.map(item => ({
            id: item.item_id.toString(),
            name: item.name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            image: item.image
          }));
          console.log("🛒 Cart restored from DB:", req.session.cart);
        } else {
          console.log("ℹ️ No saved cart found.");
          req.session.cart = [];
        }

        // ✅ Redirect after restoring cart
        if (user.email.toLowerCase() === 'admin@lacrosta.com') return res.redirect('/admin');
        if (req.query.from === 'cart') return res.redirect('/cart');
        if (req.query.from === 'reminder') return res.redirect('/');

        const redirectTo = req.session.lastPage || '/';
        delete req.session.lastPage;
        return res.redirect(redirectTo);
      }
    );
  });
};

// Redirect to Home for Login or Signup GET
exports.getLogin = (req, res) => {
  res.redirect('/?showLogin=1');
};

exports.getSignup = (req, res) => {
  res.redirect('/?showSignup=1');
};

// Dashboard (Optional)
exports.getDashboard = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  res.render('dashboard', { user: req.session.user });
};
