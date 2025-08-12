import React from 'react';

export default function HelpPage() {
  return (
    <div className="app-form">
      <div className="app-form-header">HELP & SUPPORT</div>
      
      <div className="help-content">
        <section className="help-section">
          <h2>Getting Started</h2>
          <div className="help-item">
            <h3>🚀 Quick Start Guide</h3>
            <ol>
              <li>Connect your Phantom wallet using the "CONNECT PHANTOM" button</li>
              <li>Ensure you're on Solana Devnet for testing</li>
              <li>Visit the SELL page to create offers for selling SOL</li>
              <li>Visit the BUY page to browse and accept existing offers</li>
              <li>Track your trades in the ANALYTICS section</li>
            </ol>
          </div>
          
          <div className="help-item">
            <h3>📱 Wallet Requirements</h3>
            <ul>
              <li>Phantom wallet browser extension or mobile app</li>
              <li>SOL balance for trading (devnet SOL for testing)</li>
              <li>Network set to Solana Devnet</li>
            </ul>
          </div>
        </section>
        
        <section className="help-section">
          <h2>Trading Guide</h2>
          <div className="help-item">
            <h3>💰 Creating a Sell Offer</h3>
            <ol>
              <li>Navigate to the SELL page</li>
              <li>Enter the amount of SOL you want to sell</li>
              <li>Select your preferred fiat currency (100+ supported)</li>
              <li>Choose a payment method (bank transfer, digital wallets, etc.)</li>
              <li>Review and confirm your offer</li>
              <li>Your SOL will be locked in escrow until trade completion</li>
            </ol>
          </div>
          
          <div className="help-item">
            <h3>🛒 Accepting a Buy Offer</h3>
            <ol>
              <li>Browse offers on the BUY page</li>
              <li>Filter by currency, payment method, or amount</li>
              <li>Click "Accept" on an offer that matches your needs</li>
              <li>Follow the payment instructions provided by the seller</li>
              <li>Confirm payment completion to receive your SOL</li>
            </ol>
          </div>
          
          <div className="help-item">
            <h3>⚖️ Dispute Resolution</h3>
            <p>If issues arise during a trade:</p>
            <ul>
              <li>Navigate to the DISPUTES page</li>
              <li>File a dispute with detailed evidence</li>
              <li>Community voting determines the outcome</li>
              <li>Fair resolution protects both buyers and sellers</li>
            </ul>
          </div>
        </section>
        
        <section className="help-section">
          <h2>Frequently Asked Questions</h2>
          <div className="help-item">
            <h3>❓ Common Questions</h3>
            <div className="faq-item">
              <strong>Q: What is Solana Devnet?</strong>
              <p>A: Devnet is Solana's development network for testing. It uses test SOL with no real value.</p>
            </div>
            
            <div className="faq-item">
              <strong>Q: How do I get devnet SOL for testing?</strong>
              <p>A: Use a Solana devnet faucet or contact the development team.</p>
            </div>
            
            <div className="faq-item">
              <strong>Q: Are my funds safe in escrow?</strong>
              <p>A: Yes, funds are held by audited smart contracts until trade completion.</p>
            </div>
            
            <div className="faq-item">
              <strong>Q: What payment methods are supported?</strong>
              <p>A: 100+ currencies with local payment options including bank transfers, digital wallets, and mobile payments.</p>
            </div>
            
            <div className="faq-item">
              <strong>Q: How long do trades take?</strong>
              <p>A: Most trades complete within 15-30 minutes depending on payment method.</p>
            </div>
          </div>
        </section>
        
        <section className="help-section">
          <h2>Technical Information</h2>
          <div className="help-item">
            <h3>🔧 Smart Contract Details</h3>
            <ul>
              <li><strong>Program ID:</strong> AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k</li>
              <li><strong>Network:</strong> Solana Devnet</li>
              <li><strong>Explorer:</strong> <a href="https://explorer.solana.com/address/AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k?cluster=devnet" target="_blank" rel="noopener noreferrer">View on Solana Explorer</a></li>
              <li><strong>Framework:</strong> Anchor 0.31.1</li>
            </ul>
          </div>
          
          <div className="help-item">
            <h3>🌐 Supported Networks</h3>
            <p>OpenSVM P2P Exchange supports multiple Solana Virtual Machine networks:</p>
            <ul>
              <li>Solana (Primary)</li>
              <li>Sonic</li>
              <li>Eclipse</li>
              <li>svmBNB</li>
              <li>s00n</li>
            </ul>
          </div>
        </section>
        
        <section className="help-section">
          <h2>Advanced Troubleshooting</h2>
          <div className="help-item">
            <h3>🔧 Connection Issues</h3>
            <div className="faq-item">
              <strong>Q: "All endpoints failed" error when trying to connect</strong>
              <p>A: This indicates network connectivity issues with Solana devnet. Try:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Refresh the page and retry</li>
                <li>Clear browser cache and cookies</li>
                <li>Try using a VPN if regional restrictions apply</li>
                <li>Check if your firewall is blocking WebSocket connections</li>
              </ul>
            </div>
            
            <div className="faq-item">
              <strong>Q: Wallet connection stuck on "Connecting to Smart Contract..."</strong>
              <p>A: This usually means the Solana program is unreachable. Solutions:</p>
              <ul>
                <li>Ensure you're connected to Solana Devnet (not Mainnet)</li>
                <li>Check that your wallet has devnet SOL for transaction fees</li>
                <li>Try disconnecting and reconnecting your wallet</li>
                <li>Refresh the page to reset the connection state</li>
              </ul>
            </div>

            <div className="faq-item">
              <strong>Q: Console shows wallet extension errors</strong>
              <p>A: Multiple wallet extensions can conflict. Try:</p>
              <ul>
                <li>Disable all wallet extensions except Phantom</li>
                <li>Use an incognito/private browser window</li>
                <li>Clear browser extension data and restart browser</li>
              </ul>
            </div>
          </div>
          
          <div className="help-item">
            <h3>🎨 Theme and Display Issues</h3>
            <div className="faq-item">
              <strong>Q: Theme not changing or UI looks broken</strong>
              <p>A: Theme switching is controlled from Profile Settings:</p>
              <ul>
                <li>Navigate to PROFILE page in the main navigation</li>
                <li>Scroll to "Interface Preferences" section</li>
                <li>Select your preferred theme from the dropdown</li>
                <li>Refresh the page if changes don't apply immediately</li>
              </ul>
            </div>

            <div className="faq-item">
              <strong>Q: Mobile layout appears broken</strong>
              <p>A: Ensure your browser supports modern CSS features:</p>
              <ul>
                <li>Update your mobile browser to the latest version</li>
                <li>Clear browser cache and reload the page</li>
                <li>Try rotating device orientation (portrait/landscape)</li>
                <li>Report the issue with your device/browser details</li>
              </ul>
            </div>
          </div>

          <div className="help-item">
            <h3>💰 Trading and Transaction Issues</h3>
            <div className="faq-item">
              <strong>Q: "Insufficient funds" error when creating offers</strong>
              <p>A: You need devnet SOL for transaction fees:</p>
              <ul>
                <li>Request devnet SOL from a Solana faucet</li>
                <li>Ensure you have at least 0.01 SOL for fees</li>
                <li>Check that you're on the correct network (Devnet)</li>
              </ul>
            </div>

            <div className="faq-item">
              <strong>Q: Payment methods don't show for my currency</strong>
              <p>A: Payment methods are region-specific:</p>
              <ul>
                <li>Select your local currency from the dropdown</li>
                <li>Payment methods will update automatically</li>
                <li>If your region isn't supported, try selecting a neighboring country's currency</li>
                <li>Contact support to request additional payment methods</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Developer Resources</h2>
          <div className="help-item">
            <h3>🔗 Important Links</h3>
            <ul>
              <li><strong>Smart Contract:</strong> <a href="https://explorer.solana.com/address/AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k?cluster=devnet" target="_blank" rel="noopener noreferrer">View on Solana Explorer</a></li>
              <li><strong>GitHub Repository:</strong> Source code and issue reporting</li>
              <li><strong>Devnet Faucet:</strong> <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">Get test SOL</a></li>
              <li><strong>Solana Documentation:</strong> <a href="https://docs.solana.com/" target="_blank" rel="noopener noreferrer">Learn about Solana</a></li>
            </ul>
          </div>

          <div className="help-item">
            <h3>📊 Network Status</h3>
            <p>Current network information:</p>
            <ul>
              <li><strong>Network:</strong> Solana Devnet</li>
              <li><strong>RPC Endpoint:</strong> https://api.devnet.solana.com</li>
              <li><strong>Program Version:</strong> v1.0.0 (Anchor 0.31.1)</li>
              <li><strong>Supported Wallets:</strong> Phantom, Solflare, Slope</li>
            </ul>
          </div>
        </section>

        <section className="help-section">
          <h2>Contact Support</h2>
          <div className="help-item">
            <h3>📞 Get Help</h3>
            <p>Need additional assistance? Our support team is here to help:</p>
            <ul>
              <li><strong>GitHub Issues:</strong> Report bugs or request features</li>
              <li><strong>Community Discord:</strong> Join our developer community</li>
              <li><strong>Documentation:</strong> Comprehensive guides and API reference</li>
              <li><strong>Email Support:</strong> Contact the development team</li>
            </ul>
            
            <div className="support-notice">
              <p><strong>⚠️ Development Notice:</strong> This is a development version running on Solana Devnet. Do not use real funds.</p>
            </div>
          </div>
          
          <div className="help-item">
            <h3>🐛 Reporting Issues</h3>
            <p>When reporting issues, please include:</p>
            <ul>
              <li>Your browser type and version</li>
              <li>Steps to reproduce the problem</li>
              <li>Console error messages (if any)</li>
              <li>Screenshots of the issue</li>
              <li>Your wallet type and connection status</li>
            </ul>
          </div>
        </section>
      </div>
      
      <style jsx>{`
        .help-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-6, 24px);
        }
        
        .help-section {
          background-color: var(--card-bg);
          border: var(--border-width, 1px) solid var(--border-color);
          border-radius: var(--border-radius, 0px);
          padding: var(--spacing-4, 16px);
        }
        
        .help-section h2 {
          color: var(--text-primary);
          font-size: var(--font-size-lg, 16px);
          font-weight: var(--font-weight-bold, 700);
          margin-bottom: var(--spacing-3, 12px);
          border-bottom: var(--border-width, 1px) solid var(--border-color);
          padding-bottom: var(--spacing-2, 8px);
        }
        
        .help-item {
          margin-bottom: var(--spacing-4, 16px);
        }
        
        .help-item:last-child {
          margin-bottom: 0;
        }
        
        .help-item h3 {
          color: var(--text-primary);
          font-size: var(--font-size-base, 14px);
          font-weight: var(--font-weight-medium, 500);
          margin-bottom: var(--spacing-2, 8px);
        }
        
        .help-item p,
        .help-item li {
          color: var(--text-secondary);
          font-size: var(--font-size-sm, 12px);
          line-height: 1.5;
        }
        
        .help-item ul,
        .help-item ol {
          margin: var(--spacing-2, 8px) 0;
          padding-left: var(--spacing-4, 16px);
        }
        
        .help-item li {
          margin-bottom: var(--spacing-1, 4px);
        }
        
        .faq-item {
          margin-bottom: var(--spacing-3, 12px);
          padding: var(--spacing-3, 12px);
          background-color: var(--secondary-bg);
          border-radius: var(--border-radius, 0px);
        }
        
        .faq-item strong {
          color: var(--text-primary);
          display: block;
          margin-bottom: var(--spacing-1, 4px);
        }
        
        .faq-item p {
          margin: 0;
        }
        
        .support-notice {
          margin-top: var(--spacing-4, 16px);
          padding: var(--spacing-3, 12px);
          background-color: var(--secondary-bg);
          border: var(--border-width, 1px) solid var(--warning-color);
          border-radius: var(--border-radius, 0px);
        }
        
        .support-notice p {
          margin: 0;
          color: var(--warning-color);
          font-weight: var(--font-weight-medium, 500);
        }
        
        a {
          color: var(--accent-color);
          text-decoration: underline;
        }
        
        a:hover {
          color: var(--text-primary);
        }
        
        @media (max-width: 768px) {
          .help-section {
            padding: var(--spacing-3, 12px);
          }
          
          .help-item ul,
          .help-item ol {
            padding-left: var(--spacing-3, 12px);
          }
        }
      `}</style>
    </div>
  );
}