# API Examples

This directory contains practical examples for integrating with the SVMP2P platform.

## Examples Directory Structure

```
examples/
├── basic-trading/
│   ├── create-offer.ts
│   ├── accept-offer.ts
│   └── complete-trade.ts
├── dispute-resolution/
│   ├── open-dispute.ts
│   ├── submit-evidence.ts
│   └── juror-voting.ts
├── reward-system/
│   ├── setup-rewards.ts
│   ├── claim-rewards.ts
│   └── reward-tracking.ts
├── wallet-integration/
│   ├── wallet-connection.ts
│   ├── transaction-signing.ts
│   └── error-handling.ts
├── advanced/
│   ├── batch-operations.ts
│   ├── multi-network.ts
│   └── cross-program-invocation.ts
└── utils/
    ├── program-setup.ts
    ├── account-helpers.ts
    └── error-recovery.ts
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react
   ```

2. **Environment Setup**:
   ```typescript
   // Set up your environment variables
   export const PROGRAM_ID = "FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9";
   export const RPC_ENDPOINT = "https://api.devnet.solana.com";
   ```

3. **Basic Program Setup**:
   ```typescript
   import { Program, AnchorProvider } from '@coral-xyz/anchor';
   import { Connection } from '@solana/web3.js';
   
   const connection = new Connection(RPC_ENDPOINT);
   const provider = new AnchorProvider(connection, wallet, {});
   const program = new Program(IDL, PROGRAM_ID, provider);
   ```

## Example Categories

### Basic Trading Examples
- Complete trade lifecycle from offer creation to completion
- Error handling and validation
- Account management and PDA derivation

### Dispute Resolution Examples
- Opening disputes with proper evidence
- Juror assignment and voting processes
- Verdict execution and fund distribution

### Reward System Examples
- Setting up reward tokens and user accounts
- Earning rewards through trading and governance
- Claiming and managing reward balances

### Wallet Integration Examples
- Secure wallet connection patterns
- Transaction building and signing
- Multi-wallet support and fallbacks

### Advanced Examples
- Batch transaction processing
- Cross-program invocations
- Multi-network deployment strategies

## Usage Guidelines

1. **Testing**: All examples include test scenarios for devnet
2. **Error Handling**: Comprehensive error handling patterns
3. **Security**: Best practices for secure operations
4. **Performance**: Optimized transaction patterns

## Contributing Examples

When adding new examples:

1. Follow the existing directory structure
2. Include comprehensive error handling
3. Add JSDoc comments for all functions
4. Provide test cases with sample data
5. Update this README with new examples

For more detailed documentation, see the [API reference](../smart-contracts.md) and [wallet operations guide](../wallet-operations.md).