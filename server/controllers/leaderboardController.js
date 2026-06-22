const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, sortBy = 'wins' } = req.query;

    const validSortFields = ['wins', 'totalGames', 'totalPoints'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'wins';

    const users = await User.find({
      'stats.totalGames': { $gt: 0 }
    })
    .select('username stats avatar')
    .sort({ [`stats.${sortField}`]: -1 })
    .limit(parseInt(limit));

    const leaderboard = users.map(user => {
      const obj = user.toObject();
      obj.winRate = obj.stats.totalGames > 0
        ? Math.round((obj.stats.wins / obj.stats.totalGames) * 100)
        : 0;
      return obj;
    });

    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch leaderboard. Please try again.'
    });
  }
};
