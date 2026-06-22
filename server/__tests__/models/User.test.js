const bcrypt = require('bcryptjs');

const mockSave = jest.fn();
const mockUserInstance = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  password: '',
  stats: {
    wins: 0,
    losses: 0,
    totalGames: 0,
    winStreak: 0,
    maxWinStreak: 0,
    totalPoints: 0,
  },
  save: mockSave,
};

jest.mock('../../models/User', () => {
  const mongoose = require('mongoose');
  const actual = jest.requireActual('../../models/User');
  return actual;
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const User = require('../../models/User');

describe('User Model', () => {
  describe('password hashing', () => {
    it('hashes password before save', async () => {
      const user = new User({
        username: 'newplayer',
        email: 'new@example.com',
        password: '123456',
      });

      user.isModified = jest.fn().mockReturnValue(true);
      await user.save();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 'salt');
      expect(user.password).toBe('hashed-password');
    });

    it('does not re-hash if password not modified', async () => {
      const user = new User({
        username: 'existing',
        email: 'existing@example.com',
        password: 'already-hashed',
      });

      user.isModified = jest.fn().mockReturnValue(false);
      await user.save();

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('comparePassword', () => {
    it('returns true for matching password', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const user = new User({ username: 'a', email: 'a@b.com', password: '123456' });

      const result = await user.comparePassword('123456');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', user.password);
    });

    it('returns false for wrong password', async () => {
      bcrypt.compare.mockResolvedValue(false);
      const user = new User({ username: 'a', email: 'a@b.com', password: '123456' });

      const result = await user.comparePassword('wrong');

      expect(result).toBe(false);
    });
  });

  describe('updateStats', () => {
    it('increments wins and streak on win', () => {
      const user = new User({ username: 'a', email: 'a@b.com', password: '123456' });
      user.save = jest.fn().mockResolvedValue(user);

      user.updateStats('win', 10);

      expect(user.stats.wins).toBe(1);
      expect(user.stats.totalGames).toBe(1);
      expect(user.stats.winStreak).toBe(1);
      expect(user.stats.maxWinStreak).toBe(1);
      expect(user.stats.totalPoints).toBe(10);
    });

    it('increments losses and resets streak on loss', () => {
      const user = new User({
        username: 'a',
        email: 'a@b.com',
        password: '123456',
        stats: { wins: 5, losses: 2, totalGames: 7, winStreak: 3, maxWinStreak: 5, totalPoints: 50 },
      });
      user.save = jest.fn().mockResolvedValue(user);

      user.updateStats('loss', 5);

      expect(user.stats.losses).toBe(3);
      expect(user.stats.winStreak).toBe(0);
      expect(user.stats.totalPoints).toBe(55);
    });

    it('updates maxWinStreak when current streak exceeds it', () => {
      const user = new User({
        username: 'a',
        email: 'a@b.com',
        password: '123456',
        stats: { wins: 5, losses: 2, totalGames: 7, winStreak: 3, maxWinStreak: 5, totalPoints: 50 },
      });
      user.save = jest.fn().mockResolvedValue(user);
      user.stats.winStreak = 5;

      user.updateStats('win', 0);

      expect(user.stats.maxWinStreak).toBe(6);
    });

    it('handles zero points gracefully', () => {
      const user = new User({ username: 'a', email: 'a@b.com', password: '123456' });
      user.save = jest.fn().mockResolvedValue(user);

      user.updateStats('win');

      expect(user.stats.totalPoints).toBe(0);
    });
  });

  describe('virtual winRate', () => {
    it('returns 0 when no games played', () => {
      const user = new User({ username: 'a', email: 'a@b.com', password: '123456' });
      expect(user.winRate).toBe(0);
    });

    it('calculates win rate correctly', () => {
      const user = new User({
        username: 'a',
        email: 'a@b.com',
        password: '123456',
        stats: { wins: 7, losses: 3, totalGames: 10, winStreak: 0, maxWinStreak: 0, totalPoints: 0 },
      });
      expect(user.winRate).toBe(70);
    });
  });
});
