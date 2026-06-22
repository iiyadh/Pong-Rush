const User = require('../models/User');

class UserService {
  static async findById(userId) {
    return await User.findById(userId).select('-password');
  }

  static async findByEmail(email) {
    return await User.findOne({ email });
  }

  static async findByUsername(username) {
    return await User.findOne({ username });
  }

  static async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async updateOnlineStatus(userId, isOnline) {
    return await User.findByIdAndUpdate(
      userId,
      { isOnline, lastSeen: new Date() },
      { new: true }
    );
  }

  static async updateStats(userId, result, points = 0) {
    const user = await User.findById(userId);
    if (user) {
      await user.updateStats(result, points);
    }
    return user;
  }

  static async getLeaderboard(limit = 10, sortBy = 'wins') {
    return await User.find({ 'stats.totalGames': { $gt: 0 } })
      .select('username stats')
      .sort({ [`stats.${sortBy}`]: -1 })
      .limit(limit);
  }
}

module.exports = UserService;
