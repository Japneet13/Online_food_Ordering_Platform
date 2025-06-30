const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const cartRoutes = require('./routes/cartRoutes');

require('dotenv').config();

const app = express();

// DEBUG ROUTE — REMOVE AFTER USE
app.get('/hash-admin', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('jk@13', 10);
  res.send(`Hash: ${hash}`);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 

// 🛑 Prevent caching of session-dependent content
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ✅ Setup session middleware
app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: true
}));

// ✅ Make cart accessible in all views
app.use((req, res, next) => {
  res.locals.cart = req.session.cart || [];
  next();
});

// ✅ Middleware to store last visited non-auth page (excluding static & special cases)
app.use((req, res, next) => {
  const exclude = ['/login', '/logout', '/signup', '/cart-count', '/update-cart'];
  const isStatic = req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/images');
  const isReminder = req.query.from === 'reminder';
  const isApi = req.headers.accept && req.headers.accept.includes('application/json');

  if (!exclude.includes(req.path) && !isStatic && !isReminder && !isApi) {
    req.session.lastPage = req.originalUrl;
  }

  next();
});


// ✅ Mount Routes
app.use('/', authRoutes);
app.use('/', foodRoutes);    
app.use('/', adminRoutes);
app.use('/', cartRoutes); 

// ✅ Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
