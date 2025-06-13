# OpenSVM P2P Exchange

A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks (Solana, Sonic, Eclipse, svmBNB, and s00n).

## Features

- **Multi-Network Support**: Trade across multiple SVM networks from a single interface
- **Network-Specific Information**: View confirmation times, gas fees, and other network details
- **Progressive Web App (PWA)**: Install and use offline with enhanced mobile performance
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Wallet Integration**: Connect with popular Solana wallets (Phantom, Solflare, etc.)
- **Secure Trading**: Escrow-based P2P trading system
- **Offline Functionality**: Queue actions when offline, sync when reconnected
- **Tokenized Loyalty System**: Earn reward tokens through trading and governance participation
- **Dispute Resolution**: Community-driven dispute resolution with juror voting
- **User Reputation**: Comprehensive reputation tracking system

## Technologies Used

- Next.js 14 (Server-Side Rendering)
- React 18
- CSS3 with responsive design
- JavaScript (ES6+)
- Solana Web3.js and Wallet Adapters
- SVG for network logos and icons
- **PWA Technologies**: Service Workers, Web App Manifest, Background Sync
- **Offline Storage**: IndexedDB and Cache API

## Next.js Architecture

- The application uses a standard Next.js architecture with SSR (Server-Side Rendering)
- The project structure follows Next.js conventions with `/pages`, `/components`, and `/contexts`
- Page layouts are applied consistently using the Layout component in `_app.js`
- Dynamic imports with `{ ssr: false }` are used for client-side only components

## Important CSS Notes

- When using CSS `@import` rules, they **must** be placed at the top of the stylesheet, before any other CSS rules or declarations.
- Each `@import` rule should be on its own line with proper formatting and semicolons.
- Add extra line breaks between imports and the first CSS rule to ensure proper parsing.
- Next.js enforces this CSS standard strictly, whereas some other build systems might be more forgiving.
- Only `@charset` and `@layer` declarations can precede `@import` rules.
- The main stylesheet is at `src/styles/globals.css` which imports styles from the public directory.
- Example of correct formatting:
  ```css
  @import "/path/to/file.css";
  
  @import "/path/to/another.css";
  
  /* First CSS rule after imports */
  :root { ... }
  ```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Run the development server: `npm run dev`
4. Connect your wallet to start trading

## 📱 Progressive Web App (PWA)

The OpenSVM P2P Exchange is a fully-featured Progressive Web App that works seamlessly online and offline.

### PWA Features

- **🚀 Installable**: Add to home screen on mobile and desktop
- **📴 Offline Mode**: Core functionality works without internet
- **🔄 Background Sync**: Actions sync automatically when reconnected
- **⚡ Fast Loading**: Optimized caching for instant app startup
- **📱 App-like Experience**: Full-screen standalone mode

### Installation

**Desktop (Chrome/Edge):**
1. Click the install button in the app or address bar
2. Follow the installation prompt

**Mobile (iOS Safari):**
1. Tap the Share button
2. Select "Add to Home Screen"

**Mobile (Android Chrome):**
1. Tap the "Install" banner or menu option
2. Confirm installation

### Offline Usage

When offline, the app will:
- Show cached content and previous data
- Queue transactions and profile updates
- Display offline indicator with pending action count
- Automatically sync queued actions when connection returns

For detailed PWA implementation information, see [PWA Documentation](docs/pwa-implementation.md).

## 📚 Documentation

### API Documentation
Comprehensive API and smart contract documentation is available:

- **[Complete API Reference](docs/api/README.md)** - Main API documentation hub
- **[Smart Contract API](docs/api/smart-contracts.md)** - Detailed smart contract instructions
- **[Wallet Operations](docs/api/wallet-operations.md)** - Wallet integration patterns
- **[Account Structures](docs/api/account-structures.md)** - Data structure specifications
- **[Error Codes](docs/api/error-codes.md)** - Error handling reference
- **[Transaction Flows](docs/api/transaction-flows.md)** - Implementation examples
- **[API Changelog](docs/api/CHANGELOG.md)** - Version history and updates

### Quick Start Guides
- **[Examples Directory](docs/api/examples/)** - Ready-to-use code examples
- **[Installation Guide](docs/installation-guide.md)** - Detailed setup instructions
- **[Contributing Guide](docs/contributing.md)** - Development workflow

### Developer Resources
- **Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`
- **Documentation Version**: 1.0.0
- **API Support**: Full smart contract and wallet integration coverage

## Requirements

- Node.js >= 18.17.0 (required by Next.js 14)

## Mobile Responsiveness

The exchange is fully responsive and works on all device sizes:
- Mobile phones (375px and up)
- Tablets (768px and up)
- Desktops (1024px and up)

## Network Support

- **Solana**: The original high-performance blockchain
- **Sonic**: Gaming and NFT-focused SVM network
- **Eclipse**: Cross-chain applications SVM network
- **svmBNB**: BNB Chain integration with SVM
- **s00n**: Ultra-fast optimistic rollup SVM network

## Tokenized Loyalty System

The platform features a comprehensive reward system that incentivizes user engagement:

### Earning Rewards
- **Trading Rewards**: Earn tokens for every successful trade completion
- **Governance Rewards**: Get paid for participating in dispute resolution as a juror
- **Volume Thresholds**: Minimum trade volumes ensure quality over quantity

### Using Rewards
- **Real-time Tracking**: Monitor your earnings in the dedicated Rewards dashboard
- **Instant Claiming**: Claim your accumulated rewards at any time
- **Future Utility**: Tokens will enable fee discounts, governance voting, and exclusive features

### Key Features
- **Fair Distribution**: Both buyers and sellers earn equal rewards
- **Anti-abuse Protection**: Multiple safeguards prevent gaming the system
- **Transparent Progress**: Clear indicators show your path to next rewards

For detailed tokenomics information, see [docs/tokenomics-design.md](docs/tokenomics-design.md).

## License

MIT

## Contact

For more information, visit [OpenSVM](https://opensvm.com)
