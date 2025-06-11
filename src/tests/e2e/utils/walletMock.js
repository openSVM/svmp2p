/**
 * Mock wallet functions for E2E testing
 */

/**
 * Inject a mock wallet for testing
 * @param {Page} page - Puppeteer page object
 * @param {Object} options - Mock wallet options
 * @returns {Promise<void>} - Promise that resolves when mock wallet is injected
 */
const injectMockWallet = async (page, options = {}) => {
  const {
    address = '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
    connected = true,
    balance = 100.5
  } = options;

  await page.evaluate(({ address, connected, balance }) => {
    window.__MOCK_WALLET__ = {
      address,
      connected,
      balance
    };

    // Mock wallet connection function
    window.connectWallet = async () => {
      window.__MOCK_WALLET__.connected = true;
      
      // Dispatch a custom event that the app can listen for
      window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { 
          address: window.__MOCK_WALLET__.address 
        } 
      }));
      
      return { success: true };
    };

    // Mock wallet disconnect function
    window.disconnectWallet = async () => {
      window.__MOCK_WALLET__.connected = false;
      
      // Dispatch a custom event that the app can listen for
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
      
      return { success: true };
    };

    // Override the wallet adapter
    if (window.solana) {
      window.solana.isPhantom = true;
      window.solana.connected = connected;
      window.solana.publicKey = { toBase58: () => address };
      window.solana.connect = window.connectWallet;
      window.solana.disconnect = window.disconnectWallet;
      window.solana.signTransaction = async () => ({ success: true });
      window.solana.signAllTransactions = async () => ({ success: true });
    } else {
      window.solana = {
        isPhantom: true,
        connected,
        publicKey: { toBase58: () => address },
        connect: window.connectWallet,
        disconnect: window.disconnectWallet,
        signTransaction: async () => ({ success: true }),
        signAllTransactions: async () => ({ success: true })
      };
    }
  }, { address, connected, balance });
};

module.exports = {
  injectMockWallet
};