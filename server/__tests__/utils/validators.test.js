const { validateEmail, validateUsername, validatePassword } = require('../../utils/validators');

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co')).toBe(true);
    expect(validateEmail('name+tag@company.org')).toBe(true);
    expect(validateEmail('a@b.cd')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('plainaddress')).toBe(false);
    expect(validateEmail('@missing-username.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
  });
});

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('player1')).toBe(true);
    expect(validateUsername('PongMaster')).toBe(true);
    expect(validateUsername('ping_pong')).toBe(true);
    expect(validateUsername('abc')).toBe(true);
    expect(validateUsername('a_very_long_username_1')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(validateUsername('')).toBe(false);
    expect(validateUsername('ab')).toBe(false);
    expect(validateUsername('a@user')).toBe(false);
    expect(validateUsername('user name')).toBe(false);
    expect(validateUsername('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts passwords of 6+ characters', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('abcdefgh')).toBe(true);
    expect(validatePassword('pass!@#$%^')).toBe(true);
  });

  it('rejects short passwords', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('abc')).toBe(false);
  });

  it('rejects null or undefined', () => {
    expect(validatePassword(null)).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
  });
});
