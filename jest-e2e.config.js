module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/setup/e2e.setup.js'],
  testMatch: [
    '**/src/tests/e2e/**/*.test.js'
  ],
  verbose: true,
  // Don't collect coverage for E2E tests
  collectCoverage: false,
};