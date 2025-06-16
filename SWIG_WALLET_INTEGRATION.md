# Swig Wallet Integration

This document describes the replacement of Solana wallet adapter with Swig wallet integration.

## Overview

The application has been updated to use Swig wallet instead of traditional Solana wallet adapter. This provides OAuth-based authentication and in-app wallet creation, making it easier for users to get started without needing to install browser extensions.

## Key Changes

### Dependencies

**Removed:**
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-wallets`
- `@solana/wallet-adapter-base`

**Added:**
- `@getpara/web-sdk`
- `@swig-wallet/classic`
- `@swig-wallet/coder`
- `@noble/curves`
- `@noble/hashes`

### Components

1. **SwigWalletProvider** - Replaces `SafeWalletProvider`
   - Provides OAuth authentication
   - Manages wallet state
   - Supports both Solana (Ed25519) and EVM (Secp256k1) wallets

2. **SwigWalletButton** - Replaces `WalletMultiButton`
   - Shows authentication modal
   - Handles OAuth login flow
   - Compatible interface with existing code

3. **OAuthButtons** - New component
   - Provides OAuth login options (Google, Apple, Farcaster)
   - Handles authentication flow

### Authentication Flow

1. User clicks "Connect Wallet"
2. Authentication modal opens with OAuth options
3. User selects OAuth provider (Google, Apple, or Farcaster)
4. User completes OAuth flow in popup window
5. Para SDK creates or accesses existing wallet
6. Application receives wallet connection confirmation

### Wallet Types

- **Solana (Ed25519)** - Traditional Solana wallets
- **EVM (Secp256k1)** - Ethereum-compatible wallets

Users can switch between wallet types in their settings.

## Environment Setup

### Required Environment Variables

```bash
# Para SDK API Key (required)
NEXT_PUBLIC_PARA_API_KEY=your_para_api_key_here

# Alternative fallback
PARA_API_KEY=your_para_api_key_here
```

### Getting a Para API Key

1. Visit [Para SDK](https://para.build/)
2. Sign up for an account
3. Create a new application
4. Copy your API key
5. Add it to your `.env.local` file

## Migration Guide

### For Developers

The Swig wallet integration maintains backward compatibility:

```javascript
// Old way (still works)
import { useSafeWallet } from '../contexts/WalletContextProvider';

// New way (recommended)
import { useSwigWallet } from '../contexts/SwigWalletProvider';

// Both provide the same interface:
const { connected, publicKey, connect, disconnect } = useSwigWallet();
```

### For Users

- No wallet extension installation required
- Sign in with existing accounts (Google, Apple, Farcaster)
- Seamless wallet creation and management
- Multi-chain support (Solana and EVM)

## Features

### OAuth Authentication
- Google OAuth
- Apple OAuth  
- Farcaster OAuth
- Secure popup-based flow

### Wallet Management
- Automatic wallet creation
- Multi-chain support
- Secure key management
- Session persistence

### Error Handling
- Comprehensive error messages
- Automatic retry logic
- Graceful fallbacks
- User-friendly troubleshooting

## Troubleshooting

### Common Issues

1. **"Para API key not found" error**
   - Solution: Add `NEXT_PUBLIC_PARA_API_KEY` to your environment variables

2. **OAuth popup blocked**
   - Solution: Allow popups for the application domain

3. **Authentication fails**
   - Solution: Check network connection and try different OAuth provider

### Development Mode

In development without a Para API key, the application will use mock wallet functions that return safe default values. This allows development to continue without requiring API key setup.

## Security

- OAuth flows are handled by Para SDK
- Private keys never leave Para's secure infrastructure
- Application only receives public keys and signatures
- All transactions require user approval

## Testing

The integration includes comprehensive tests for:
- Wallet provider functionality
- OAuth authentication flow
- Component rendering
- Error handling
- Backward compatibility

Run tests with:
```bash
npm test src/tests/swig-wallet-integration.test.js
```

## API Reference

See [wallet-operations.md](./docs/api/wallet-operations.md) for detailed API documentation.