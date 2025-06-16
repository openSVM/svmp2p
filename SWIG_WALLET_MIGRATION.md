# Swig Wallet Migration Guide

## Migration Timeline

### Phase 1: Deprecation Warnings (Current)
- `useSafeWallet` hook displays deprecation warnings in console
- `WalletMultiButton` component shows deprecation warning
- All functionality remains intact
- **Timeline**: Current release

### Phase 2: Migration Support (v1.5.0)
- Add migration tool to scan codebase for deprecated usage
- Provide automated migration scripts
- Enhanced documentation and examples
- **Timeline**: Next minor release

### Phase 3: Removal (v2.0.0)
- Remove deprecated aliases completely
- Clean up legacy code paths
- **Timeline**: Next major release

## Migration Steps

### 1. Update Hook Usage

**Before (Deprecated):**
```javascript
import { useSafeWallet } from './contexts/SwigWalletProvider';

const MyComponent = () => {
  const wallet = useSafeWallet();
  // ...
};
```

**After (Recommended):**
```javascript
import { useSwigWallet } from './contexts/SwigWalletProvider';

const MyComponent = () => {
  const wallet = useSwigWallet();
  // ...
};
```

### 2. Update Component Usage

**Before (Deprecated):**
```javascript
import { WalletMultiButton } from './components/SwigWalletButton';

const MyComponent = () => (
  <WalletMultiButton />
);
```

**After (Recommended):**
```javascript
import { SwigWalletButton } from './components/SwigWalletButton';

const MyComponent = () => (
  <SwigWalletButton />
);
```

### 3. Update Provider Usage

**Before (Legacy):**
```javascript
import { SafeWalletProvider } from './contexts/SwigWalletProvider';
```

**After (Current):**
```javascript
import { SwigWalletProvider } from './contexts/SwigWalletProvider';
```

## Breaking Changes in v2.0.0

1. **Removed Exports:**
   - `useSafeWallet` hook
   - `WalletMultiButton` component alias
   - `SafeWalletProvider` component alias

2. **Updated Interface:**
   - All wallet context properties now use consistent naming
   - Error handling moved to toast notifications by default

## Migration Tool Usage

Run the migration tool to automatically update your codebase:

```bash
npm run migrate-wallet-hooks
```

This will:
- Scan your codebase for deprecated usage
- Automatically replace deprecated hooks and components
- Generate a migration report
- Backup original files

## Need Help?

- Check the updated documentation in `SWIG_WALLET_INTEGRATION.md`
- Review the example implementations in the `/examples` folder
- Create an issue if you encounter migration problems

## Compatibility Promise

We guarantee backward compatibility through v1.x releases. All deprecated features will continue to work with warnings until v2.0.0.