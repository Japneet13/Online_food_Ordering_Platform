function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // For AJAX/API requests, respond with JSON error
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Redirect unauthenticated users to login with optional from param
  const redirectURL = `/?showLogin=1&from=${encodeURIComponent(req.originalUrl)}`;
  return res.redirect(redirectURL);
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  return res.status(403).send('Forbidden: Admins only');
}

module.exports = { isAuthenticated, isAdmin };
