#!/bin/bash

# Bundle size analysis script
# Compares bundle sizes and provides performance insights

echo "📊 Bundle Size Analysis"
echo "======================="

BUILD_DIR="build/_next/static"

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
fi

echo ""
echo "📦 Chunk Analysis:"
echo "-------------------"

# Find all JS chunks and analyze them
find "$BUILD_DIR/chunks" -name "*.js" -exec du -h {} \; | sort -hr | head -10

echo ""
echo "📈 Size Summary:"
echo "----------------"

TOTAL_JS=$(find "$BUILD_DIR" -name "*.js" -exec du -c {} + | tail -1 | cut -f1)
TOTAL_CSS=$(find "$BUILD_DIR" -name "*.css" -exec du -c {} + | tail -1 | cut -f1)
TOTAL_SIZE=$(find "$BUILD_DIR" -exec du -c {} + | tail -1 | cut -f1)

echo "JavaScript: $(echo $TOTAL_JS | numfmt --to=iec-i)B"
echo "CSS: $(echo $TOTAL_CSS | numfmt --to=iec-i)B" 
echo "Total Static: $(echo $TOTAL_SIZE | numfmt --to=iec-i)B"

echo ""
echo "🎯 Performance Analysis:"
echo "-------------------------"

# Check if we meet bundle size targets
JS_SIZE_KB=$((TOTAL_JS))
TARGET_JS_KB=1500  # Target: ~1.5MB for main JS

if [ $JS_SIZE_KB -le $TARGET_JS_KB ]; then
    echo "✅ JavaScript bundle size: GOOD (${JS_SIZE_KB}KB ≤ ${TARGET_JS_KB}KB)"
else
    echo "⚠️  JavaScript bundle size: NEEDS IMPROVEMENT (${JS_SIZE_KB}KB > ${TARGET_JS_KB}KB)"
fi

# Count number of chunks (good for caching)
CHUNK_COUNT=$(find "$BUILD_DIR/chunks" -name "*.js" | wc -l)
echo "📦 Number of chunks: $CHUNK_COUNT (more chunks = better caching)"

# Check for important separations
if ls "$BUILD_DIR/chunks"/react-*.js >/dev/null 2>&1; then
    echo "✅ React separated into its own chunk"
else
    echo "❌ React not separated"
fi

if ls "$BUILD_DIR/chunks"/solana-*.js >/dev/null 2>&1; then
    echo "✅ Solana dependencies separated"
else
    echo "❌ Solana dependencies not separated"
fi

if ls "$BUILD_DIR/chunks"/vendors-*.js >/dev/null 2>&1; then
    echo "✅ Vendor dependencies separated"
else
    echo "❌ Vendor dependencies not separated"
fi

echo ""
echo "🚀 Optimization Recommendations:"
echo "--------------------------------"

if [ $CHUNK_COUNT -lt 10 ]; then
    echo "💡 Consider more aggressive code splitting for better caching"
fi

LARGEST_CHUNK=$(find "$BUILD_DIR/chunks" -name "*.js" -exec du -k {} \; | sort -nr | head -1 | cut -f1)
if [ $LARGEST_CHUNK -gt 500 ]; then
    echo "💡 Largest chunk is ${LARGEST_CHUNK}KB - consider further splitting"
fi

echo "✅ Bundle analysis complete!"