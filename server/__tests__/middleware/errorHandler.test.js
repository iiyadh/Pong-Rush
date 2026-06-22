const errorHandler = require('../../middleware/errorHandler');

describe('Error handler middleware', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('handles Mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Invalid email' },
        password: { message: 'Too short' },
      },
    };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation Error',
      errors: ['Invalid email', 'Too short'],
    });
  });

  it('handles duplicate key error (11000)', () => {
    const err = {
      code: 11000,
      keyPattern: { username: 1 },
    };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'username already exists. Please use a different one.',
    });
  });

  it('handles JsonWebTokenError', () => {
    const err = { name: 'JsonWebTokenError' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid token. Please login again.',
    });
  });

  it('handles TokenExpiredError', () => {
    const err = { name: 'TokenExpiredError' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token expired. Please login again.',
    });
  });

  it('handles generic errors with 500', () => {
    const err = { message: 'Something broke' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Something broke',
    });
  });
});
