/**
 * Helper functions for Puppeteer E2E tests
 */

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after the specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for navigation to complete
 * @param {Page} page - Puppeteer page object
 * @returns {Promise} - Promise that resolves when navigation completes
 */
const waitForNavigation = async (page) => {
  return page.waitForNavigation({ waitUntil: 'networkidle0' });
};

/**
 * Wait for an element to be visible on the page
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<ElementHandle>} - Promise that resolves with the element handle
 */
const waitForElement = async (page, selector, timeout = 10000) => {
  await page.waitForSelector(selector, { visible: true, timeout });
  return page.$(selector);
};

/**
 * Take a screenshot and save it to a file
 * @param {Page} page - Puppeteer page object
 * @param {string} name - Name of the screenshot file
 */
const takeScreenshot = async (page, name) => {
  if (process.env.DEBUG) {
    await page.screenshot({ path: `./screenshots/${name}.png`, fullPage: true });
  }
};

/**
 * Click an element on the page
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 */
const clickElement = async (page, selector) => {
  await waitForElement(page, selector);
  await page.click(selector);
};

/**
 * Type text into an input field
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the input element
 * @param {string} text - Text to type
 */
const typeIntoInput = async (page, selector, text) => {
  await waitForElement(page, selector);
  await page.type(selector, text);
};

/**
 * Check if an element exists on the page
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 * @returns {Promise<boolean>} - Promise that resolves with true if the element exists
 */
const elementExists = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get the text content of an element
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 * @returns {Promise<string>} - Promise that resolves with the text content
 */
const getElementText = async (page, selector) => {
  await waitForElement(page, selector);
  return page.$eval(selector, el => el.textContent.trim());
};

/**
 * Set browser viewport size
 * @param {Page} page - Puppeteer page object
 * @param {Object} size - Viewport size object with width and height
 */
const setViewport = async (page, size = { width: 1280, height: 720 }) => {
  await page.setViewport(size);
};

module.exports = {
  wait,
  waitForNavigation,
  waitForElement,
  takeScreenshot,
  clickElement,
  typeIntoInput,
  elementExists,
  getElementText,
  setViewport
};