const express = require('express');
const router = express.Router();
const { register, login, logout, me, updateUsername, updatePassword, updateAvatar, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', authMiddleware, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.put('/username', authMiddleware, updateUsername);
router.put('/password', authMiddleware, updatePassword);
router.put('/avatar', authMiddleware, updateAvatar);

module.exports = router;
