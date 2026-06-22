const jwt = require('jsonwebtoken');

const mockSave = jest.fn();
const mockUserInstance = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashed-password',
  stats: { wins: 0, losses: 0, totalGames: 0, winStreak: 0, maxWinStreak: 0, totalPoints: 0 },
  isOnline: false,
  lastSeen: new Date(),
  save: mockSave,
  comparePassword: jest.fn(),
};

const mockFindOne = jest.fn();
const mockFindById = jest.fn().mockResolvedValue(mockUserInstance);
const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(mockUserInstance);
const mockUserConstructor = jest.fn().mockImplementation(() => mockUserInstance);

jest.mock('../../models/User', () => {
  const mock = jest.fn(() => mockUserInstance);
  mock.findOne = mockFindOne;
  mock.findById = mockFindById;
  mock.findByIdAndUpdate = mockFindByIdAndUpdate;
  return mock;
});

jest.mock('../../utils/email', () => ({
  sendMail: jest.fn().mockResolvedValue(true),
}));

const {
  register,
  login,
  logout,
  me,
  updateUsername,
  updatePassword,
  updateAvatar,
  forgotPassword,
  resetPassword,
} = require('../../controllers/authController');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, userId: mockUserInstance._id, user: mockUserInstance };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
    mockUserInstance.save = mockSave;
    mockUserInstance.comparePassword = jest.fn();
  });

  describe('register', () => {
    it('creates a new user and returns 201 with token', async () => {
      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(mockUserInstance);
      req.body = { username: 'newuser', email: 'new@example.com', password: '123456' };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, token: expect.any(String) })
      );
    });

    it('returns 400 if email already taken', async () => {
      mockFindOne.mockResolvedValue({ email: 'taken@example.com', username: 'other' });
      req.body = { username: 'newuser', email: 'taken@example.com', password: '123456' };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already registered. Please use a different one.',
      });
    });
  });

  describe('login', () => {
    it('returns token on valid credentials', async () => {
      mockFindOne.mockResolvedValue(mockUserInstance);
      mockUserInstance.comparePassword.mockResolvedValue(true);
      req.body = { email: 'test@example.com', password: '123456' };

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, token: expect.any(String) })
      );
    });

    it('returns 401 on wrong password', async () => {
      mockFindOne.mockResolvedValue(mockUserInstance);
      mockUserInstance.comparePassword.mockResolvedValue(false);
      req.body = { email: 'test@example.com', password: 'wrong' };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password.' });
    });

    it('returns 401 if user not found', async () => {
      mockFindOne.mockResolvedValue(null);
      req.body = { email: 'noone@example.com', password: '123456' };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('sets user offline', async () => {
      mockFindById.mockResolvedValue(mockUserInstance);

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('me', () => {
    it('returns user profile', async () => {
      mockFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUserInstance) });

      await me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, user: mockUserInstance })
      );
    });
  });

  describe('updateUsername', () => {
    it('updates and returns user', async () => {
      mockFindOne.mockResolvedValue(null);
      req.body = { username: 'newname' };

      await updateUsername(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, user: mockUserInstance })
      );
    });

    it('rejects short usernames', async () => {
      req.body = { username: 'ab' };

      await updateUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updatePassword', () => {
    it('updates password with correct current password', async () => {
      mockFindById.mockResolvedValue(mockUserInstance);
      mockUserInstance.comparePassword.mockResolvedValue(true);
      req.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };

      await updatePassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password updated successfully',
      });
    });

    it('returns 401 on wrong current password', async () => {
      mockFindById.mockResolvedValue(mockUserInstance);
      mockUserInstance.comparePassword.mockResolvedValue(false);
      req.body = { currentPassword: 'wrong', newPassword: 'newpass123' };

      await updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email if user exists', async () => {
      mockFindOne.mockResolvedValue(mockUserInstance);
      req.body = { email: 'test@example.com' };

      await forgotPassword(req, res);

      const { sendMail } = require('../../utils/email');
      expect(sendMail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      });
    });

    it('does not reveal if email is unknown', async () => {
      mockFindOne.mockResolvedValue(null);
      req.body = { email: 'unknown@example.com' };

      await forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      mockFindOne.mockResolvedValue({ ...mockUserInstance, save: jest.fn().mockResolvedValue(true) });
      req.body = { token: 'valid-token', password: 'newpass123' };

      await resetPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successful',
      });
    });

    it('returns 400 if token missing', async () => {
      req.body = { password: 'newpass123' };

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
