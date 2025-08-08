# P2P Exchange Program TypeScript Types

This directory contains TypeScript type definitions for the Solana P2P Exchange Program.

## Files

- `p2p_exchange.ts` - Complete TypeScript types and utilities for the P2P Exchange program

## Features

### Type Definitions
- All account types (Admin, Offer, Dispute, etc.)
- Instruction argument types
- Event types
- Error code constants

### Utility Functions
- PDA (Program Derived Address) derivation helpers
- Constants for validation limits
- Enum value mappings

### Usage Example

```typescript
import {
  P2P_EXCHANGE_PROGRAM_ID,
  getAdminPDA,
  getEscrowPDA,
  OFFER_STATUS,
  P2P_EXCHANGE_ERRORS,
  type OfferAccount,
  type AdminAccount
} from './types/p2p_exchange';

// Get admin PDA
const [adminPDA, adminBump] = getAdminPDA();

// Get escrow PDA for an offer
const [escrowPDA, escrowBump] = getEscrowPDA(offerPublicKey);

// Use status constants
if (offer.status === OFFER_STATUS.ACCEPTED) {
  // Handle accepted offer
}

// Error handling
try {
  await program.methods.createOffer(/* ... */).rpc();
} catch (error) {
  if (error.code === P2P_EXCHANGE_ERRORS.INSUFFICIENT_FUNDS) {
    // Handle insufficient funds error
  }
}
```

### PDA Helpers

The file includes helper functions for deriving all Program Derived Addresses (PDAs):

- `getAdminPDA()` - Admin account PDA
- `getEscrowPDA(offer)` - Escrow account PDA for an offer
- `getReputationPDA(user)` - User reputation account PDA
- `getVotePDA(dispute, juror)` - Vote account PDA for a juror's vote
- `getRewardTokenPDA()` - Reward token configuration PDA
- `getUserRewardsPDA(user)` - User rewards account PDA

### Constants

All program constants are exported:
- Input validation limits (string lengths, array sizes)
- Dispute deadlines and timeouts
- Rate limiting cooldowns
- Error codes

## Integration

These types can be used with:
- Anchor TypeScript client
- React/Next.js frontends
- Node.js backends
- Any TypeScript/JavaScript Solana application