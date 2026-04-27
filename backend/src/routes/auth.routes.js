const express = require('express');
const { register, login, refreshToken } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Example of a protected route
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile fetched successfully',
    data: req.user
  });
});

module.exports = router;
