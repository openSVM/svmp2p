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

## New Features & Improvements

### Enhanced Error Handling System
The new Swig wallet integration includes a categorized error handling system:

#### Error Categories
- **Critical Errors**: Authentication failures, API issues (persistent toasts)
- **System Errors**: Network issues, connection problems (actionable toasts)
- **Informational Errors**: Form validation, user input (inline or brief toasts)
- **Success Messages**: Brief confirmation toasts

#### Usage Examples
```javascript
const { toast } = useToast();

// Critical errors - persistent with retry actions
toast.criticalError('Authentication failed', {
  action: <button onClick={retry}>Retry</button>
});

// System errors - connection issues with fallbacks
toast.systemError('Connection lost', {
  action: <button onClick={reconnect}>Reconnect</button>
});

// Success messages - brief confirmations
toast.success('Wallet connected successfully');
```

### Improved Reconnection Logic
- **Exponential backoff with jitter** prevents thundering herd problems
- **Comprehensive timeout cleanup** prevents memory leaks
- **Progress tracking UI** shows reconnection attempts to users
- **Cancellation support** allows users to stop reconnection

### Enhanced Popup Handling
- **Better popup blocker detection** including mobile browsers
- **Fallback options** for blocked popups (same-tab navigation)
- **Sequential popup management** reduces blocker issues
- **User-friendly error messages** with actionable buttons

### Accessibility Improvements
- **Focus trapping** in modals for keyboard navigation
- **ARIA labels** for screen readers
- **Escape key support** for modal dismissal
- **Proper focus restoration** after modal close

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