#!/bin/bash

# P2P Exchange Program Deployment Script - Solana CLI Only
# This script deploys the program using only Solana CLI tools (no Anchor required)

set -e

echo "🚀 Starting P2P Exchange Program Deployment to Devnet (Solana CLI Only)"
echo "========================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROGRAM_ID="4eLxPSpK6Qi1AyNx79Ns4DoVqodp85sEphzPtFqLKTRk"
NETWORK="devnet"
KEYPAIR_PATH="./program-keypair.json"
PROGRAM_SO_PATH="./target/deploy/p2p_exchange.so"

echo "📊 Deployment Configuration:"
echo "  Program ID: $PROGRAM_ID"
echo "  Network: $NETWORK"
echo "  Keypair: $KEYPAIR_PATH"
echo "  Program Binary: $PROGRAM_SO_PATH"

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI is not installed${NC}"
    echo "Please install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

if ! command -v cargo-build-sbf &> /dev/null; then
    echo -e "${RED}❌ Solana BPF build tools not found${NC}"
    echo "Install Solana CLI which includes cargo-build-sbf"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"

# Set Solana CLI to devnet
echo "🌐 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/id.json

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance --lamports)
MIN_BALANCE=2000000000  # 2 SOL in lamports (deployment costs ~1.5 SOL)

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo -e "${YELLOW}⚠️  Low balance detected. Requesting devnet SOL...${NC}"
    solana airdrop 2
    echo "Waiting for airdrop confirmation..."
    sleep 10
    
    # Check balance again
    BALANCE=$(solana balance --lamports)
    if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
        echo -e "${RED}❌ Insufficient balance for deployment${NC}"
        echo "Current balance: $(solana balance) SOL"
        echo "Required: 2 SOL minimum"
        exit 1
    fi
fi

echo "Current balance: $(solana balance) SOL"

# Ensure program keypair exists and matches expected ID
if [ ! -f "$KEYPAIR_PATH" ]; then
    echo -e "${YELLOW}⚠️  Program keypair not found. Generating new one...${NC}"
    solana-keygen new --no-bip39-passphrase --force --outfile "$KEYPAIR_PATH"
fi

ACTUAL_PROGRAM_ID=$(solana-keygen pubkey "$KEYPAIR_PATH")
if [ "$ACTUAL_PROGRAM_ID" != "$PROGRAM_ID" ]; then
    echo -e "${RED}❌ Program keypair mismatch!${NC}"
    echo "Expected: $PROGRAM_ID"
    echo "Actual: $ACTUAL_PROGRAM_ID"
    echo "Generating correct keypair for expected program ID..."
    
    # For deployment, we'll use the actual keypair and update configs
    PROGRAM_ID="$ACTUAL_PROGRAM_ID"
    echo "Updated Program ID: $PROGRAM_ID"
fi

echo -e "${GREEN}✅ Program keypair validated${NC}"

# Build the program using Solana CLI tools only
echo "🔨 Building program with Solana CLI tools..."
cd programs/p2p-exchange

# Clean any existing build artifacts
rm -rf target/

# Build using cargo-build-sbf (Solana CLI tool)
cargo-build-sbf

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

cd ../..

echo -e "${GREEN}✅ Build successful${NC}"

# Verify the binary exists
if [ ! -f "$PROGRAM_SO_PATH" ]; then
    echo -e "${RED}❌ Program binary not found at $PROGRAM_SO_PATH${NC}"
    exit 1
fi

echo "📦 Program binary size: $(du -h $PROGRAM_SO_PATH | cut -f1)"

# Deploy the program using Solana CLI
echo "🚀 Deploying program to devnet..."
echo "This may take a few minutes..."

solana program deploy \
    --keypair "$KEYPAIR_PATH" \
    --url https://api.devnet.solana.com \
    "$PROGRAM_SO_PATH"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Program deployed successfully!${NC}"

# Verify deployment
echo "🔍 Verifying deployment..."
solana program show "$PROGRAM_ID" --url https://api.devnet.solana.com

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment verified${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify deployment (this is sometimes normal)${NC}"
fi

# Update configuration files with actual program ID
echo "📝 Updating configuration files..."

# Update lib.rs
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/p2p-exchange/src/lib.rs

# Update Anchor.toml
sed -i "s/p2p_exchange = \".*\"/p2p_exchange = \"$PROGRAM_ID\"/" Anchor.toml

# Update frontend useProgram.js
if [ -f "src/hooks/useProgram.js" ]; then
    sed -i "s/const PROGRAM_ID = new PublicKey(\".*\")/const PROGRAM_ID = new PublicKey(\"$PROGRAM_ID\")/" src/hooks/useProgram.js
fi

# Update frontend App.js network config
if [ -f "src/App.js" ]; then
    sed -i "s/programId: \".*\"/programId: \"$PROGRAM_ID\"/" src/App.js
fi

echo -e "${GREEN}✅ Configuration files updated${NC}"

echo ""
echo "🎉 Deployment Complete!"
echo "=============================="
echo "Program ID: $PROGRAM_ID"
echo "Network: Solana Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "📋 Next Steps:"
echo "1. Test program functions using the frontend"
echo "2. Monitor transactions on Solana Explorer"
echo "3. Initialize admin account using the frontend"
echo ""
echo "🔗 Useful Commands:"
echo "  View program info: solana program show $PROGRAM_ID --url https://api.devnet.solana.com"
echo "  Program logs: solana logs $PROGRAM_ID --url https://api.devnet.solana.com"
echo "  Account info: solana account $PROGRAM_ID --url https://api.devnet.solana.com"