# Wallet Operations API

**Version**: 1.0.0  
**Last Updated**: December 2024

## Overview

This document provides comprehensive documentation for wallet operations in the SVMP2P platform. It covers wallet connection flows, transaction signing patterns, error handling, and security considerations for Solana wallet integration.

## Table of Contents

- [Wallet Connection](#wallet-connection)
- [Transaction Management](#transaction-management)
- [Security Features](#security-features)
- [Error Handling](#error-handling)
- [Multi-Network Support](#multi-network-support)
- [Best Practices](#best-practices)

---

## Wallet Connection

### Connection Flow

The wallet connection process follows the Solana wallet adapter pattern with additional security measures:

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectionError } from '../utils/walletErrors';

interface WalletState {
  connected: boolean;
  connecting: boolean;
  wallet: Wallet | null;
  publicKey: PublicKey | null;
  error: Error | null;
  connectionState: 'unknown' | 'connecting' | 'connected' | 'disconnected' | 'error';
}
```

### Connection API

#### `connect()`

Initiates wallet connection with retry logic and error handling.

**Signature**:
```typescript
connect(): Promise<void>
```

**Behavior**:
1. Attempts connection to user's preferred wallet
2. Implements exponential backoff for failed attempts
3. Updates connection state throughout process
4. Handles user rejection gracefully

**Example Usage**:
```typescript
const { connect, connected, connecting, error } = useWallet();

const handleConnect = async () => {
  try {
    await connect();
    console.log('Wallet connected successfully');
  } catch (error) {
    if (error instanceof WalletConnectionError) {
      console.error('Connection failed:', error.message);
    }
  }
};
```

**Error Conditions**:
- `WalletNotInstalledError`: Wallet extension not found
- `WalletConnectionError`: User rejected connection
- `WalletDisconnectedError`: Connection lost during process
- `WalletTimeoutError`: Connection attempt timed out

#### `disconnect()`

Safely disconnects wallet and clears session data.

**Signature**:
```typescript
disconnect(): Promise<void>
```

**Behavior**:
1. Cleanly terminates wallet connection
2. Clears cached transaction data
3. Updates UI state
4. Preserves user preferences for reconnection

**Example Usage**:
```typescript
const { disconnect } = useWallet();

const handleDisconnect = async () => {
  await disconnect();
  console.log('Wallet disconnected');
};
```

#### `reconnect()`

Attempts to reconnect using stored wallet preference.

**Signature**:
```typescript
reconnect(): Promise<void>
```

**Parameters**:
- Uses previously connected wallet type
- Implements retry logic with backoff
- Maximum 3 reconnection attempts

**Example Usage**:
```typescript
const { reconnect, connectionState } = useWallet();

// Auto-reconnect on page load
useEffect(() => {
  if (connectionState === 'disconnected') {
    reconnect();
  }
}, []);
```

### Wallet Types Support

The platform supports multiple Solana wallets:

```typescript
const supportedWallets = [
  'phantom',
  'solflare',
  'ledger',
  'torus',
  'sollet',
  'mathWallet',
  'coin98',
  'slope',
  'trustWallet'
];
```

**Wallet Detection**:
```typescript
const detectAvailableWallets = (): string[] => {
  const available = [];
  if (window.solana?.isPhantom) available.push('phantom');
  if (window.solflare?.isSolflare) available.push('solflare');
  // ... other wallet checks
  return available;
};
```

---

## Transaction Management

### Transaction Building

#### `buildTransaction(instruction, options)`

Constructs transactions with proper fee calculation and priority settings.

**Parameters**:
- `instruction: TransactionInstruction[]` - Smart contract instructions
- `options: TransactionOptions` - Configuration options

**TransactionOptions Interface**:
```typescript
interface TransactionOptions {
  feePayer?: PublicKey;
  recentBlockhash?: string;
  priorityFee?: number;
  maxRetries?: number;
  skipPreflight?: boolean;
  commitment?: Commitment;
}
```

**Example Usage**:
```typescript
import { buildTransaction } from '../utils/transactionBuilder';

const createOfferTransaction = async (
  offerParams: OfferParams,
  wallet: WalletAdapter
) => {
  const instruction = await program.methods
    .createOffer(
      offerParams.amount,
      offerParams.fiatAmount,
      offerParams.currency,
      offerParams.paymentMethod,
      offerParams.timestamp
    )
    .accounts({
      offer: offerKeypair.publicKey,
      escrowAccount: escrowPDA,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  return buildTransaction([instruction], {
    feePayer: wallet.publicKey,
    priorityFee: 0.0001 * LAMPORTS_PER_SOL,
  });
};
```

### Transaction Signing

#### `signTransaction(transaction)`

Signs transactions with security validation.

**Signature**:
```typescript
signTransaction(transaction: Transaction): Promise<Transaction>
```

**Security Features**:
1. Validates transaction integrity before signing
2. Checks for malicious instructions
3. Verifies fee amounts are reasonable
4. Confirms recipient addresses

**Example Usage**:
```typescript
const { signTransaction, publicKey } = useWallet();

const executeOffer = async (transaction: Transaction) => {
  try {
    // Add recent blockhash
    const connection = new Connection(rpcEndpoint);
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    
    // Sign transaction
    const signedTx = await signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3,
      }
    );
    
    return signature;
  } catch (error) {
    throw new TransactionError(error.message);
  }
};
```

#### `signAllTransactions(transactions)`

Signs multiple transactions in batch for complex operations.

**Signature**:
```typescript
signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
```

**Use Cases**:
- Multi-step trade setup
- Batch reward claims
- Complex dispute resolutions

**Example Usage**:
```typescript
const { signAllTransactions } = useWallet();

const batchOperation = async (instructions: TransactionInstruction[][]) => {
  const transactions = instructions.map(instrs => 
    buildTransaction(instrs, { feePayer: publicKey })
  );
  
  const signedTxs = await signAllTransactions(transactions);
  
  const signatures = [];
  for (const tx of signedTxs) {
    const sig = await connection.sendRawTransaction(tx.serialize());
    signatures.push(sig);
  }
  
  return signatures;
};
```

### Transaction Confirmation

#### `confirmTransaction(signature, options)`

Monitors transaction confirmation with configurable commitment levels.

**Parameters**:
- `signature: string` - Transaction signature to monitor
- `options: ConfirmationOptions` - Confirmation settings

**ConfirmationOptions Interface**:
```typescript
interface ConfirmationOptions {
  commitment?: Commitment;
  timeout?: number;
  maxRetries?: number;
  onUpdate?: (status: TransactionStatus) => void;
}
```

**Example Usage**:
```typescript
import { confirmTransaction } from '../utils/transactionConfirm';

const monitorTransaction = async (signature: string) => {
  try {
    const result = await confirmTransaction(signature, {
      commitment: 'confirmed',
      timeout: 60000, // 60 seconds
      onUpdate: (status) => {
        console.log('Transaction status:', status);
      }
    });
    
    if (result.confirmed) {
      console.log('Transaction confirmed!');
    }
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

---

## Security Features

### Input Validation

All wallet operations include security validation:

```typescript
const validateTransactionSecurity = (tx: Transaction): SecurityCheck => {
  const checks = {
    validInstructions: true,
    reasonableFees: true,
    trustedPrograms: true,
    noSuspiciousAccounts: true,
  };

  // Validate instruction programs
  for (const instruction of tx.instructions) {
    if (!TRUSTED_PROGRAMS.includes(instruction.programId.toString())) {
      checks.trustedPrograms = false;
    }
  }

  // Check fee amounts
  const fee = tx.fee || 0;
  if (fee > MAX_REASONABLE_FEE) {
    checks.reasonableFees = false;
  }

  return checks;
};
```

### Private Key Protection

**Security Principles**:
1. **Never access private keys directly**
2. **Use wallet adapter interfaces only**
3. **Validate all transactions before signing**
4. **Implement transaction timeouts**

```typescript
// ❌ Never do this
const privateKey = wallet.secretKey; // This doesn't exist and shouldn't

// ✅ Correct approach
const signature = await wallet.signTransaction(transaction);
```

### Session Management

**Session Security**:
```typescript
interface SecureSession {
  publicKey: PublicKey;
  connectedAt: number;
  lastActivity: number;
  sessionTimeout: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const validateSession = (session: SecureSession): boolean => {
  const now = Date.now();
  return (now - session.lastActivity) < SESSION_TIMEOUT;
};
```

---

## Error Handling

### Error Types

The wallet system defines specific error types for different failure scenarios:

```typescript
export class WalletConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public signature?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Recovery

#### Connection Recovery

```typescript
const handleConnectionError = async (error: WalletConnectionError) => {
  switch (error.code) {
    case 'WALLET_NOT_FOUND':
      // Prompt user to install wallet
      showWalletInstallPrompt();
      break;
      
    case 'USER_REJECTED':
      // Show retry option
      showConnectionRetryOption();
      break;
      
    case 'NETWORK_ERROR':
      // Attempt reconnection with backoff
      await retryConnection();
      break;
      
    default:
      // Log error and show generic message
      logger.error('Wallet connection failed', error);
      showGenericError();
  }
};
```

#### Transaction Recovery

```typescript
const handleTransactionError = async (
  error: TransactionError,
  transaction: Transaction
) => {
  if (error.message.includes('insufficient funds')) {
    showInsufficientFundsDialog();
    return;
  }
  
  if (error.message.includes('blockhash expired')) {
    // Retry with fresh blockhash
    const freshTx = await refreshBlockhash(transaction);
    return retryTransaction(freshTx);
  }
  
  // For other errors, log and notify user
  logger.error('Transaction failed', { error, signature: error.signature });
  showTransactionErrorDialog(error.message);
};
```

### Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
```

---

## Multi-Network Support

### Network Configuration

The platform supports multiple SVM networks with different configurations:

```typescript
interface NetworkConfig {
  name: string;
  displayName: string;
  rpcEndpoint: string;
  programId: PublicKey;
  confirmationCommitment: Commitment;
  gasSettings: {
    priorityFee: number;
    maxFee: number;
  };
}

const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  'solana-mainnet': {
    name: 'solana-mainnet',
    displayName: 'Solana Mainnet',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    programId: new PublicKey('FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9'),
    confirmationCommitment: 'confirmed',
    gasSettings: {
      priorityFee: 0.0001,
      maxFee: 0.01,
    },
  },
  'sonic': {
    name: 'sonic',
    displayName: 'Sonic SVM',
    rpcEndpoint: 'https://rpc.sonic.game',
    programId: new PublicKey('FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9'),
    confirmationCommitment: 'finalized',
    gasSettings: {
      priorityFee: 0.00001,
      maxFee: 0.001,
    },
  },
  // Additional networks...
};
```

### Network Switching

```typescript
const switchNetwork = async (networkName: string) => {
  const config = NETWORK_CONFIGS[networkName];
  if (!config) {
    throw new Error(`Unknown network: ${networkName}`);
  }
  
  // Update connection
  const newConnection = new Connection(
    config.rpcEndpoint,
    config.confirmationCommitment
  );
  
  // Update program instance
  const provider = new AnchorProvider(
    newConnection,
    wallet.adapter,
    { commitment: config.confirmationCommitment }
  );
  
  const program = new Program(IDL, config.programId, provider);
  
  // Update context
  updateNetworkContext({
    connection: newConnection,
    program,
    config,
  });
  
  console.log(`Switched to ${config.displayName}`);
};
```

---

## Best Practices

### Connection Management

1. **Lazy Connection**: Only connect when needed
```typescript
const connectWhenNeeded = async () => {
  if (!connected && userWantsToTrade) {
    await connect();
  }
};
```

2. **Session Persistence**: Remember user's wallet choice
```typescript
const saveWalletPreference = (walletName: string) => {
  localStorage.setItem('preferred-wallet', walletName);
};

const restoreWalletPreference = (): string | null => {
  return localStorage.getItem('preferred-wallet');
};
```

3. **Graceful Degradation**: Handle wallet unavailability
```typescript
const checkWalletAvailability = () => {
  const available = detectAvailableWallets();
  if (available.length === 0) {
    showWalletInstallationGuide();
  }
};
```

### Transaction Optimization

1. **Batch Operations**: Combine related instructions
```typescript
const batchInstructions = (instructions: TransactionInstruction[]) => {
  const MAX_INSTRUCTIONS_PER_TX = 8;
  const batches = [];
  
  for (let i = 0; i < instructions.length; i += MAX_INSTRUCTIONS_PER_TX) {
    batches.push(instructions.slice(i, i + MAX_INSTRUCTIONS_PER_TX));
  }
  
  return batches;
};
```

2. **Fee Optimization**: Use appropriate priority fees
```typescript
const calculateOptimalFee = (network: string, urgency: 'low' | 'medium' | 'high') => {
  const config = NETWORK_CONFIGS[network];
  const multipliers = { low: 1, medium: 2, high: 5 };
  
  return config.gasSettings.priorityFee * multipliers[urgency];
};
```

3. **Transaction Monitoring**: Track all pending transactions
```typescript
const transactionTracker = new Map<string, TransactionStatus>();

const trackTransaction = (signature: string) => {
  transactionTracker.set(signature, 'pending');
  
  // Monitor confirmation
  confirmTransaction(signature).then(() => {
    transactionTracker.set(signature, 'confirmed');
  }).catch(() => {
    transactionTracker.set(signature, 'failed');
  });
};
```

### Security Best Practices

1. **Validate Everything**: Never trust external input
2. **Use Type Safety**: Leverage TypeScript for error prevention
3. **Monitor Transactions**: Track all pending operations
4. **Handle Failures Gracefully**: Provide clear error messages
5. **Respect User Privacy**: Never log sensitive information

### Performance Optimization

1. **Connection Pooling**: Reuse RPC connections
2. **Caching**: Cache account data appropriately
3. **Lazy Loading**: Load wallet adapters on demand
4. **Debouncing**: Prevent rapid repeated operations

For complete implementation examples, see the [examples directory](./examples/) and [transaction flows documentation](./transaction-flows.md).