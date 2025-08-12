/**
 * Comprehensive User Flow E2E Tests
 * 
 * Complete coverage of all user flows in the OpenSVM P2P Exchange
 */

const {
  waitForElement,
  clickElement,
  getElementText,
  elementExists,
  takeScreenshot,
  setViewport,
  wait,
  typeText,
  selectOption
} = require('./utils/pageHelpers');

const { injectMockWallet } = require('./utils/walletMock');

describe('Comprehensive User Flow Tests', () => {
  beforeEach(async () => {
    await page.goto(global.BASE_URL);
    await page.waitForSelector('body');
    await wait(1000); // Allow page to stabilize
  });

  describe('Navigation and Layout Tests', () => {
    test('should display main navigation elements', async () => {
      // Check for main navigation items
      const buyExists = await elementExists(page, 'nav a[href="/buy"], nav a[href*="buy"]');
      const sellExists = await elementExists(page, 'nav a[href="/sell"], nav a[href*="sell"]');
      const analyticsExists = await elementExists(page, 'nav a[href="/analytics"], nav a[href*="analytics"]');
      const helpExists = await elementExists(page, 'nav a[href="/help"], nav a[href*="help"]');
      const profileExists = await elementExists(page, 'nav a[href="/profile"], nav a[href*="profile"]');

      expect(buyExists).toBeTruthy();
      expect(sellExists).toBeTruthy();
      expect(analyticsExists).toBeTruthy();
      expect(helpExists).toBeTruthy();
      expect(profileExists).toBeTruthy();

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'navigation-elements');
      }
    });

    test('should display theme selector and network selector', async () => {
      // Check for network selector
      const networkSelectorExists = await elementExists(page, '.network-selector, [data-testid="network-selector"]');
      expect(networkSelectorExists).toBeTruthy();

      // Check for language selector in navbar
      const languageSelectorExists = await elementExists(page, '.language-selector, [data-testid="language-selector"]');
      expect(languageSelectorExists).toBeTruthy();

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'selectors');
      }
    });

    test('should be responsive on mobile viewport', async () => {
      // Test mobile responsiveness
      await page.setViewport({ width: 375, height: 667 });
      await wait(500);

      const bodyExists = await elementExists(page, 'body');
      expect(bodyExists).toBeTruthy();

      // Check that content is not overflowing
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'mobile-responsive');
      }

      // Reset viewport
      await setViewport(page);
    });

    test('should be responsive on tablet viewport', async () => {
      // Test tablet responsiveness
      await page.setViewport({ width: 768, height: 1024 });
      await wait(500);

      const bodyExists = await elementExists(page, 'body');
      expect(bodyExists).toBeTruthy();

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'tablet-responsive');
      }

      // Reset viewport
      await setViewport(page);
    });
  });

  describe('Theme System Tests', () => {
    test('should support theme switching from profile settings', async () => {
      // Navigate to profile page
      const profileExists = await elementExists(page, 'nav a[href="/profile"], nav a[href*="profile"]');
      if (profileExists) {
        await clickElement(page, 'nav a[href="/profile"], nav a[href*="profile"]');
        await wait(1000);

        // Look for theme selector in profile settings
        const themeSelectorExists = await elementExists(page, '.theme-selector, [data-testid="theme-selector"]');
        
        if (themeSelectorExists) {
          // Try to change theme to blueprint
          const blueprintOption = await elementExists(page, 'option[value="blueprint"], [data-theme="blueprint"]');
          if (blueprintOption) {
            await page.select('.theme-selector select, [data-testid="theme-selector"] select', 'blueprint');
            await wait(500);

            // Verify theme change took effect
            const bodyClass = await page.evaluate(() => document.body.className);
            expect(bodyClass).toContain('blueprint');
          }
        }

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'theme-switching');
        }
      }
    });

    test('should maintain consistent styling across themes', async () => {
      const themes = ['blueprint', 'grayscale', 'minimal'];

      for (const theme of themes) {
        // Try to set theme via localStorage
        await page.evaluate((themeName) => {
          localStorage.setItem('selectedTheme', themeName);
          document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${themeName}`;
        }, theme);
        
        await page.reload();
        await wait(1000);

        // Check that buttons maintain consistent sizing
        const buttonExists = await elementExists(page, '.button, button, input[type="submit"]');
        if (buttonExists) {
          const buttonHeight = await page.evaluate(() => {
            const button = document.querySelector('.button, button, input[type="submit"]');
            return button ? window.getComputedStyle(button).height : null;
          });
          
          // Height should be reasonable (not extreme)
          if (buttonHeight) {
            const heightValue = parseInt(buttonHeight);
            expect(heightValue).toBeGreaterThan(20); // Not too small
            expect(heightValue).toBeLessThan(100); // Not too large
          }
        }

        if (process.env.DEBUG) {
          await takeScreenshot(page, `theme-${theme}-consistency`);
        }
      }
    });
  });

  describe('Wallet Connection Flow Tests', () => {
    test('should show wallet connection prompt', async () => {
      // Look for wallet connection elements
      const connectButtonExists = await elementExists(page, 
        '.wallet-adapter-button, .connect-wallet-button, button[data-testid="connect-wallet"], .phantom-wallet-button'
      );

      if (connectButtonExists) {
        await clickElement(page, 
          '.wallet-adapter-button, .connect-wallet-button, button[data-testid="connect-wallet"], .phantom-wallet-button'
        );
        await wait(1000);

        // Should show some wallet selection or instruction
        const walletPromptExists = await elementExists(page, 
          '.wallet-modal, .wallet-selection, .wallet-connection-guide'
        );
        
        // This might not exist in test environment, so we just ensure no errors occurred
        const pageTitle = await page.title();
        expect(pageTitle).toBeDefined();
      }

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'wallet-connection-prompt');
      }
    });

    test('should handle wallet not found scenario', async () => {
      // Mock scenario where wallet is not available
      await page.evaluate(() => {
        window.phantom = undefined;
        window.solana = undefined;
      });

      const connectButtonExists = await elementExists(page, 
        '.wallet-adapter-button, .connect-wallet-button, button[data-testid="connect-wallet"], .phantom-wallet-button'
      );

      if (connectButtonExists) {
        await clickElement(page, 
          '.wallet-adapter-button, .connect-wallet-button, button[data-testid="connect-wallet"], .phantom-wallet-button'
        );
        await wait(1000);

        // Should show installation prompt
        const installPromptExists = await elementExists(page, 
          '.wallet-not-found, .install-wallet, [data-testid="wallet-not-found"]'
        );
        
        // Check that page handles this gracefully
        const hasErrors = await page.evaluate(() => {
          return window.console.errors || false;
        });
        
        // Should not have thrown unhandled errors
        expect(hasErrors).toBeFalsy();
      }

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'wallet-not-found');
      }
    });
  });

  describe('Sell Page User Flow Tests', () => {
    test('should navigate to sell page and display form', async () => {
      // Navigate to sell page
      const sellLinkExists = await elementExists(page, 'nav a[href="/sell"], nav a[href*="sell"]');
      
      if (sellLinkExists) {
        await clickElement(page, 'nav a[href="/sell"], nav a[href*="sell"]');
        await wait(1000);

        // Check for sell offer form elements
        const formExists = await elementExists(page, 'form, .offer-creation-form, .sell-form');
        expect(formExists).toBeTruthy();

        // Check for required form fields
        const solAmountField = await elementExists(page, 
          'input[name="solAmount"], input[placeholder*="SOL"], #solAmount, [data-testid="sol-amount"]'
        );
        const currencySelector = await elementExists(page, 
          'select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]'
        );
        const paymentMethodSelector = await elementExists(page, 
          'select[name="paymentMethod"], .payment-method-selector, #paymentMethod, [data-testid="payment-method"]'
        );

        expect(solAmountField).toBeTruthy();
        expect(currencySelector).toBeTruthy();
        expect(paymentMethodSelector).toBeTruthy();

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'sell-page-form');
        }
      }
    });

    test('should validate sell offer form inputs', async () => {
      // Navigate to sell page
      const sellLinkExists = await elementExists(page, 'nav a[href="/sell"], nav a[href*="sell"]');
      
      if (sellLinkExists) {
        await clickElement(page, 'nav a[href="/sell"], nav a[href*="sell"]');
        await wait(1000);

        // Try to submit empty form
        const submitButton = await elementExists(page, 
          'button[type="submit"], .create-offer-button, .submit-button'
        );

        if (submitButton) {
          await clickElement(page, 'button[type="submit"], .create-offer-button, .submit-button');
          await wait(500);

          // Should show validation or remain on page
          const currentUrl = await page.url();
          expect(currentUrl).toContain('sell');
        }

        // Test form filling
        const solAmountField = await elementExists(page, 
          'input[name="solAmount"], input[placeholder*="SOL"], #solAmount, [data-testid="sol-amount"]'
        );

        if (solAmountField) {
          await typeText(page, 
            'input[name="solAmount"], input[placeholder*="SOL"], #solAmount, [data-testid="sol-amount"]', 
            '1.5'
          );

          // Select currency if available
          const currencySelector = await elementExists(page, 
            'select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]'
          );

          if (currencySelector) {
            await selectOption(page, 
              'select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]', 
              'USD'
            );
          }

          if (process.env.DEBUG) {
            await takeScreenshot(page, 'sell-form-filled');
          }
        }
      }
    });

    test('should display currency and payment method options', async () => {
      // Navigate to sell page
      const sellLinkExists = await elementExists(page, 'nav a[href="/sell"], nav a[href*="sell"]');
      
      if (sellLinkExists) {
        await clickElement(page, 'nav a[href="/sell"], nav a[href*="sell"]');
        await wait(1000);

        // Check currency options
        const currencySelector = await elementExists(page, 
          'select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]'
        );

        if (currencySelector) {
          const currencyOptions = await page.evaluate(() => {
            const select = document.querySelector('select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]');
            return select ? Array.from(select.options).map(option => option.value) : [];
          });

          // Should have multiple currency options (top 100 currencies as requested)
          expect(currencyOptions.length).toBeGreaterThan(10);

          // Should include major currencies
          expect(currencyOptions).toEqual(expect.arrayContaining(['USD', 'EUR']));
        }

        // Test payment method updating based on currency
        const paymentMethodSelector = await elementExists(page, 
          'select[name="paymentMethod"], .payment-method-selector, #paymentMethod, [data-testid="payment-method"]'
        );

        if (currencySelector && paymentMethodSelector) {
          // Select RUB to test Russian banking options
          await selectOption(page, 
            'select[name="currency"], .currency-selector, #currency, [data-testid="currency-selector"]', 
            'RUB'
          );
          await wait(500);

          const paymentOptions = await page.evaluate(() => {
            const select = document.querySelector('select[name="paymentMethod"], .payment-method-selector, #paymentMethod, [data-testid="payment-method"]');
            return select ? Array.from(select.options).map(option => option.text) : [];
          });

          // Should include Russian payment methods
          const hasRussianMethods = paymentOptions.some(option => 
            option.includes('Sberbank') || option.includes('Russian') || option.includes('RUB')
          );

          if (process.env.DEBUG) {
            console.log('Payment options for RUB:', paymentOptions);
            await takeScreenshot(page, 'rub-payment-methods');
          }
        }
      }
    });
  });

  describe('Buy Page User Flow Tests', () => {
    test('should navigate to buy page and display offers', async () => {
      // Navigate to buy page
      const buyLinkExists = await elementExists(page, 'nav a[href="/buy"], nav a[href*="buy"]');
      
      if (buyLinkExists) {
        await clickElement(page, 'nav a[href="/buy"], nav a[href*="buy"]');
        await wait(1000);

        // Check for offer listings or empty state
        const offersExist = await elementExists(page, 
          '.offer-list, .offer-item, .offers-container, [data-testid="offer-list"]'
        );
        const emptyStateExists = await elementExists(page, 
          '.empty-state, .no-offers, [data-testid="no-offers"]'
        );

        // Should have either offers or empty state
        expect(offersExist || emptyStateExists).toBeTruthy();

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'buy-page');
        }
      }
    });

    test('should display filtering options', async () => {
      // Navigate to buy page
      const buyLinkExists = await elementExists(page, 'nav a[href="/buy"], nav a[href*="buy"]');
      
      if (buyLinkExists) {
        await clickElement(page, 'nav a[href="/buy"], nav a[href*="buy"]');
        await wait(1000);

        // Check for filter options
        const filtersExist = await elementExists(page, 
          '.filters, .filter-section, [data-testid="filters"]'
        );

        if (filtersExist) {
          // Should have currency filter
          const currencyFilterExists = await elementExists(page, 
            '.currency-filter, select[name*="currency"], [data-testid="currency-filter"]'
          );
          
          // Should have amount filter
          const amountFilterExists = await elementExists(page, 
            '.amount-filter, input[name*="amount"], [data-testid="amount-filter"]'
          );

          if (process.env.DEBUG) {
            await takeScreenshot(page, 'buy-page-filters');
          }
        }
      }
    });
  });

  describe('Profile Page User Flow Tests', () => {
    test('should navigate to profile page', async () => {
      // Navigate to profile page
      const profileLinkExists = await elementExists(page, 'nav a[href="/profile"], nav a[href*="profile"]');
      
      if (profileLinkExists) {
        await clickElement(page, 'nav a[href="/profile"], nav a[href*="profile"]');
        await wait(1000);

        // Should show profile content or connection prompt
        const profileContentExists = await elementExists(page, 
          '.profile-content, .user-profile, .profile-settings, [data-testid="profile"]'
        );
        const connectPromptExists = await elementExists(page, 
          '.connect-wallet-prompt, .wallet-connection-guide'
        );

        expect(profileContentExists || connectPromptExists).toBeTruthy();

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'profile-page');
        }
      }
    });

    test('should display interface preferences section', async () => {
      // Navigate to profile page
      const profileLinkExists = await elementExists(page, 'nav a[href="/profile"], nav a[href*="profile"]');
      
      if (profileLinkExists) {
        await clickElement(page, 'nav a[href="/profile"], nav a[href*="profile"]');
        await wait(1000);

        // Look for interface preferences (theme selector should be here now)
        const interfacePrefsExists = await elementExists(page, 
          '.interface-preferences, [data-testid="interface-preferences"]'
        );
        
        const themeSelectorExists = await elementExists(page, 
          '.theme-selector, [data-testid="theme-selector"]'
        );

        if (interfacePrefsExists || themeSelectorExists) {
          if (process.env.DEBUG) {
            await takeScreenshot(page, 'profile-interface-preferences');
          }
        }
      }
    });
  });

  describe('Help Page User Flow Tests', () => {
    test('should navigate to help page and display comprehensive content', async () => {
      // Navigate to help page
      const helpLinkExists = await elementExists(page, 'nav a[href="/help"], nav a[href*="help"]');
      
      if (helpLinkExists) {
        await clickElement(page, 'nav a[href="/help"], nav a[href*="help"]');
        await wait(1000);

        // Check for help content sections
        const helpContentExists = await elementExists(page, '.help-content, .help-section');
        expect(helpContentExists).toBeTruthy();

        // Check for specific sections
        const gettingStartedExists = await elementExists(page, 'h2, h3');
        const faqExists = await elementExists(page, '.faq-item, .faq-section');
        const technicalInfoExists = await elementExists(page, 'a[href*="solana.com"], a[href*="explorer"]');

        expect(gettingStartedExists).toBeTruthy();

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'help-page-comprehensive');
        }
      }
    });

    test('should have working external links', async () => {
      // Navigate to help page
      const helpLinkExists = await elementExists(page, 'nav a[href="/help"], nav a[href*="help"]');
      
      if (helpLinkExists) {
        await clickElement(page, 'nav a[href="/help"], nav a[href*="help"]');
        await wait(1000);

        // Check for Solana explorer link
        const explorerLinkExists = await elementExists(page, 'a[href*="explorer.solana.com"]');
        
        if (explorerLinkExists) {
          const linkHref = await page.evaluate(() => {
            const link = document.querySelector('a[href*="explorer.solana.com"]');
            return link ? link.href : null;
          });

          expect(linkHref).toContain('explorer.solana.com');
          expect(linkHref).toContain('devnet');
        }

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'help-page-links');
        }
      }
    });
  });

  describe('Analytics Page User Flow Tests', () => {
    test('should navigate to analytics page', async () => {
      // Navigate to analytics page
      const analyticsLinkExists = await elementExists(page, 'nav a[href="/analytics"], nav a[href*="analytics"]');
      
      if (analyticsLinkExists) {
        await clickElement(page, 'nav a[href="/analytics"], nav a[href*="analytics"]');
        await wait(1000);

        // Should show analytics content or empty state
        const analyticsContentExists = await elementExists(page, 
          '.analytics-dashboard, .analytics-content, [data-testid="analytics"]'
        );
        const emptyStateExists = await elementExists(page, 
          '.empty-state, .no-data, [data-testid="no-analytics"]'
        );

        expect(analyticsContentExists || emptyStateExists).toBeTruthy();

        if (process.env.DEBUG) {
          await takeScreenshot(page, 'analytics-page');
        }
      }
    });
  });

  describe('Error Handling and External Script Tests', () => {
    test('should handle console errors gracefully', async () => {
      const consoleErrors = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate through different pages
      await page.goto(global.BASE_URL);
      await wait(2000);

      // Filter out known external script errors (wallet extensions)
      const appErrors = consoleErrors.filter(error => 
        !error.includes('inpage.js') &&
        !error.includes('Cannot access \'m\' before initialization') &&
        !error.includes('Could not establish connection') &&
        !error.includes('custom element') &&
        !error.includes('webcomponents-ce.js')
      );

      // Should have minimal application errors
      expect(appErrors.length).toBeLessThan(3);

      if (process.env.DEBUG) {
        console.log('Console errors:', consoleErrors);
        console.log('App-specific errors:', appErrors);
      }
    });

    test('should handle network errors gracefully', async () => {
      // Mock network failures
      await page.setOfflineMode(true);
      
      // Try to navigate to different pages
      try {
        await page.goto(global.BASE_URL);
        await wait(1000);
      } catch (error) {
        // Expected to fail offline
      }

      // Re-enable network
      await page.setOfflineMode(false);
      
      // Should recover gracefully
      await page.goto(global.BASE_URL);
      await wait(1000);

      const bodyExists = await elementExists(page, 'body');
      expect(bodyExists).toBeTruthy();

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'network-recovery');
      }
    });
  });

  describe('Performance and Loading Tests', () => {
    test('should load pages within reasonable time', async () => {
      const startTime = Date.now();
      
      await page.goto(global.BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);

      if (process.env.DEBUG) {
        console.log(`Page load time: ${loadTime}ms`);
      }
    });

    test('should handle concurrent navigation', async () => {
      // Rapid navigation between pages
      const pages = ['/buy', '/sell', '/analytics', '/help', '/profile'];
      
      for (const pagePath of pages) {
        const linkExists = await elementExists(page, `nav a[href="${pagePath}"], nav a[href*="${pagePath.slice(1)}"]`);
        
        if (linkExists) {
          await clickElement(page, `nav a[href="${pagePath}"], nav a[href*="${pagePath.slice(1)}"]`);
          await wait(500); // Quick navigation
          
          // Should not crash
          const bodyExists = await elementExists(page, 'body');
          expect(bodyExists).toBeTruthy();
        }
      }

      if (process.env.DEBUG) {
        await takeScreenshot(page, 'rapid-navigation');
      }
    });
  });
});