/**
 * Jest configuration for ASOOS
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false, // Keep mocks between tests
  testTimeout: 10000,
  verbose: true
};