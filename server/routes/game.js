const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getStats, updateStats, getMatchHistory, saveGame } = require('../controllers/gameController');

router.get('/stats', authMiddleware, getStats);
router.post('/stats', authMiddleware, updateStats);
router.post('/save', authMiddleware, saveGame);
router.get('/history', authMiddleware, getMatchHistory);

module.exports = router;
