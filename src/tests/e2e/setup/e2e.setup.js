// Increase the timeout for Puppeteer operations
jest.setTimeout(120000); // 120 seconds (increased from 60s)

// Global variables for E2E tests
global.BASE_URL = 'http://localhost:3000';

// Helper that ensures page is defined for all tests
beforeAll(async () => {
  // Ensure page object is defined
  expect(page).toBeDefined();
  
  // Add methods to help with debugging
  page.on('console', message => {
    if (process.env.DEBUG) {
      console.log(`Browser console [${message.type()}]: ${message.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error(`Browser page error: ${error.message}`);
  });
  
  // Set default navigation timeout
  await page.setDefaultNavigationTimeout(60000);
});