/**
 * Wallet Connection E2E Tests
 * 
 * This file contains end-to-end tests for wallet connection functionality.
 */

// Import helper functions
const {
  waitForElement,
  clickElement,
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

describe('Wallet Connection Tests', () => {
  beforeEach(async () => {
    // Navigate to the homepage before each test
    await page.goto(global.BASE_URL);
    await page.waitForSelector('body');
    
    // Inject mock wallet for testing
    await injectMockWallet(page, { connected: false });
  });

  test('should show wallet connection modal', async () => {
    // Find and click wallet connect button
    const walletButtonExists = await elementExists(page, '.wallet-adapter-button');
    if (walletButtonExists) {
      await clickElement(page, '.wallet-adapter-button');
      
      // Wait for modal to appear
      await waitForElement(page, '.wallet-adapter-modal');
      await takeScreenshot(page, 'wallet-modal');
      
      // Verify modal is displayed
      const modalVisible = await elementExists(page, '.wallet-adapter-modal-wrapper');
      expect(modalVisible).toBe(true);
      
      // Close modal by clicking outside
      await page.mouse.click(10, 10);
      
      // Wait for modal to disappear
      await page.waitForSelector('.wallet-adapter-modal-wrapper', { hidden: true });
    }
  });

  test('should connect mock wallet', async () => {
    // Connect mock wallet
    await page.evaluate(() => {
      window.connectWallet();
    });
    
    // Wait for UI to update
    await wait(1000);
    await takeScreenshot(page, 'wallet-connected');
    
    // Check if wallet button shows wallet address
    const walletButtonText = await page.$eval('.wallet-adapter-button', el => el.textContent);
    expect(walletButtonText).toMatch(/5Gh7/); // Should contain part of the address
  });

  test('should access profile with connected wallet', async () => {
    // Connect mock wallet first
    await page.evaluate(() => {
      window.connectWallet();
    });
    
    // Wait for UI to update
    await wait(1000);
    
    // Navigate to profile tab
    const profileTabExists = await elementExists(page, '[data-testid="tab-profile"]');
    if (profileTabExists) {
      await clickElement(page, '[data-testid="tab-profile"]');
      await wait(1000);
      await takeScreenshot(page, 'profile-page');
      
      // Check if profile page shows wallet address
      const profileHeaderExists = await elementExists(page, '[data-testid="profile-header"]');
      expect(profileHeaderExists).toBe(true);
    }
  });

  test('should disconnect wallet', async () => {
    // Connect mock wallet first
    await page.evaluate(() => {
      window.connectWallet();
    });
    
    // Wait for UI to update
    await wait(1000);
    
    // Click connected wallet button to show menu
    await clickElement(page, '.wallet-adapter-button');
    await wait(500);
    
    // Click disconnect option if available
    const disconnectExists = await elementExists(page, '.wallet-adapter-dropdown-list-item');
    if (disconnectExists) {
      await clickElement(page, '.wallet-adapter-dropdown-list-item');
      await wait(1000);
      await takeScreenshot(page, 'wallet-disconnected');
      
      // Verify wallet is disconnected
      const walletButtonText = await page.$eval('.wallet-adapter-button', el => el.textContent);
      expect(walletButtonText).toMatch(/Connect/i);
    }
  });
});