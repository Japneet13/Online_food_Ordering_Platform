const express = require('express');
const router = express.Router();
const db = require('../db');

// Home page route
router.get('/', (req, res) => {
  res.render('home', {
    user: req.session.user,
    cart: req.session.cart || [],
    showGreeting: true,
    loginError: req.query.loginError
  });
});

// Menu page route
router.get('/menu', (req, res) => {
  db.query('SELECT * FROM menu', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server Error');
    }

    const categories = [...new Set(rows.map(item => item.category))];

    res.render('menu', {
      menuItems: rows,
      categories,
      cart: req.session.cart || []
    });
  });
});

// 🍕 Pizza Menu
router.get('/menu/pizza', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Pizza'
  `, (err, rows) => {
    if (err) return res.send('Error');
    res.render('menuItems', {
      title: 'Pizza Menu',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
    console.log('Menu Items from DB:', rows);
  });
});

// 🍝 Pasta Menu
router.get('/menu/pasta', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Pasta'
  `, (err, rows) => {
    if (err) return res.status(500).send('Server Error');
    res.render('menuItems', {
      title: 'Our Pasta Collection',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
    console.log('Menu Items from DB:', rows);
  });
});

// 🧄 Garlic Breads
router.get('/menu/garlic-breads', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Garlic Breads'
  `, (err, rows) => {
    if (err) return res.status(500).send('Server Error');
    res.render('menuItems', {
      title: 'Garlic Breads',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
    console.log('Menu Items from DB:', rows);
  });
});

// 🍟 Fries
router.get('/menu/fries', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Fries'
  `, (err, rows) => {
    if (err) return res.status(500).send('Server Error');
    res.render('menuItems', {
      title: 'Fries That Slay',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
    console.log('Menu Items from DB:', rows);
  });
});

// 🥤 Beverages
router.get('/menu/beverages', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Beverages'
  `, (err, rows) => {
    if (err) return res.status(500).send('Server Error');
    res.render('menuItems', {
      title: 'Bubbly Beverages',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
    console.log('Menu Items from DB:', rows);
  });
});

// 🥫 Dips & Sauces
router.get('/menu/dips-sauces', (req, res) => {
  db.query(`
    SELECT id, name, price, image, description, type, price_level, spice_level 
    FROM menu 
    WHERE category = 'Dips & Sauces'
  `, (err, rows) => {
    if (err) return res.status(500).send('Server Error');
    res.render('menuItems', {
      title: 'Dips & Sauces',
      user: req.session.user,
      items: rows,
      cart: req.session.cart || [],
      currentPage: 'menu'
    });
  });
});

module.exports = router;
