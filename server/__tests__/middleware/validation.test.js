const { validateEmail, validateUsername, validatePassword } = require('../../utils/validators');

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('bad')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('accepts valid usernames', () => {
      expect(validateUsername('Player1')).toBe(true);
    });

    it('rejects short usernames', () => {
      expect(validateUsername('ab')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts 6+ char passwords', () => {
      expect(validatePassword('123456')).toBe(true);
    });

    it('rejects short passwords', () => {
      expect(validatePassword('12345')).toBe(false);
    });
  });
});
