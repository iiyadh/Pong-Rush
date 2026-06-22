module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
