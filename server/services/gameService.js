const GameSession = require('../models/GameSession');

class GameService {
  static async createSession(roomId, players) {
    const session = new GameSession({
      roomId,
      players: players.map(p => ({
        userId: p.userId,
        username: p.username
      })),
      gameState: { status: 'waiting' }
    });
    return await session.save();
  }

  static async updateSessionStatus(roomId, status) {
    return await GameSession.findOneAndUpdate(
      { roomId },
      { 'gameState.status': status },
      { new: true }
    );
  }

  static async endSession(roomId, winnerId, score) {
    return await GameSession.findOneAndUpdate(
      { roomId },
      {
        winner: winnerId,
        endedAt: new Date(),
        'gameState.status': 'finished',
        'gameState.score': score
      },
      { new: true }
    );
  }

  static async getSession(roomId) {
    return await GameSession.findOne({ roomId });
  }

  static async getUserSessions(userId, limit = 20) {
    return await GameSession.find({
      'players.userId': userId
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('players.userId', 'username');
  }
}

module.exports = GameService;
