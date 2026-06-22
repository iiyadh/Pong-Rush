const User = require('../models/User');
const GameSession = require('../models/GameSession');

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('stats');
    res.json({
      success: true,
      stats: user.stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch stats. Please try again.'
    });
  }
};

exports.updateStats = async (req, res) => {
  try {
    const { result, points = 0 } = req.body;
    
    if (!['win', 'loss'].includes(result)) {
      return res.status(400).json({
        message: 'Invalid result. Must be "win" or "loss".'
      });
    }

    const user = await User.findById(req.userId);
    await user.updateStats(result, points);

    res.json({
      success: true,
      stats: user.stats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      message: 'Failed to update stats. Please try again.'
    });
  }
};

exports.saveGame = async (req, res) => {
  try {
    const { opponent, score, result } = req.body;

    if (!opponent || !score || !result) {
      return res.status(400).json({
        message: 'Missing required fields: opponent, score, result'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.updateStats(result, score.player1 || 0);

    const session = new GameSession({
      roomId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      players: [
        { userId: req.userId, username: user.username, score: score.player1 || 0 },
        { userId: req.userId, username: opponent, score: score.player2 || 0 }
      ],
      winner: result === 'win' ? req.userId : undefined,
      gameState: {
        ball: { x: 0, y: 0, dx: 0, dy: 0 },
        speed: 4,
        status: 'finished',
        score
      },
      startedAt: new Date(Date.now() - 60000),
      endedAt: new Date(),
      duration: 60
    });
    await session.save();

    res.json({
      success: true,
      stats: user.stats
    });
  } catch (error) {
    console.error('Save game error:', error);
    res.status(500).json({
      message: 'Failed to save game. Please try again.'
    });
  }
};

exports.getMatchHistory = async (req, res) => {
  try {
    const sessions = await GameSession.find({
      'players.userId': req.userId
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('players.userId', 'username');

    res.json({
      success: true,
      history: sessions
    });
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({
      message: 'Failed to fetch match history. Please try again.'
    });
  }
};
