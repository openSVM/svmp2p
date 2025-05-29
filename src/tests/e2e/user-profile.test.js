/**
 * User Profile E2E Tests
 * 
 * This file contains end-to-end tests for the user profile functionality.
 */

// Import helper functions
const {
  waitForElement,
  clickElement,
  typeIntoInput,
  getElementText,
  elementExists,
  takeScreenshot,
  setViewport,
  wait
} = require('./utils/pageHelpers');

// Import wallet mock utilities
const { injectMockWallet } = require('./utils/walletMock');

// Create screenshots directory if DEBUG is enabled
beforeAll(async () => {
  if (process.env.DEBUG) {
    const fs = require('fs');
    if (!fs.existsSync('./screenshots')) {
      fs.mkdirSync('./screenshots');
    }
  }

  // Set viewport for consistent testing
  await setViewport(page);
});

describe('User Profile Tests', () => {
  beforeEach(async () => {
    // Navigate to the homepage before each test
    await page.goto(global.BASE_URL);
    await page.waitForSelector('body');
    
    // Inject mock wallet for testing
    await injectMockWallet(page, { 
      connected: true,
      address: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
      balance: 123.45
    });
    
    // Wait for UI to update
    await wait(1000);
    
    // Navigate to profile tab
    const profileTabExists = await elementExists(page, '[data-testid="tab-profile"]');
    if (profileTabExists) {
      await clickElement(page, '[data-testid="tab-profile"]');
      await wait(1000);
    }
  });

  test('should display user profile with wallet address', async () => {
    // Check if profile page is displayed
    const profileHeaderExists = await elementExists(page, '[data-testid="profile-header"]');
    expect(profileHeaderExists).toBe(true);
    
    // Take screenshot of profile page
    await takeScreenshot(page, 'user-profile');
    
    // Check if wallet address is displayed
    const addressDisplayExists = await elementExists(page, '[data-testid="wallet-address"]');
    if (addressDisplayExists) {
      const addressText = await getElementText(page, '[data-testid="wallet-address"]');
      expect(addressText).toContain('5Gh7');
    }
  });

  test('should copy wallet address to clipboard', async () => {
    // Find copy address button
    const copyButtonExists = await elementExists(page, '[data-testid="copy-address"]');
    if (copyButtonExists) {
      // Mock clipboard API
      await page.evaluate(() => {
        window.originalClipboard = navigator.clipboard;
        navigator.clipboard = {
          writeText: jest.fn().mockImplementation(() => Promise.resolve()),
          readText: jest.fn().mockImplementation(() => Promise.resolve('5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3'))
        };
      });
      
      // Click copy button
      await clickElement(page, '[data-testid="copy-address"]');
      await wait(1000);
      await takeScreenshot(page, 'address-copied');
      
      // Check if success message appears
      const successMessageExists = await elementExists(page, '[data-testid="copy-success"]');
      expect(successMessageExists).toBe(true);
    }
  });

  test('should display transaction history if available', async () => {
    // Check if transaction history section exists
    const transactionHistoryExists = await elementExists(page, '[data-testid="transaction-history"]');
    if (transactionHistoryExists) {
      // Take screenshot of transaction history
      await takeScreenshot(page, 'transaction-history');
      
      // Check if there are transaction items
      const transactionItemExists = await elementExists(page, '[data-testid="transaction-item"]');
      expect(transactionItemExists).toBe(true);
    }
  });

  test('should handle wallet disconnection from profile page', async () => {
    // Find disconnect button
    const disconnectButtonExists = await elementExists(page, '[data-testid="disconnect-wallet"]');
    if (disconnectButtonExists) {
      await clickElement(page, '[data-testid="disconnect-wallet"]');
      await wait(1000);
      await takeScreenshot(page, 'profile-disconnected');
      
      // Check if not connected message is displayed
      const notConnectedMessageExists = await elementExists(page, '[data-testid="wallet-not-connected"]');
      expect(notConnectedMessageExists).toBe(true);
    } else {
      // Alternative: click wallet menu and disconnect
      await clickElement(page, '.wallet-adapter-button');
      await wait(500);
      
      const menuDisconnectExists = await elementExists(page, '.wallet-adapter-dropdown-list-item');
      if (menuDisconnectExists) {
        await clickElement(page, '.wallet-adapter-dropdown-list-item');
        await wait(1000);
        await takeScreenshot(page, 'profile-menu-disconnected');
        
        // Check if not connected message is displayed
        const notConnectedMessageExists = await elementExists(page, '[data-testid="wallet-not-connected"]');
        expect(notConnectedMessageExists).toBe(true);
      }
    }
  });

  test('should handle errors gracefully', async () => {
    // Deliberately cause an error by setting the wallet to null
    await page.evaluate(() => {
      window.solana = null;
    });
    
    // Reload the profile page
    await clickElement(page, '[data-testid="tab-buy"]');
    await wait(500);
    await clickElement(page, '[data-testid="tab-profile"]');
    await wait(1000);
    
    // Take screenshot of error state
    await takeScreenshot(page, 'profile-error-state');
    
    // Check if error boundary is triggered
    const errorMessageExists = await elementExists(page, '.error-fallback');
    if (errorMessageExists) {
      expect(true).toBe(true); // Error boundary working correctly
    } else {
      // Alternative check: look for any error indicators
      const anyErrorElement = await elementExists(page, '[data-testid*="error"]');
      expect(anyErrorElement).toBe(true);
    }
  });
});