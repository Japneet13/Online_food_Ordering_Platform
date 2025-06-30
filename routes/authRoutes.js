const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/dashboard', isAuthenticated, authController.getDashboard);

router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  res.render('cart', {
    cart,
    totalItems,
    totalPrice,
    user: req.session.user // optional if used in cart.ejs
  });
});


router.get('/logout', (req, res) => {
  const redirectTo = req.session.lastPage || '/';
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); 
    res.redirect('/');       
  });
});

module.exports = router;
