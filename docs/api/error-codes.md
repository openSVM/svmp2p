# Error Codes Reference

**Version**: 1.0.0  
**Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

This document provides a comprehensive reference for all error codes in the SVMP2P platform, including smart contract errors, wallet operation errors, and frontend error handling patterns.

## Table of Contents

- [Smart Contract Error Codes](#smart-contract-error-codes)
- [Wallet Operation Errors](#wallet-operation-errors)
- [Frontend Error Codes](#frontend-error-codes)
- [Error Handling Patterns](#error-handling-patterns)
- [Recovery Strategies](#recovery-strategies)

---

## Smart Contract Error Codes

Smart contract errors are defined in the program's error enum and use Anchor's error handling system.

### Program Error Codes

| Code | Error Name | Description | Recovery Action |
|------|------------|-------------|-----------------|
| 6000 | `InvalidOfferStatus` | Offer status does not allow this operation | Check offer status before operation |
| 6001 | `InvalidDisputeStatus` | Dispute status does not allow this operation | Verify dispute state progression |
| 6002 | `Unauthorized` | User is not authorized for this action | Ensure correct signer authority |
| 6003 | `InsufficientFunds` | Insufficient funds for this operation | Check account balance |
| 6004 | `AlreadyVoted` | Juror has already voted | Prevent duplicate voting |
| 6005 | `NotAJuror` | User is not a juror for this dispute | Verify juror assignment |
| 6006 | `DisputeAlreadyExists` | A dispute already exists for this offer | Check existing dispute status |
| 6007 | `InvalidAmount` | Invalid amount specified | Validate amount > 0 |
| 6008 | `InputTooLong` | Input string exceeds maximum length | Truncate or validate input |
| 6009 | `AdminRequired` | Admin authority required | Use admin signer |
| 6010 | `TooManyEvidenceItems` | Maximum evidence items exceeded | Limit evidence submissions |
| 6011 | `InvalidUtf8` | Invalid UTF-8 string | Validate string encoding |
| 6012 | `TiedVote` | Vote is tied, cannot execute verdict | Reassign jurors or revote |
| 6013 | `MathOverflow` | Math operation resulted in overflow | Check calculation bounds |
| 6014 | `NoRewardsToClaim` | No rewards available to claim | Check reward balance |
| 6015 | `RewardTokenNotInitialized` | Reward token system not initialized | Initialize reward system |
| 6016 | `TooManyRequests` | Rate limit exceeded | Implement rate limiting |

### Error Code Details

#### 6000 - InvalidOfferStatus

**Description**: The current offer status does not allow the requested operation.

**Valid Status Transitions**:
```
CREATED → LISTED → ACCEPTED → FIAT_SENT → FIAT_CONFIRMED → COMPLETED
                  ↓
                DISPUTED → RESOLVED
```

**Example Scenarios**:
- Trying to accept an offer that's already accepted
- Attempting to mark fiat sent before offer is accepted
- Confirming fiat receipt before it's marked as sent

**Error Response**:
```json
{
  "error": {
    "code": 6000,
    "message": "Invalid offer status for this operation",
    "name": "InvalidOfferStatus"
  }
}
```

**Recovery Strategy**:
```typescript
const handleOfferStatusError = async (offer: OfferAccount) => {
  const currentStatus = offer.status;
  const validNextStates = getValidTransitions(currentStatus);
  
  throw new Error(
    `Cannot perform operation. Current status: ${currentStatus}. ` +
    `Valid next states: ${validNextStates.join(', ')}`
  );
};
```

#### 6002 - Unauthorized

**Description**: The transaction signer does not have permission for the requested action.

**Common Causes**:
- Wrong signer for offer operations (only seller can list, only buyer can accept)
- Non-admin trying to perform admin operations
- Juror not assigned to dispute attempting to vote

**Error Response**:
```json
{
  "error": {
    "code": 6002,
    "message": "You are not authorized to perform this action",
    "name": "Unauthorized"
  }
}
```

**Prevention**:
```typescript
const validateAuthorization = (operation: string, signer: PublicKey, account: any) => {
  switch (operation) {
    case 'list_offer':
      if (!signer.equals(account.seller)) {
        throw new Error('Only offer creator can list offer');
      }
      break;
    case 'accept_offer':
      if (signer.equals(account.seller)) {
        throw new Error('Seller cannot accept their own offer');
      }
      break;
    // Additional checks...
  }
};
```

#### 6003 - InsufficientFunds

**Description**: Account does not have enough SOL for the requested operation.

**Common Scenarios**:
- Creating offer without enough SOL for escrow + fees
- Accepting offer without enough SOL for security bond
- Transaction fees exceed available balance

**Error Response**:
```json
{
  "error": {
    "code": 6003,
    "message": "Insufficient funds for this operation",
    "name": "InsufficientFunds"
  }
}
```

**Prevention**:
```typescript
const checkSufficientFunds = async (
  connection: Connection,
  publicKey: PublicKey,
  requiredAmount: number
) => {
  const balance = await connection.getBalance(publicKey);
  const fee = 5000; // Estimated transaction fee
  
  if (balance < requiredAmount + fee) {
    throw new InsufficientFundsError(
      `Required: ${requiredAmount + fee} lamports, Available: ${balance} lamports`
    );
  }
};
```

#### 6007 - InvalidAmount

**Description**: Amount parameter is invalid (typically zero or negative).

**Validation Rules**:
- SOL amounts must be > 0
- Fiat amounts must be > 0
- Security bonds must be >= 0

**Error Response**:
```json
{
  "error": {
    "code": 6007,
    "message": "Invalid amount",
    "name": "InvalidAmount"
  }
}
```

**Prevention**:
```typescript
const validateAmount = (amount: BN, fieldName: string) => {
  if (amount.lte(new BN(0))) {
    throw new ValidationError(`${fieldName} must be greater than zero`);
  }
  
  const maxAmount = new BN('18446744073709551615'); // u64 max
  if (amount.gt(maxAmount)) {
    throw new ValidationError(`${fieldName} exceeds maximum value`);
  }
};
```

#### 6008 - InputTooLong

**Description**: String input exceeds maximum allowed length.

**Length Limits**:
- Fiat currency: 10 characters
- Payment method: 50 characters
- Dispute reason: 200 characters
- Evidence URL: 300 characters

**Error Response**:
```json
{
  "error": {
    "code": 6008,
    "message": "Input string too long",
    "name": "InputTooLong"
  }
}
```

**Prevention**:
```typescript
const validateStringLength = (input: string, maxLength: number, fieldName: string) => {
  if (input.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be ${maxLength} characters or less. Current: ${input.length}`
    );
  }
  
  // Validate UTF-8 encoding
  if (!isValidUtf8(input)) {
    throw new ValidationError(`${fieldName} contains invalid UTF-8 characters`);
  }
};
```

---

## Wallet Operation Errors

Errors related to wallet connection, transaction signing, and network communication.

### Connection Errors

| Code | Error Name | Description | Recovery Action |
|------|------------|-------------|-----------------|
| W001 | `WalletNotFound` | Wallet extension not installed | Guide user to install wallet |
| W002 | `WalletNotConnected` | Wallet not connected | Prompt connection |
| W003 | `ConnectionRejected` | User rejected connection | Show retry option |
| W004 | `ConnectionTimeout` | Connection attempt timed out | Retry with longer timeout |
| W005 | `WalletLocked` | Wallet is locked | Prompt user to unlock |
| W006 | `NetworkMismatch` | Wrong network selected | Switch to correct network |

### Transaction Errors

| Code | Error Name | Description | Recovery Action |
|------|------------|-------------|-----------------|
| T001 | `TransactionRejected` | User rejected transaction | Allow retry |
| T002 | `InsufficientBalance` | Not enough SOL for transaction | Show balance and required amount |
| T003 | `BlockhashExpired` | Transaction blockhash expired | Rebuild with fresh blockhash |
| T004 | `SimulationFailed` | Transaction simulation failed | Check instruction validity |
| T005 | `SendFailed` | Failed to send transaction | Retry with different RPC |
| T006 | `ConfirmationTimeout` | Transaction confirmation timeout | Check on-chain status |

### Error Classes

```typescript
export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public signature?: string,
    public logs?: string[]
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## Frontend Error Codes

Application-level errors for user interface and business logic.

### User Interface Errors

| Code | Error Name | Description | Recovery Action |
|------|------------|-------------|-----------------|
| UI001 | `InvalidInput` | User input validation failed | Show field-specific error |
| UI002 | `FormIncomplete` | Required fields missing | Highlight missing fields |
| UI003 | `UploadFailed` | File upload failed | Retry upload or use different file |
| UI004 | `LoadingTimeout` | Data loading timed out | Refresh page or retry |
| UI005 | `PermissionDenied` | User lacks required permissions | Explain required permissions |

### Business Logic Errors

| Code | Error Name | Description | Recovery Action |
|------|------------|-------------|-----------------|
| BL001 | `TradingNotAllowed` | Trading disabled or restricted | Show restriction reason |
| BL002 | `DisputeDeadlinePassed` | Dispute filing deadline expired | Explain deadline rules |
| BL003 | `OfferExpired` | Offer has expired | Show expired offer notice |
| BL004 | `RateLimitExceeded` | User exceeded rate limits | Show cooldown period |
| BL005 | `MaintenanceMode` | Platform in maintenance | Show maintenance notice |

---

## Error Handling Patterns

### Error Classification

```typescript
interface ErrorContext {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userActionRequired: boolean;
  category: 'wallet' | 'transaction' | 'validation' | 'network' | 'business';
}

const classifyError = (error: Error): ErrorContext => {
  if (error instanceof WalletError) {
    return {
      code: error.code,
      message: error.message,
      severity: error.code.startsWith('W00') ? 'medium' : 'high',
      recoverable: error.recoverable,
      userActionRequired: true,
      category: 'wallet',
    };
  }
  
  if (error instanceof TransactionError) {
    return {
      code: error.code,
      message: error.message,
      severity: 'high',
      recoverable: true,
      userActionRequired: true,
      category: 'transaction',
    };
  }
  
  // Default classification
  return {
    code: 'UNKNOWN',
    message: error.message,
    severity: 'medium',
    recoverable: false,
    userActionRequired: false,
    category: 'business',
  };
};
```

### Error Recovery Framework

```typescript
interface RecoveryStrategy {
  canRecover: (error: ErrorContext) => boolean;
  recover: (error: ErrorContext) => Promise<void>;
  maxAttempts: number;
}

const recoveryStrategies: Record<string, RecoveryStrategy> = {
  'W001': {
    canRecover: () => false,
    recover: async () => {
      showWalletInstallGuide();
    },
    maxAttempts: 1,
  },
  
  'W003': {
    canRecover: () => true,
    recover: async () => {
      await showConnectionRetryDialog();
    },
    maxAttempts: 3,
  },
  
  'T003': {
    canRecover: () => true,
    recover: async (error) => {
      // Refresh blockhash and retry
      await refreshTransactionBlockhash();
    },
    maxAttempts: 2,
  },
  
  '6003': {
    canRecover: () => false,
    recover: async () => {
      showInsufficientFundsDialog();
    },
    maxAttempts: 1,
  },
};
```

### User-Friendly Error Messages

```typescript
const getUserMessage = (errorContext: ErrorContext): string => {
  const userMessages: Record<string, string> = {
    'W001': 'Please install a Solana wallet (like Phantom) to continue.',
    'W002': 'Please connect your wallet to perform this action.',
    'W003': 'Wallet connection was cancelled. Would you like to try again?',
    'T001': 'Transaction was cancelled. You can try again when ready.',
    'T002': 'Insufficient SOL balance. Please add funds to your wallet.',
    '6000': 'This action is not available for the current offer status.',
    '6002': 'You don\'t have permission to perform this action.',
    '6003': 'Insufficient funds for this transaction.',
    '6007': 'Please enter a valid amount greater than zero.',
  };
  
  return userMessages[errorContext.code] || 'An unexpected error occurred. Please try again.';
};
```

### Error Logging

```typescript
interface ErrorLog {
  timestamp: number;
  errorCode: string;
  message: string;
  context: any;
  userAgent: string;
  url: string;
  userId?: string;
  walletAddress?: string;
}

const logError = (error: ErrorContext, context: any = {}) => {
  const log: ErrorLog = {
    timestamp: Date.now(),
    errorCode: error.code,
    message: error.message,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: getCurrentUserId(),
    walletAddress: getCurrentWalletAddress(),
  };
  
  // Send to logging service (remove sensitive data)
  const sanitizedLog = sanitizeLogData(log);
  sendToLoggingService(sanitizedLog);
  
  // Store locally for debugging
  storeLocalErrorLog(log);
};
```

---

## Recovery Strategies

### Automatic Recovery

```typescript
const attemptAutoRecovery = async (error: ErrorContext): Promise<boolean> => {
  const strategy = recoveryStrategies[error.code];
  
  if (!strategy || !strategy.canRecover(error)) {
    return false;
  }
  
  for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
    try {
      await strategy.recover(error);
      return true;
    } catch (recoveryError) {
      console.warn(`Recovery attempt ${attempt} failed:`, recoveryError);
      
      if (attempt < strategy.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return false;
};
```

### User-Guided Recovery

```typescript
const promptUserRecovery = async (error: ErrorContext) => {
  const actions = getUserRecoveryActions(error);
  
  const action = await showRecoveryDialog({
    title: 'Action Required',
    message: getUserMessage(error),
    actions,
  });
  
  switch (action) {
    case 'retry':
      return attemptAutoRecovery(error);
    case 'refresh':
      window.location.reload();
      break;
    case 'support':
      showSupportDialog(error);
      break;
  }
};

const getUserRecoveryActions = (error: ErrorContext): string[] => {
  const baseActions = ['dismiss'];
  
  if (error.recoverable) {
    baseActions.unshift('retry');
  }
  
  if (error.severity === 'critical') {
    baseActions.push('support');
  }
  
  return baseActions;
};
```

### Fallback Strategies

```typescript
const fallbackStrategies = {
  walletConnection: async () => {
    // Try different wallet adapters
    const adapters = getAvailableWalletAdapters();
    for (const adapter of adapters) {
      try {
        await adapter.connect();
        return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  },
  
  rpcConnection: async () => {
    // Try backup RPC endpoints
    const endpoints = getBackupRpcEndpoints();
    for (const endpoint of endpoints) {
      try {
        const connection = new Connection(endpoint);
        await connection.getVersion();
        updateRpcEndpoint(endpoint);
        return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  },
  
  transactionSubmission: async (transaction: Transaction) => {
    // Try multiple submission strategies
    const strategies = [
      () => submitWithRetry(transaction),
      () => submitWithDifferentFee(transaction),
      () => submitToBackupRpc(transaction),
    ];
    
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (e) {
        continue;
      }
    }
    throw new Error('All submission strategies failed');
  },
};
```

For complete error handling implementations and examples, see the [examples directory](./examples/) and [wallet operations documentation](./wallet-operations.md).