#!/bin/bash
set -e

echo "🚀 Setting up OpenSVM P2P Exchange development environment..."

# Install system dependencies required for Solana/Anchor development
echo "📦 Installing system dependencies..."
sudo apt-get update && sudo apt-get install -y \
    libudev-dev \
    libssl-dev \
    pkg-config \
    build-essential \
    curl \
    wget \
    git

# Install Solana CLI tools
echo "🔧 Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor Version Manager
echo "⚓ Installing Anchor Version Manager..."
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Add AVM to PATH
echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.avm/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install and use Anchor 0.31.1
echo "📦 Installing Anchor 0.31.1..."
avm install 0.31.1
avm use 0.31.1

# Verify tool installations
echo "✅ Verifying installations..."
solana --version
anchor --version

# Install Node.js dependencies with legacy peer deps flag
echo "📦 Installing Node.js dependencies..."
npm install --legacy-peer-deps

# Verify Node.js setup
echo "✅ Verifying Node.js setup..."
node --version
npm --version

# Build the project to verify everything is working
echo "🔨 Building project to verify setup..."
npm run build

# Test Solana program build
echo "🔨 Testing Solana program build..."
anchor build

echo ""
echo "✅ Development environment setup complete!"
echo "📝 You can now use:"
echo "   npm run dev     - Start development server"
echo "   npm run build   - Build for production"
echo "   npm test        - Run tests"
echo "   anchor build    - Build Solana programs"
echo "   solana --version - Check Solana CLI version"
echo ""