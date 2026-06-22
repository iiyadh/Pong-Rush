const jwt = require('jsonwebtoken');

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  select: jest.fn().mockReturnThis(),
};

jest.mock('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue(mockUser),
}));

const authMiddleware = require('../../middleware/auth');

describe('Auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn(), userId: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() with valid token', async () => {
    const token = jwt.sign({ userId: mockUser._id }, process.env.JWT_SECRET);
    req.header.mockReturnValue(`Bearer ${token}`);

    await authMiddleware(req, res, next);

    expect(req.userId).toBe(mockUser._id);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 if no token provided', async () => {
    req.header.mockReturnValue(null);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with malformed token', async () => {
    req.header.mockReturnValue('Bearer not-a-valid-token');

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
