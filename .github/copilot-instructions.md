# OpenSVM P2P Exchange - Copilot Instructions

OpenSVM P2P Exchange is a Next.js-based Progressive Web App (PWA) for peer-to-peer cryptocurrency trading across Solana Virtual Machine networks (Solana, Sonic, Eclipse, svmBNB, s00n). The platform includes a React 19.1.1 frontend, Solana smart contracts built with Anchor 0.31.1, and comprehensive testing infrastructure.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Environment Preinstallation

For optimal Copilot agent performance, consider setting up preinstalled tools in your development environment using one of these approaches:

### Option 1: Development Container (Recommended)
Create `.devcontainer/devcontainer.json` to preinstall all dependencies:

```json
{
  "name": "OpenSVM P2P Exchange",
  "image": "mcr.microsoft.com/devcontainers/rust:1-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "18",
      "nodeGypDependencies": true
    },
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "installOhMyZsh": true,
      "upgradePackages": true
    }
  },
  "postCreateCommand": "bash .devcontainer/setup.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss"
      ]
    }
  },
  "forwardPorts": [3000, 8899]
}
```

Create `.devcontainer/setup.sh`:
```bash
#!/bin/bash
set -e

# Install system dependencies
sudo apt-get update && sudo apt-get install -y libudev-dev libssl-dev pkg-config build-essential

# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Install and use Anchor 0.31.1
avm install 0.31.1 && avm use 0.31.1

# Install Node.js dependencies
npm install --legacy-peer-deps

echo "✅ Development environment setup complete!"
```

### Option 2: GitHub Codespaces Configuration
Create `.devcontainer/devcontainer.json` for Codespaces with preinstalled tools:

```json
{
  "name": "OpenSVM P2P Exchange Codespace",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18-bullseye",
  "features": {
    "ghcr.io/devcontainers/features/rust:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "bash .devcontainer/setup-codespaces.sh",
  "remoteUser": "node"
}
```

### Option 3: Manual Environment Setup
If devcontainer is not available, follow the manual steps below, but expect longer setup times.

### Benefits of Preinstallation
Using preinstalled environments provides several advantages:
- **Faster agent startup**: No need to install Rust, Anchor, or system dependencies
- **Consistent environment**: Same setup across all development sessions
- **Reduced timeout risks**: Eliminates long-running installation commands
- **Better reliability**: Pre-validated tool versions and configurations
- **Immediate productivity**: Agent can start working on code immediately

### Using the Development Container
To use the preinstalled environment:

1. **With GitHub Codespaces**: Click "Code" → "Create codespace" (environment auto-configures)
2. **With VS Code**: Install "Dev Containers" extension, then "Reopen in Container"
3. **With GitHub Copilot**: The devcontainer will be automatically detected and used

The setup script runs automatically and takes ~3-5 minutes to complete all installations.

## Working Effectively

### Prerequisites and System Setup (Manual Fallback)
**Use this section only if preinstallation options above are not available.**

**Install required system dependencies first:**
```bash
sudo apt-get update && sudo apt-get install -y libudev-dev libssl-dev pkg-config build-essential
```

### Bootstrap and Build Process
**Follow these steps in exact order:**

1. **Install Dependencies** (NEVER CANCEL - takes up to 90 seconds):
   ```bash
   npm install --legacy-peer-deps
   ```
   - CRITICAL: Must use `--legacy-peer-deps` flag due to React 19.1.1 peer dependency conflicts
   - Takes ~47 seconds, set timeout to 120+ seconds minimum
   - Will show deprecation warnings - this is normal

2. **Build Application** (NEVER CANCEL - takes up to 60 minutes):
   ```bash
   npm run build
   ```
   - Takes ~31 seconds for clean build, but can take much longer with complex dependencies
   - Set timeout to 3600+ seconds (60+ minutes) minimum
   - Creates optimized production build in `build/` directory

3. **Install Solana Development Tools** (NEVER CANCEL - takes up to 180 seconds):
   ```bash
   # Install Anchor Version Manager
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   # Add to PATH (critical step)
   echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
   # Install and use Anchor 0.31.1
   avm install 0.31.1 && avm use 0.31.1
   ```
   - AVM installation takes ~77 seconds plus system dependency installation
   - Set timeout to 300+ seconds minimum
   - PATH configuration is critical for Anchor commands to work

4. **Build Solana Program** (NEVER CANCEL - takes up to 60 seconds):
   ```bash
   cd programs/p2p-exchange && cargo check
   ```
   - Takes ~28 seconds for compilation check
   - Set timeout to 120+ seconds minimum
   - Will show warnings about deprecated modules - this is expected
   - Returns to repository root: `cd ../..`

### Development Workflow

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - Starts in ~1.2 seconds
   - Available at http://localhost:3000
   - Includes hot reloading and React DevTools

2. **Run Tests** (NEVER CANCEL - takes up to 45 minutes):
   ```bash
   npm test
   ```
   - Takes ~31 seconds but some tests fail due to missing API mocks
   - Set timeout to 2700+ seconds (45+ minutes) minimum
   - Known failures: Solana TextEncoder issues, missing API modules
   - Test failures are expected in current state

3. **Lint Code:**
   ```bash
   npm run lint
   ```
   - Takes ~5 seconds
   - Known issue: Parse error in `src/components/profile/ProfileSettings_backup.js`
   - Shows React Hooks warnings - these are non-blocking

