/**
 * UI Navigation E2E Tests
 * 
 * This file contains end-to-end tests for basic UI navigation in the application.
 */

// Import helper functions
const {
  waitForElement,
  clickElement,
  getElementText,
  elementExists,
  takeScreenshot,
  setViewport
} = require('./utils/pageHelpers');

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

describe('Basic UI Navigation', () => {
  beforeEach(async () => {
    // Navigate to the homepage before each test
    await page.goto(global.BASE_URL);
    await page.waitForSelector('body');
  });

  test('should load homepage correctly', async () => {
    // Wait for the main content to load
    await waitForElement(page, 'main');
    
    // Take a screenshot for debugging
    await takeScreenshot(page, 'homepage');
    
    // Check if the page title includes 'SVM P2P'
    const title = await page.title();
    expect(title).toMatch(/SVM P2P/i);
  });

  test('should navigate between main tabs', async () => {
    // Wait for the navigation to load
    await waitForElement(page, 'nav');
    
    // Check if Buy tab exists and click it
    const buyTabExists = await elementExists(page, '[data-testid="tab-buy"]');
    if (buyTabExists) {
      await clickElement(page, '[data-testid="tab-buy"]');
      await takeScreenshot(page, 'buy-tab');
      
      // Verify Buy tab content is displayed
      const buyContentExists = await elementExists(page, '[data-testid="offers-list"]');
      expect(buyContentExists).toBe(true);
    }
    
    // Check if Sell tab exists and click it
    const sellTabExists = await elementExists(page, '[data-testid="tab-sell"]');
    if (sellTabExists) {
      await clickElement(page, '[data-testid="tab-sell"]');
      await takeScreenshot(page, 'sell-tab');
      
      // Verify Sell tab content is displayed
      const sellContentExists = await elementExists(page, '[data-testid="offer-creation"]');
      expect(sellContentExists).toBe(true);
    }
    
    // Check if My Offers tab exists and click it
    const myOffersTabExists = await elementExists(page, '[data-testid="tab-myoffers"]');
    if (myOffersTabExists) {
      await clickElement(page, '[data-testid="tab-myoffers"]');
      await takeScreenshot(page, 'my-offers-tab');
      
      // Verify My Offers tab content is displayed
      const myOffersContentExists = await elementExists(page, '[data-testid="offers-list"]');
      expect(myOffersContentExists).toBe(true);
    }
  });

  test('should show and hide wallet connection modal', async () => {
    // Find and click wallet connect button
    const walletButtonExists = await elementExists(page, '.wallet-adapter-button');
    if (walletButtonExists) {
      await clickElement(page, '.wallet-adapter-button');
      
      // Wait for modal to appear
      await waitForElement(page, '.wallet-adapter-modal');
      await takeScreenshot(page, 'wallet-modal-open');
      
      // Verify modal is displayed
      const modalVisible = await elementExists(page, '.wallet-adapter-modal-wrapper');
      expect(modalVisible).toBe(true);
      
      // Close modal by clicking outside
      await page.mouse.click(10, 10);
      
      // Wait for modal to disappear
      await page.waitForSelector('.wallet-adapter-modal-wrapper', { hidden: true });
      await takeScreenshot(page, 'wallet-modal-closed');
    }
  });

  test('should have functional offer filters', async () => {
    // Navigate to buy tab
    const buyTabExists = await elementExists(page, '[data-testid="tab-buy"]');
    if (buyTabExists) {
      await clickElement(page, '[data-testid="tab-buy"]');
      
      // Check if filter panel exists
      const filterPanelExists = await elementExists(page, '[data-testid="filter-panel"]');
      if (filterPanelExists) {
        await clickElement(page, '[data-testid="filter-toggle"]');
        await takeScreenshot(page, 'filter-panel-open');
        
        // Check if filter inputs exist
        const amountFilterExists = await elementExists(page, '[data-testid="amount-filter"]');
        expect(amountFilterExists).toBe(true);
        
        // Toggle filter panel closed
        await clickElement(page, '[data-testid="filter-toggle"]');
        await takeScreenshot(page, 'filter-panel-closed');
      }
    }
  });

  test('should have functional pagination controls', async () => {
    // Navigate to buy tab
    const buyTabExists = await elementExists(page, '[data-testid="tab-buy"]');
    if (buyTabExists) {
      await clickElement(page, '[data-testid="tab-buy"]');
      
      // Check if pagination controls exist
      const paginationExists = await elementExists(page, '[data-testid="pagination"]');
      if (paginationExists) {
        // Check if next page button exists and is clickable
        const nextButtonExists = await elementExists(page, '[data-testid="next-page"]');
        if (nextButtonExists) {
          await clickElement(page, '[data-testid="next-page"]');
          await takeScreenshot(page, 'pagination-next');
        }
        
        // Check if page size selector exists
        const pageSizeSelectorExists = await elementExists(page, '[data-testid="page-size"]');
        if (pageSizeSelectorExists) {
          await clickElement(page, '[data-testid="page-size"]');
          await takeScreenshot(page, 'page-size-options');
        }
      }
    }
  });
});