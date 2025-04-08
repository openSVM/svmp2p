# Installation and Setup Guide

## Overview
This document provides detailed instructions for installing, configuring, and running the SVMP2P platform. It covers both development and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Production Environment Setup](#production-environment-setup)
- [Configuration Options](#configuration-options)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing SVMP2P, ensure you have the following prerequisites:

### System Requirements
- **Operating System**: Linux, macOS, or Windows
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space minimum

### Software Requirements
- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **Git**: Any recent version
- **Solana CLI Tools**: Latest version (for development)
- **Rust**: Latest stable version (for smart contract development)

### Wallet Requirements
- A Solana wallet (Phantom, Solflare, etc.)
- Some SOL for transaction fees
- Testnet SOL for development (can be obtained from faucets)

## Development Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/openSVM/svmp2p.git
cd svmp2p
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Start the Development Server
```bash
npm run dev
```

This will start the development server at `http://localhost:3000`.

### 5. Set Up Solana Development Environment (Optional)
If you want to work on the smart contracts:

1. Install Rust and Cargo:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install Solana CLI tools:
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.10.0/install)"
```

3. Set up a local Solana validator:
```bash
solana-test-validator
```

4. Build the Solana program:
```bash
cd programs/p2p-exchange
cargo build-bpf
```

5. Deploy the program to your local validator:
```bash
solana program deploy ./target/deploy/p2p_exchange.so
```

### 6. Run Tests
```bash
# Run frontend tests
npm test

# Run smart contract tests
cd programs/p2p-exchange
cargo test-bpf
```

## Production Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/openSVM/svmp2p.git
cd svmp2p
```

### 2. Install Dependencies
```bash
npm install --production
```

### 3. Set Up Environment Variables
Create a `.env` file with production settings:
```bash
cp .env.example .env.production
```

Edit the `.env.production` file with your production configuration.

### 4. Build the Application
```bash
npm run build
```

### 5. Start the Production Server
```bash
npm run start
```

### 6. Using Docker (Alternative)
If you prefer using Docker:

1. Build the Docker image:
```bash
docker build -t svmp2p .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env.production svmp2p
```

### 7. Deployment Options

#### Vercel Deployment
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

#### AWS Deployment
1. Install AWS CLI and configure credentials
2. Deploy using AWS Amplify:
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

## Configuration Options

### Frontend Configuration
The frontend configuration is managed through environment variables and the `config.js` file.

#### config.js
Located at `src/config.js`, this file contains default configuration values:

```javascript
export default {
  // API endpoints
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // Solana network
  solanaNetwork: process.env.REACT_APP_SOLANA_NETWORK || 'devnet',
  
  // Program IDs
  programId: process.env.REACT_APP_PROGRAM_ID || 'your_program_id',
  
  // Feature flags
  enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // UI configuration
  theme: process.env.REACT_APP_THEME || 'light',
  
  // Transaction settings
  confirmationTimeout: parseInt(process.env.REACT_APP_CONFIRMATION_TIMEOUT || '60000'),
  maxRetries: parseInt(process.env.REACT_APP_MAX_RETRIES || '3'),
};
```

### Smart Contract Configuration
Smart contract configuration is managed through the `Anchor.toml` file.

#### Anchor.toml
```toml
[programs.localnet]
p2p_exchange = "your_program_id"

[programs.devnet]
p2p_exchange = "your_program_id"

[programs.mainnet]
p2p_exchange = "your_program_id"

[registry]
url = "https://anchor.projectserum.com"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

## Environment Variables

### Frontend Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000` |
| `REACT_APP_SOLANA_NETWORK` | Solana network to connect to | `devnet` |
| `REACT_APP_PROGRAM_ID` | Solana program ID | - |
| `REACT_APP_ENABLE_NOTIFICATIONS` | Enable notification system | `true` |
| `REACT_APP_ENABLE_ANALYTICS` | Enable analytics tracking | `false` |
| `REACT_APP_THEME` | Default theme (light/dark) | `light` |
| `REACT_APP_CONFIRMATION_TIMEOUT` | Transaction confirmation timeout (ms) | `60000` |
| `REACT_APP_MAX_RETRIES` | Maximum transaction retry attempts | `3` |

### Backend Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `DATABASE_URL` | MongoDB connection string | - |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `SOLANA_RPC_URL` | Solana RPC URL | - |
| `PROGRAM_ID` | Solana program ID | - |

## Troubleshooting

### Common Issues and Solutions

#### Installation Issues

**Problem**: `npm install` fails with dependency errors.
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Try installing with legacy peer deps
npm install --legacy-peer-deps
```

**Problem**: Solana CLI tools installation fails.
**Solution**: 
```bash
# Try manual installation
mkdir -p ~/.local/share/solana/install
curl -sSf https://raw.githubusercontent.com/solana-labs/solana/v1.10.0/install/solana-install-init.sh | sh
```

#### Development Server Issues

**Problem**: Development server fails to start.
**Solution**: 
```bash
# Check for port conflicts
lsof -i :3000
# Kill process if needed
kill -9 <PID>

# Try with different port
PORT=3001 npm run dev
```

**Problem**: Hot reloading not working.
**Solution**: 
```bash
# Restart the development server
npm run dev -- --reset-cache
```

#### Smart Contract Issues

**Problem**: Smart contract build fails.
**Solution**: 
```bash
# Update Rust
rustup update

# Clean build artifacts
cargo clean

# Try building again
cargo build-bpf
```

**Problem**: Smart contract deployment fails.
**Solution**: 
```bash
# Check Solana validator status
solana cluster-version

# Ensure you have enough SOL
solana balance

# Try with explicit RPC URL
solana program deploy ./target/deploy/p2p_exchange.so --url http://localhost:8899
```

#### Wallet Connection Issues

**Problem**: Wallet not connecting.
**Solution**: 
- Ensure wallet extension is installed and unlocked
- Check if you're on the correct network
- Try a different browser
- Clear browser cache and cookies

**Problem**: Transactions failing.
**Solution**: 
- Ensure you have enough SOL for transaction fees
- Check that you're connected to the correct network
- Increase transaction timeout in config
- Check browser console for specific error messages

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/openSVM/svmp2p/issues) for similar problems
2. Join our [Discord community](https://discord.gg/opensvm) for real-time support
3. Submit a detailed bug report if it's a new issue

When reporting issues, please include:
- Operating system and version
- Node.js and npm versions
- Browser type and version
- Error messages and stack traces
- Steps to reproduce the issue
