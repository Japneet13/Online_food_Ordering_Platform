const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');


// Public or guest-allowed
router.get('/cart', cartController.getCart); // ✅ Now visible without login
router.post('/add-to-cart', cartController.addToCart);
router.get('/cart-count', cartController.getCartSummary);
router.post('/save-abandoned-cart', cartController.saveAbandonedCart);
router.post('/update-cart', cartController.updateCart);
router.post('/clear-cart', cartController.clearCart);

// Protected
router.post('/place-order', isAuthenticated, cartController.placeOrder);


module.exports = router;
