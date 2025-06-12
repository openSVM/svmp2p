# SVMP2P Documentation

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Frontend Components](#frontend-components)
- [Smart Contract Integration](#smart-contract-integration)
- [User Guides](#user-guides)
- [Developer Guides](#developer-guides)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Security](#security)
- [FAQ](#faq)

## Introduction
SVMP2P is a decentralized peer-to-peer exchange platform built on the Solana blockchain. It enables users to trade digital assets directly with each other without intermediaries, using smart contracts to ensure secure and trustless transactions.

### Purpose
This documentation provides comprehensive information about the SVMP2P platform, including how to use it, how it works, and how to contribute to its development.

### Key Features
- Decentralized peer-to-peer trading
- Smart contract-based escrow system
- Reputation and feedback system
- Dispute resolution mechanism
- Mobile-responsive design
- Real-time notifications
- User-friendly guided workflows

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Solana CLI tools (for development)
- A Solana wallet (Phantom, Solflare, etc.)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/openSVM/svmp2p.git
   cd svmp2p
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Quick Start Guide
1. Connect your Solana wallet using the "Connect Wallet" button
2. Browse available offers or create your own
3. Follow the guided workflow to complete a trade
4. Check your transaction history in your profile

## Architecture Overview

### System Components
The SVMP2P platform consists of the following main components:

1. **Frontend Application**: React-based web application
2. **Solana Smart Contracts**: On-chain logic for trades and escrow
3. **Backend Services**: API endpoints for non-blockchain operations
4. **Database**: Stores user profiles, offer metadata, and platform statistics

### Data Flow
1. User actions in the frontend trigger API calls or blockchain transactions
2. Smart contracts handle the escrow logic, funds transfer, and dispute resolution
3. Backend services manage user profiles, notifications, and platform metrics
4. The frontend updates in real-time based on blockchain events and API responses

### Technology Stack
- **Frontend**: React, JavaScript, CSS
- **Smart Contracts**: Rust, Solana Program Library
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Solana

## Frontend Components

### Core Components
- **OfferCreation**: Allows users to create new trading offers
- **OfferList**: Displays available offers with filtering options
- **UserProfile**: Shows user information, reputation, and transaction history
- **DisputeResolution**: Interface for handling trade disputes
- **NotificationCenter**: Manages system notifications and alerts

### UI/UX Features
- **Responsive Design**: Adapts to different screen sizes and devices
- **Theme System**: Consistent visual design across the application
- **Guided Workflows**: Step-by-step processes for common actions
- **Loading States**: Visual feedback during transactions and data loading
- **Toast Notifications**: Temporary notifications for important events

### State Management
The application uses React Context API for state management, with separate contexts for:
- Authentication
- Notifications
- Wallet Connection
- Transaction Status

## Smart Contract Integration

### Contract Structure
The Solana program consists of several key components:
- **Offer Management**: Creating, updating, and canceling offers
- **Escrow System**: Secure holding of funds during trades
- **Dispute Resolution**: Handling conflicts between traders
- **Reputation System**: Tracking user feedback and reliability

### Transaction Flow
1. **Offer Creation**: Seller creates an offer with terms and conditions
2. **Offer Acceptance**: Buyer accepts the offer, funds are escrowed
3. **Trade Completion**: Both parties confirm successful trade
4. **Fund Release**: Escrowed funds are released to the seller
5. **Dispute Resolution**: If issues arise, a resolution process is initiated

### Security Measures
- Time-locked transactions
- Multi-signature requirements for critical operations
- Rate limiting to prevent spam
- Validation checks for all inputs

## User Guides

### Creating an Offer
1. Navigate to the "Create Offer" page
2. Fill in the required details:
   - Asset type
   - Amount
   - Price
   - Payment methods
   - Trade terms
3. Review and submit your offer
4. Your offer will now be visible to potential buyers

### Accepting an Offer
1. Browse the offer list and find a suitable offer
2. Click on the offer to view details
3. Click "Accept Offer" to start the trade
4. Follow the guided workflow to complete the transaction
5. Confirm receipt of assets to release funds from escrow

### Managing Your Profile
1. Click on your profile icon in the top right corner
2. View your transaction history and reputation score
3. Update your profile settings and preferences
4. Set up notification preferences
5. View and manage active trades

### Handling Disputes
1. If an issue arises during a trade, click "Open Dispute"
2. Provide details about the problem
3. Submit evidence to support your case
4. Wait for the resolution process
5. Follow the resolution decision

## Developer Guides

### Setting Up the Development Environment
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Building and Testing
1. Run tests:
   ```bash
   npm test
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Run linting:
   ```bash
   npm run lint
   ```

### Adding New Features
1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature
3. Write tests for your feature
4. Submit a pull request

### Smart Contract Development
1. Set up Solana development environment
2. Navigate to the `programs/p2p-exchange` directory
3. Make changes to the Rust code
4. Build the program:
   ```bash
   cargo build-bpf
   ```
5. Test the program:
   ```bash
   cargo test-bpf
   ```

## API Reference

### 📚 Comprehensive API Documentation

We provide extensive API documentation for developers integrating with SVMP2P:

#### **[Complete API Documentation Hub](api/README.md)**
Central hub for all API documentation with version information and navigation.

#### Core API References
- **[Smart Contract API](api/smart-contracts.md)** - Complete instruction reference with parameters, behaviors, and examples
- **[Account Structures](api/account-structures.md)** - Detailed account specifications and TypeScript interfaces
- **[Wallet Operations](api/wallet-operations.md)** - Wallet connection, transaction signing, and security patterns
- **[Error Codes](api/error-codes.md)** - Complete error reference with recovery strategies
- **[Events](api/events.md)** - Smart contract event monitoring and handling
- **[Transaction Flows](api/transaction-flows.md)** - End-to-end implementation examples

#### Developer Resources
- **[Code Examples](api/examples/)** - Ready-to-use TypeScript examples
- **[API Changelog](api/CHANGELOG.md)** - Version history and migration guides
- **Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`
- **Current API Version**: 1.0.0

### Legacy Documentation
- **[Basic Smart Contract API](smart-contract-api.md)** - Basic API overview (see comprehensive docs above)
- **[Frontend Components](frontend-components.md)** - UI component documentation
- **[Enhanced Reward System](enhanced-reward-system.md)** - Reward system details

### Quick Start Examples

#### Creating an Offer (TypeScript)
```typescript
import { Program, BN } from '@coral-xyz/anchor';
import { createAndListOffer } from './api/examples/basic-trading/create-offer';

const result = await createAndListOffer(program, seller, {
  amount: new BN(1 * LAMPORTS_PER_SOL), // 1 SOL
  fiatAmount: new BN(50000), // $500.00 in cents
  currency: 'USD',
  paymentMethod: 'Bank transfer - Chase Bank'
});
```

#### Wallet Connection
```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const { connect, connected, publicKey } = useWallet();

const handleConnect = async () => {
  try {
    await connect();
    console.log('Connected:', publicKey?.toString());
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

For complete examples and advanced patterns, see the [examples directory](api/examples/).

## Troubleshooting

### Common Issues

#### Wallet Connection Problems
- Make sure your wallet extension is installed and unlocked
- Try refreshing the page
- Check if you're on the correct network (Mainnet, Devnet, etc.)

#### Transaction Failures
- Ensure you have enough SOL for transaction fees
- Check that you have sufficient funds for the trade
- Verify that the transaction parameters are correct

#### UI Display Issues
- Clear your browser cache
- Try a different browser
- Check if your browser is up to date

### Error Codes
- **E001**: Wallet connection failed
- **E002**: Insufficient funds
- **E003**: Transaction rejected
- **E004**: Network error
- **E005**: Smart contract error

### Getting Help
If you encounter issues not covered in this documentation:
1. Check the GitHub issues for similar problems
2. Join our Discord community for real-time support
3. Submit a detailed bug report if it's a new issue

## Contributing

### Code Contribution Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

### Code Style
- Follow the existing code style
- Use meaningful variable and function names
- Write comments for complex logic
- Include JSDoc comments for public APIs

### Testing Requirements
- All new features must include tests
- Maintain or improve code coverage
- Tests should be meaningful, not just for coverage

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Get at least one code review
4. Address review comments
5. Wait for CI/CD pipeline to pass

## Security

### Security Features
- Smart contract audits
- Secure escrow system
- Rate limiting
- Input validation
- Secure authentication

### Reporting Security Issues
If you discover a security vulnerability:
1. Do NOT open a public GitHub issue
2. Email security@opensvm.com with details
3. Allow time for the issue to be addressed before disclosure

### Best Practices for Users
- Use a hardware wallet for large transactions
- Never share your private keys or seed phrase
- Verify all transaction details before signing
- Start with small trades to build trust

## FAQ

### General Questions

#### What is SVMP2P?
SVMP2P is a decentralized peer-to-peer exchange platform built on the Solana blockchain, allowing users to trade digital assets directly with each other.

#### How does the escrow system work?
When a buyer accepts an offer, funds are locked in a smart contract escrow. Once both parties confirm the trade is complete, the funds are released to the seller.

#### Is SVMP2P custodial?
No, SVMP2P is non-custodial. We never hold your funds or private keys. All trades happen directly between users through smart contracts.

### Trading Questions

#### How are disputes resolved?
Disputes are handled through a combination of automated rules and, if necessary, community governance voting.

#### What fees does SVMP2P charge?
SVMP2P charges a small fee (0.5%) on completed trades to support platform development and maintenance.

#### How is my reputation calculated?
Your reputation score is based on successful trades, feedback from trading partners, and account age.

### Technical Questions

#### Which wallets are supported?
SVMP2P supports Phantom, Solflare, Sollet, and other Solana-compatible wallets.

#### Can I use SVMP2P on mobile?
Yes, SVMP2P has a responsive design that works on mobile devices. We also plan to release native mobile apps in the future.

#### Is the code open source?
Yes, SVMP2P is fully open source. You can view and contribute to the code on GitHub.
