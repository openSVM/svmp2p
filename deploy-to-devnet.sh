#!/bin/bash

# P2P Exchange Program Deployment Script for Solana Devnet
# This script builds and deploys the Anchor program to Solana devnet

set -e

echo "🚀 Starting P2P Exchange Program Deployment to Devnet"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI is not installed${NC}"
    echo "Please install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI is not installed${NC}"
    echo "Please install from: https://anchor-lang.com/docs/installation"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"

# Configuration
PROGRAM_ID="4eLxPSpK6Qi1AyNx79Ns4DoVqodp85sEphzPtFqLKTRk"
NETWORK="devnet"
KEYPAIR_PATH="./program-keypair.json"

echo "📊 Deployment Configuration:"
echo "  Program ID: $PROGRAM_ID"
echo "  Network: $NETWORK"
echo "  Keypair: $KEYPAIR_PATH"

# Set Solana CLI to devnet
echo "🌐 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/id.json

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance --lamports)
MIN_BALANCE=1000000000  # 1 SOL in lamports

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo -e "${YELLOW}⚠️  Low balance detected. Requesting devnet SOL...${NC}"
    solana airdrop 2
    echo "Waiting for airdrop confirmation..."
    sleep 5
fi

echo "Current balance: $(solana balance) SOL"

# Ensure program keypair exists
if [ ! -f "$KEYPAIR_PATH" ]; then
    echo -e "${YELLOW}⚠️  Program keypair not found. Generating new one...${NC}"
    solana-keygen new --no-bip39-passphrase --force --outfile "$KEYPAIR_PATH"
fi

ACTUAL_PROGRAM_ID=$(solana-keygen pubkey "$KEYPAIR_PATH")
if [ "$ACTUAL_PROGRAM_ID" != "$PROGRAM_ID" ]; then
    echo -e "${RED}❌ Program keypair mismatch!${NC}"
    echo "Expected: $PROGRAM_ID"
    echo "Actual: $ACTUAL_PROGRAM_ID"
    echo "Either use the correct keypair or update the program ID in the code."
    exit 1
fi

echo -e "${GREEN}✅ Program keypair validated${NC}"

# Build the program
echo "🔨 Building Anchor program..."
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy the program
echo "🚀 Deploying program to devnet..."
echo "This may take a few minutes..."

solana program deploy \
    --keypair "$KEYPAIR_PATH" \
    --url https://api.devnet.solana.com \
    ./target/deploy/p2p_exchange.so

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

# Create IDL account (optional but recommended)
echo "📄 Initializing IDL account..."
anchor idl init "$PROGRAM_ID" \
    --filepath ./target/idl/p2p_exchange.json \
    --provider.cluster devnet

echo ""
echo "🎉 Deployment Complete!"
echo "=============================="
echo "Program ID: $PROGRAM_ID"
echo "Network: Solana Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "📋 Next Steps:"
echo "1. Update your frontend configuration with this Program ID"
echo "2. Test program functions using the frontend"
echo "3. Monitor transactions on Solana Explorer"
echo ""
echo "🔗 Useful Commands:"
echo "  View program info: solana program show $PROGRAM_ID --url https://api.devnet.solana.com"
echo "  View IDL: anchor idl fetch $PROGRAM_ID --provider.cluster devnet"
echo "  Program logs: solana logs $PROGRAM_ID --url https://api.devnet.solana.com"