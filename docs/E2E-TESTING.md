# End-to-End Testing Guide

This document describes how to run and create end-to-end (E2E) tests for the SVM P2P Exchange application using Puppeteer.

## Overview

The E2E tests simulate real user interactions with the application in a browser environment. These tests help ensure that the application works correctly from a user's perspective and that all components integrate properly.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Chrome or Chromium browser
- Docker (optional, for containerized testing)

## Running Tests

### Local Testing

To run the E2E tests locally:

```bash
# Install dependencies
npm ci

# Run E2E tests
npm run test:e2e

# Run E2E tests with debugging (saves screenshots)
npm run test:e2e:debug
```

### Docker Testing

To run tests in a Docker container:

```bash
# Build and run the test container
docker-compose -f docker-compose.test.yml up --build

# Or using Docker directly
docker build -t svmp2p-e2e-tests -f Dockerfile.test .
docker run --rm -v $(pwd)/screenshots:/app/screenshots svmp2p-e2e-tests
```

## Test Structure

E2E tests are located in the `src/tests/e2e` directory and organized as follows:

```
src/tests/e2e/
├── setup/              # Test setup files
│   └── e2e.setup.js    # Configuration for E2E tests
├── utils/              # Helper utilities
│   ├── pageHelpers.js  # Browser interaction helpers
│   └── walletMock.js   # Mock wallet implementation
├── ui-navigation.test.js     # Tests for basic UI navigation
├── wallet-connection.test.js # Tests for wallet connection
├── offer-listing.test.js     # Tests for offer listings and filtering
└── user-profile.test.js      # Tests for user profile functionality
```

## Configuration Files

- `jest-e2e.config.js`: Jest configuration for E2E tests
- `jest-puppeteer.config.js`: Puppeteer configuration
- `Dockerfile.test`: Docker configuration for running tests
- `docker-compose.test.yml`: Docker Compose configuration for testing

## Creating New Tests

To create a new E2E test:

1. Create a new test file in the `src/tests/e2e` directory with a descriptive name ending in `.test.js`
2. Import the necessary helper functions from `utils/pageHelpers.js`
3. Write your test cases using the Jest testing framework and Puppeteer API
4. Use the `page` object provided by Jest Puppeteer to interact with the browser

Example test structure:

```javascript
const { waitForElement, clickElement } = require('./utils/pageHelpers');

describe('My Feature', () => {
  beforeEach(async () => {
    await page.goto(global.BASE_URL);
  });

  test('should perform some action', async () => {
    await clickElement(page, '.my-selector');
    const result = await waitForElement(page, '.result-selector');
    expect(result).toBeTruthy();
  });
});
```

## Best Practices

- Make tests independent and isolated
- Use descriptive test names that explain the expected behavior
- Use helper functions from `pageHelpers.js` rather than direct Puppeteer API calls
- Take screenshots at critical points to help with debugging
- Add appropriate waits and selectors to ensure stability

## Troubleshooting

- If tests are flaky, try increasing timeouts in the wait functions
- If elements aren't found, check that your selectors match the rendered HTML
- If the application doesn't load, ensure the development server is running on port 3000
- Check screenshots in the `screenshots` directory to diagnose issues

## CI/CD Integration

E2E tests are automatically run in GitHub Actions for pull requests and pushes to main branch. The workflow is defined in `.github/workflows/e2e-tests.yml`.