4. **Run E2E Tests:**
   ```bash
   npm run test:e2e
   ```
   - Takes ~4 seconds in CI mode
   - Automatically kills development server on port 3000
   - Uses external server configuration

### Production Deployment
```bash
npm run build && npm run start
```
- Must build first before starting production server
- Production server starts instantly once build exists

## Validation Requirements

**ALWAYS run through this complete validation scenario after making changes:**

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Manual UI Validation:**
   - Navigate to http://localhost:3000
   - Verify page loads with title "OpenSVM P2P Exchange"
   - Check navigation elements present: BUY, SELL, ANALYTICS, HELP, PROFILE
   - Confirm theme selector shows current theme
   - Verify network selector shows "Solana"
   - Check language selector shows "🇺🇸 EN"
   - Verify wallet connect button shows "CONNECT PHANTOM"
   - Confirm main content area loads (may show "Loading..." initially)

3. **PWA Functionality Check:**
   - Open browser console
   - Verify "Service Worker registered successfully" message appears
   - Confirm no critical JavaScript errors

4. **Build Validation:**
   ```bash
   npm run build
   ```
   - Must complete without errors
   - Verify static export completes successfully

5. **Solana Program Validation:**
   ```bash
   cd programs/p2p-exchange && cargo check && cd ../..
   ```
   - Must compile successfully (warnings are acceptable)

## Common Tasks and Outputs

### Repository Structure
```
.
├── README.md
├── package.json                 # Dependencies and scripts
├── next.config.js              # Next.js PWA configuration  
├── Anchor.toml                 # Solana program configuration
├── .devcontainer/              # Development container setup
│   ├── devcontainer.json       # VS Code devcontainer config
│   └── setup.sh               # Environment setup script
├── programs/p2p-exchange/      # Rust smart contracts
├── src/                        # React frontend source
├── public/                     # Static assets
├── scripts/                    # Build and test scripts
├── tests/                      # Comprehensive test suites
├── docs/                       # API and developer documentation
└── .github/workflows/          # CI/CD pipelines
```

### Key Package.json Scripts
```bash
npm run dev                     # Development server
npm run build                   # Production build  
npm run start                   # Production server
npm run lint                    # ESLint checking
npm test                        # Jest unit tests
npm run test:e2e               # Puppeteer E2E tests
npm run test:comprehensive     # Full test suite (requires Solana validator)
npm run performance           # Bundle analysis
```

### Anchor Configuration (Anchor.toml)
- Program ID: `ASU1Gjmx9XMwErZumic9DNTADYzKphtEd1Zy4BFwSpnk`
- Target: Solana devnet
- Anchor version: 0.31.1
- Cluster: devnet by default

## Critical Warnings and Timeouts

### Build Commands - NEVER CANCEL
- **npm install**: Set timeout to 120+ seconds (observed: 47s)
- **npm run build**: Set timeout to 3600+ seconds (observed: 31s, but can take 45+ minutes)
- **npm test**: Set timeout to 2700+ seconds (observed: 31s, but can take 45+ minutes)
- **cargo install avm**: Set timeout to 300+ seconds (observed: 77s + deps)
- **cargo check**: Set timeout to 120+ seconds (observed: 28s)

### Known Issues to Document
- Linting fails on `ProfileSettings_backup.js` with parse error
- Some unit tests fail due to missing Solana TextEncoder polyfills
- Comprehensive test suite requires local Solana validator
- Must use `--legacy-peer-deps` flag for npm install
- System dependencies required for Anchor installation

## Technology Stack

### Frontend
- **Next.js 15.4.6**: React framework with SSR and static export
- **React 19.1.1**: UI library with latest hooks
- **Progressive Web App**: Service workers, offline functionality, installable
- **Responsive Design**: Mobile-first with Tailwind CSS 4.1.10
- **Wallet Integration**: Phantom, Solflare, and other Solana wallets

### Smart Contracts
- **Solana/Anchor 0.31.1**: Rust-based smart contract framework
- **Rust 1.88.0+**: Systems programming language
- **Program ID**: ASU1Gjmx9XMwErZumic9DNTADYzKphtEd1Zy4BFwSpnk

### Testing
- **Jest 30.0.0**: Unit testing framework
- **Puppeteer 24.10.0**: E2E testing with browser automation
- **Comprehensive Test Suite**: Security, unit, integration, and performance tests

### Build Tools
- **Webpack 5.99.9**: Module bundler with blockchain polyfills
- **Babel**: JavaScript transpilation with custom configuration
- **ESLint**: Code linting with Next.js configuration

## Network Configuration
- **Primary Network**: Solana Devnet
- **Supported Networks**: Solana, Sonic, Eclipse, svmBNB, s00n
- **RPC Endpoint**: https://api.devnet.solana.com (default)
- **Explorer**: https://explorer.solana.com/?cluster=devnet

## Development Environment Requirements
- **Node.js**: 18.17.0 or higher (validated with 20.19.4)
- **npm**: 7.0.0 or higher
- **Rust**: Latest stable (validated with 1.88.0)
- **System**: Linux/macOS/Windows with build tools
- **Memory**: 4GB minimum, 8GB recommended
- **Storage**: 1GB+ free space

This codebase is actively developed with comprehensive testing and deployment automation. Always validate changes through the complete manual scenario before committing.