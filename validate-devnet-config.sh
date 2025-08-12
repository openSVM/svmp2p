#!/bin/bash

# OpenSVM P2P Exchange - Devnet Configuration Validation
# This script validates that the frontend is properly configured for the deployed program

echo "🚀 OpenSVM P2P Exchange - Devnet Deployment Validation"
echo "======================================================="

# Check configuration files
echo "📋 Checking configuration files..."

# Check App.js
PROGRAM_ID_APP=$(grep -o "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" src/App.js | wc -l)
if [ "$PROGRAM_ID_APP" -gt 0 ]; then
    echo "✅ App.js: Program ID updated correctly"
else
    echo "❌ App.js: Program ID not found"
fi

# Check useProgram.js
PROGRAM_ID_HOOK=$(grep -o "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" src/hooks/useProgram.js | wc -l)
if [ "$PROGRAM_ID_HOOK" -gt 0 ]; then
    echo "✅ useProgram.js: Program ID updated correctly"
else
    echo "❌ useProgram.js: Program ID not found"
fi

# Check networks.js
PROGRAM_ID_NETWORKS=$(grep -o "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" src/config/networks.js | wc -l)
if [ "$PROGRAM_ID_NETWORKS" -gt 0 ]; then
    echo "✅ networks.js: Program ID updated correctly"
else
    echo "❌ networks.js: Program ID not found"
fi

# Check Anchor.toml
PROGRAM_ID_ANCHOR=$(grep -o "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" Anchor.toml | wc -l)
if [ "$PROGRAM_ID_ANCHOR" -gt 0 ]; then
    echo "✅ Anchor.toml: Program ID updated correctly"
else
    echo "❌ Anchor.toml: Program ID not found"
fi

# Check IDL
PROGRAM_ID_IDL=$(grep -o "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" src/idl/p2p_exchange.json | wc -l)
if [ "$PROGRAM_ID_IDL" -gt 0 ]; then
    echo "✅ IDL: Program address updated correctly"
else
    echo "❌ IDL: Program address not found"
fi

# Check environment file
if [ -f ".env.local" ]; then
    ENV_NETWORK=$(grep "NEXT_PUBLIC_SOLANA_NETWORK=devnet" .env.local | wc -l)
    ENV_PROGRAM=$(grep "AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k" .env.local | wc -l)
    if [ "$ENV_NETWORK" -gt 0 ] && [ "$ENV_PROGRAM" -gt 0 ]; then
        echo "✅ .env.local: Network and program ID configured correctly"
    else
        echo "❌ .env.local: Configuration incomplete"
    fi
else
    echo "❌ .env.local: Environment file not found"
fi

echo ""
echo "📊 Deployment Information:"
echo "   Program ID: AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k"
echo "   Network: Solana Devnet"
echo "   Explorer: https://explorer.solana.com/address/AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k?cluster=devnet"
echo "   Deploy Transaction: 5JdPEHukpbDPhapn6oQi3AULtD4mKJ8XqTUy1HxqmTJDxrMRfSKB33WbzJ6ny8pACpNMbVmeFfSqmrSH9suHZk5T"

echo ""
echo "🌐 Testing frontend connection..."
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Frontend accessible at http://localhost:3000"
    else
        echo "❌ Frontend not accessible (HTTP $HTTP_STATUS)"
    fi
else
    echo "⚠️  curl not available, cannot test frontend"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Connect your Phantom wallet to Solana Devnet"
echo "   3. Check the debug panel (bottom-right) for program connection status"
echo "   4. Test creating an offer to verify smart contract integration"

echo ""
echo "Configuration validation complete! 🎉"