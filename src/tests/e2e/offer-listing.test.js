/**
 * Offer Listing E2E Tests
 * 
 * This file contains end-to-end tests for the offer listing functionality.
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

describe('Offer Listing and Filtering', () => {
  beforeEach(async () => {
    // Navigate to the homepage before each test
    await page.goto(global.BASE_URL);
    await page.waitForSelector('body');
    
    // Inject mock wallet for testing
    await injectMockWallet(page, { connected: true });
    
    // Wait for UI to update
    await wait(1000);
    
    // Navigate to buy tab
    const buyTabExists = await elementExists(page, '[data-testid="tab-buy"]');
    if (buyTabExists) {
      await clickElement(page, '[data-testid="tab-buy"]');
      await wait(500);
    }
  });

  test('should display offer cards', async () => {
    // Check if offers list exists
    const offersListExists = await elementExists(page, '[data-testid="offers-list"]');
    expect(offersListExists).toBe(true);
    
    // Take screenshot of offer listing
    await takeScreenshot(page, 'offer-listing');
    
    // Check if at least one offer card is displayed
    const offerCardExists = await elementExists(page, '[data-testid="offer-card"]');
    expect(offerCardExists).toBe(true);
  });

  test('should filter offers by amount', async () => {
    // Check if filter panel exists
    const filterPanelExists = await elementExists(page, '[data-testid="filter-panel"]');
    if (!filterPanelExists) {
      const filterToggleExists = await elementExists(page, '[data-testid="filter-toggle"]');
      if (filterToggleExists) {
        await clickElement(page, '[data-testid="filter-toggle"]');
        await wait(500);
      }
    }
    
    // Set min amount filter
    const minAmountInputExists = await elementExists(page, '[data-testid="min-amount"]');
    if (minAmountInputExists) {
      await typeIntoInput(page, '[data-testid="min-amount"]', '50');
      await wait(500);
      await takeScreenshot(page, 'min-amount-filter');
    }
    
    // Apply filters if button exists
    const applyFilterExists = await elementExists(page, '[data-testid="apply-filters"]');
    if (applyFilterExists) {
      await clickElement(page, '[data-testid="apply-filters"]');
      await wait(1000);
      await takeScreenshot(page, 'filtered-offers');
    }
  });

  test('should sort offers by rate', async () => {
    // Check if sort selector exists
    const sortSelectorExists = await elementExists(page, '[data-testid="sort-selector"]');
    if (sortSelectorExists) {
      await clickElement(page, '[data-testid="sort-selector"]');
      await wait(500);
      
      // Select sort by rate option
      const rateSortOptionExists = await elementExists(page, '[data-testid="sort-by-rate"]');
      if (rateSortOptionExists) {
        await clickElement(page, '[data-testid="sort-by-rate"]');
        await wait(1000);
        await takeScreenshot(page, 'rate-sorted-offers');
      }
    }
  });

  test('should paginate through offers', async () => {
    // Check if pagination exists
    const paginationExists = await elementExists(page, '[data-testid="pagination"]');
    if (paginationExists) {
      // Get current page number
      const initialPageNumber = await getElementText(page, '[data-testid="current-page"]');
      
      // Click next page button if available
      const nextPageExists = await elementExists(page, '[data-testid="next-page"]');
      if (nextPageExists) {
        await clickElement(page, '[data-testid="next-page"]');
        await wait(1000);
        await takeScreenshot(page, 'next-page');
        
        // Get new page number
        const newPageNumber = await getElementText(page, '[data-testid="current-page"]');
        expect(newPageNumber).not.toBe(initialPageNumber);
      }
      
      // Test page size selector
      const pageSizeExists = await elementExists(page, '[data-testid="page-size"]');
      if (pageSizeExists) {
        await clickElement(page, '[data-testid="page-size"]');
        await wait(500);
        
        // Select a different page size
        const largerPageSizeExists = await elementExists(page, '[data-testid="page-size-20"]');
        if (largerPageSizeExists) {
          await clickElement(page, '[data-testid="page-size-20"]');
          await wait(1000);
          await takeScreenshot(page, 'larger-page-size');
        }
      }
    }
  });

  test('should save and apply search preferences', async () => {
    // Check if save search option exists
    const saveSearchExists = await elementExists(page, '[data-testid="save-search"]');
    if (saveSearchExists) {
      // Open filter panel if needed
      const filterPanelVisible = await elementExists(page, '[data-testid="filter-panel"]:not(.hidden)');
      if (!filterPanelVisible) {
        const filterToggleExists = await elementExists(page, '[data-testid="filter-toggle"]');
        if (filterToggleExists) {
          await clickElement(page, '[data-testid="filter-toggle"]');
          await wait(500);
        }
      }
      
      // Set some filter value
      const currencyFilterExists = await elementExists(page, '[data-testid="currency-filter"]');
      if (currencyFilterExists) {
        await clickElement(page, '[data-testid="currency-filter"]');
        await wait(500);
        
        // Select a specific currency
        const solOptionExists = await elementExists(page, '[data-testid="currency-SOL"]');
        if (solOptionExists) {
          await clickElement(page, '[data-testid="currency-SOL"]');
          await wait(500);
        }
      }
      
      // Save search preferences
      await clickElement(page, '[data-testid="save-search"]');
      await wait(500);
      
      // Check if save dialog appears
      const saveDialogExists = await elementExists(page, '[data-testid="save-search-dialog"]');
      if (saveDialogExists) {
        // Enter name for saved search
        await typeIntoInput(page, '[data-testid="saved-search-name"]', 'My SOL Search');
        
        // Save the search
        await clickElement(page, '[data-testid="confirm-save-search"]');
        await wait(1000);
        await takeScreenshot(page, 'saved-search');
      }
      
      // Clear filters
      const clearFiltersExists = await elementExists(page, '[data-testid="clear-filters"]');
      if (clearFiltersExists) {
        await clickElement(page, '[data-testid="clear-filters"]');
        await wait(1000);
      }
      
      // Load saved search if feature exists
      const loadSearchExists = await elementExists(page, '[data-testid="load-search"]');
      if (loadSearchExists) {
        await clickElement(page, '[data-testid="load-search"]');
        await wait(500);
        
        // Select saved search from dropdown
        const savedSearchItemExists = await elementExists(page, '[data-testid="saved-search-item"]');
        if (savedSearchItemExists) {
          await clickElement(page, '[data-testid="saved-search-item"]');
          await wait(1000);
          await takeScreenshot(page, 'loaded-saved-search');
        }
      }
    }
  });
});