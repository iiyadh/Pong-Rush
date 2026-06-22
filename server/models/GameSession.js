const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    score: {
      type: Number,
      default: 0
    },
    paddleY: Number,
    isReady: {
      type: Boolean,
      default: false
    }
  }],
  gameState: {
    ball: {
      x: Number,
      y: Number,
      dx: Number,
      dy: Number
    },
    speed: {
      type: Number,
      default: 4
    },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'playing', 'finished'],
      default: 'waiting'
    }
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number
}, {
  timestamps: true
});

GameSessionSchema.index({ roomId: 1 });
GameSessionSchema.index({ 'gameState.status': 1 });
GameSessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GameSession', GameSessionSchema);
