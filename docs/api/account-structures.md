# Account Structures Reference

**Version**: 1.0.0  
**Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

This document provides detailed specifications for all account structures used in the SVMP2P smart contract program. Each account includes field definitions, size calculations, and usage patterns.

## Table of Contents

- [Core Accounts](#core-accounts)
- [Trading Accounts](#trading-accounts)
- [Dispute Resolution Accounts](#dispute-resolution-accounts)
- [Reputation System Accounts](#reputation-system-accounts)
- [Reward System Accounts](#reward-system-accounts)
- [Constants and Enums](#constants-and-enums)

---

## Core Accounts

### `Admin`

The admin account manages program-wide settings and permissions.

**Structure**:
```rust
#[account]
pub struct Admin {
    pub authority: Pubkey,  // 32 bytes
    pub bump: u8,          // 1 byte
}
```

**Size**: 33 bytes total
- `authority`: The public key authorized to perform admin operations
- `bump`: PDA bump seed for deterministic address generation

**PDA Derivation**:
```rust
seeds = [b"admin"]
```

**Usage**:
- Created once during program initialization
- Required for admin-only instructions (juror assignment, verdict execution, etc.)
- Authority can be transferred to a multisig or governance program

**TypeScript Interface**:
```typescript
interface Admin {
  authority: PublicKey;
  bump: number;
}
```

### `EscrowAccount`

Holds metadata for escrow PDAs that store SOL during trades.

**Structure**:
```rust
#[account]
pub struct EscrowAccount {
    pub offer: Pubkey,  // 32 bytes
    pub bump: u8,       // 1 byte
}
```

**Size**: 33 bytes total
- `offer`: Reference to the associated offer account
- `bump`: PDA bump seed for the escrow account

**PDA Derivation**:
```rust
seeds = [b"escrow", offer.key().as_ref()]
```

**Usage**:
- Created when an offer is made with escrowed SOL
- Actual SOL is stored in the PDA's lamport balance
- Used to validate escrow operations during trade execution

---

## Trading Accounts

### `Offer`

Represents a trading offer in the marketplace.

**Structure**:
```rust
#[account]
pub struct Offer {
    pub seller: Pubkey,                  // 32 bytes
    pub buyer: Option<Pubkey>,           // 33 bytes (1 + 32)
    pub amount: u64,                     // 8 bytes
    pub security_bond: u64,              // 8 bytes
    pub status: u8,                      // 1 byte
    pub fiat_amount: u64,                // 8 bytes
    pub fiat_currency: String,           // 4 + MAX_FIAT_CURRENCY_LEN
    pub payment_method: String,          // 4 + MAX_PAYMENT_METHOD_LEN
    pub created_at: i64,                 // 8 bytes
    pub updated_at: i64,                 // 8 bytes
    pub dispute_id: Option<Pubkey>,      // 33 bytes (1 + 32)
}
```

**Size**: 157 bytes total (with max string lengths)

**Field Descriptions**:
- `seller`: Public key of the SOL seller
- `buyer`: Public key of the SOL buyer (set when offer is accepted)
- `amount`: SOL amount in lamports
- `security_bond`: Additional bond amount from buyer
- `status`: Current offer status (see OfferStatus enum)
- `fiat_amount`: Requested fiat amount (in smallest currency unit, e.g., cents)
- `fiat_currency`: Currency code (e.g., "USD", max 10 characters)
- `payment_method`: Payment description (max 50 characters)
- `created_at`: Unix timestamp of creation
- `updated_at`: Unix timestamp of last modification
- `dispute_id`: Link to dispute account if one exists

**Status Values**:
```rust
pub enum OfferStatus {
    Created = 0,      // Offer created but not listed
    Listed = 1,       // Offer visible in marketplace
    Accepted = 2,     // Buyer has accepted the offer
    FiatSent = 3,     // Buyer marked fiat as sent
    FiatConfirmed = 4,// Seller confirmed fiat receipt
    Completed = 5,    // Trade completed successfully
    Disputed = 6,     // Trade is under dispute
    Cancelled = 7,    // Offer cancelled by seller
}
```

**TypeScript Interface**:
```typescript
interface Offer {
  seller: PublicKey;
  buyer: PublicKey | null;
  amount: BN; // Use BN for u64 values
  securityBond: BN;
  status: number; // OfferStatus enum value
  fiatAmount: BN;
  fiatCurrency: string;
  paymentMethod: string;
  createdAt: BN; // Unix timestamp
  updatedAt: BN;
  disputeId: PublicKey | null;
}
```

---

## Dispute Resolution Accounts

### `Dispute`

Manages dispute resolution process for trades.

**Structure**:
```rust
#[account]
pub struct Dispute {
    pub offer: Pubkey,                                    // 32 bytes
    pub initiator: Pubkey,                               // 32 bytes
    pub respondent: Pubkey,                              // 32 bytes
    pub reason: String,                                  // 4 + MAX_DISPUTE_REASON_LEN
    pub status: u8,                                      // 1 byte
    pub jurors: [Pubkey; 3],                            // 96 bytes (3 * 32)
    pub evidence_buyer: [String; MAX_EVIDENCE_ITEMS],    // (4 + MAX_EVIDENCE_URL_LEN) * 5
    pub evidence_buyer_count: u8,                        // 1 byte
    pub evidence_seller: [String; MAX_EVIDENCE_ITEMS],   // (4 + MAX_EVIDENCE_URL_LEN) * 5
    pub evidence_seller_count: u8,                       // 1 byte
    pub votes_for_buyer: u8,                             // 1 byte
    pub votes_for_seller: u8,                            // 1 byte
    pub created_at: i64,                                 // 8 bytes
    pub resolved_at: i64,                                // 8 bytes
}
```

**Size**: 3,356 bytes total (with max evidence arrays)

**Field Descriptions**:
- `offer`: Reference to the disputed offer
- `initiator`: Who opened the dispute (buyer or seller)
- `respondent`: The other party in the trade
- `reason`: Detailed dispute reason (max 200 characters)
- `status`: Current dispute status (see DisputeStatus enum)
- `jurors`: Array of 3 assigned juror public keys
- `evidence_buyer`: Array of evidence URLs from buyer (max 5)
- `evidence_buyer_count`: Number of evidence items from buyer
- `evidence_seller`: Array of evidence URLs from seller (max 5)
- `evidence_seller_count`: Number of evidence items from seller
- `votes_for_buyer`: Count of juror votes for buyer
- `votes_for_seller`: Count of juror votes for seller
- `created_at`: Dispute creation timestamp
- `resolved_at`: Resolution timestamp (0 if unresolved)

**Status Values**:
```rust
pub enum DisputeStatus {
    Open = 0,            // Dispute opened, awaiting jurors
    JurorsAssigned = 1,  // Jurors assigned, awaiting evidence
    EvidencePhase = 2,   // Evidence submission period
    VotingPhase = 3,     // Jurors voting on outcome
    Resolved = 4,        // Dispute resolved with verdict
    Appealed = 5,        // Under appeal (future feature)
}
```

**TypeScript Interface**:
```typescript
interface Dispute {
  offer: PublicKey;
  initiator: PublicKey;
  respondent: PublicKey;
  reason: string;
  status: number; // DisputeStatus enum value
  jurors: PublicKey[]; // Array of 3 jurors
  evidenceBuyer: string[]; // Max 5 evidence URLs
  evidenceBuyerCount: number;
  evidenceSeller: string[]; // Max 5 evidence URLs
  evidenceSellerCount: number;
  votesForBuyer: number;
  votesForSeller: number;
  createdAt: BN;
  resolvedAt: BN;
}
```

### `Vote`

Records individual juror votes to prevent double-voting.

**Structure**:
```rust
#[account]
pub struct Vote {
    pub dispute: Pubkey,      // 32 bytes
    pub juror: Pubkey,        // 32 bytes
    pub vote_for_buyer: bool, // 1 byte
    pub timestamp: i64,       // 8 bytes
    pub bump: u8,            // 1 byte
}
```

**Size**: 74 bytes total

**PDA Derivation**:
```rust
seeds = [b"vote", dispute.key().as_ref(), juror.key().as_ref()]
```

**TypeScript Interface**:
```typescript
interface Vote {
  dispute: PublicKey;
  juror: PublicKey;
  voteForBuyer: boolean;
  timestamp: BN;
  bump: number;
}
```

---

## Reputation System Accounts

### `UserProfile`

Tracks user reputation and trading history.

**Structure**:
```rust
#[account]
pub struct UserProfile {
    pub user: Pubkey,             // 32 bytes
    pub successful_trades: u32,   // 4 bytes
    pub disputed_trades: u32,     // 4 bytes
    pub disputes_won: u32,        // 4 bytes
    pub disputes_lost: u32,       // 4 bytes
    pub total_volume: u64,        // 8 bytes
    pub rating: u8,               // 1 byte (0-100)
    pub created_at: i64,          // 8 bytes
    pub last_updated: i64,        // 8 bytes
    pub bump: u8,                 // 1 byte
}
```

**Size**: 74 bytes total

**Field Descriptions**:
- `user`: User's public key
- `successful_trades`: Number of completed trades without disputes
- `disputed_trades`: Number of trades that went to dispute
- `disputes_won`: Number of disputes resolved in user's favor
- `disputes_lost`: Number of disputes resolved against user
- `total_volume`: Cumulative trading volume in lamports
- `rating`: Calculated reputation score (0-100)
- `created_at`: Profile creation timestamp
- `last_updated`: Last reputation update timestamp
- `bump`: PDA bump seed

**PDA Derivation**:
```rust
seeds = [b"user_profile", user.key().as_ref()]
```

**Rating Calculation**:
```rust
// Simplified rating formula
let success_rate = successful_trades / (successful_trades + disputed_trades);
let dispute_win_rate = disputes_won / (disputes_won + disputes_lost);
rating = (success_rate * 70 + dispute_win_rate * 30) as u8;
```

**TypeScript Interface**:
```typescript
interface UserProfile {
  user: PublicKey;
  successfulTrades: number;
  disputedTrades: number;
  disputesWon: number;
  disputesLost: number;
  totalVolume: BN;
  rating: number; // 0-100
  createdAt: BN;
  lastUpdated: BN;
  bump: number;
}
```

---

## Reward System Accounts

### `RewardToken`

Configuration for the reward token system.

**Structure**:
```rust
#[account]
pub struct RewardToken {
    pub authority: Pubkey,           // 32 bytes
    pub mint: Pubkey,                // 32 bytes
    pub total_supply: u64,           // 8 bytes
    pub reward_rate_per_trade: u64,  // 8 bytes
    pub reward_rate_per_vote: u64,   // 8 bytes
    pub min_trade_volume: u64,       // 8 bytes
    pub created_at: i64,             // 8 bytes
    pub last_updated: i64,           // 8 bytes
    pub bump: u8,                    // 1 byte
}
```

**Size**: 113 bytes total

**Field Descriptions**:
- `authority`: Admin authority for reward system
- `mint`: SPL token mint for rewards
- `total_supply`: Total tokens minted
- `reward_rate_per_trade`: Tokens per successful trade
- `reward_rate_per_vote`: Tokens per governance vote
- `min_trade_volume`: Minimum volume to qualify for rewards
- `created_at`: System creation timestamp
- `last_updated`: Last parameter update timestamp
- `bump`: PDA bump seed

**PDA Derivation**:
```rust
seeds = [b"reward_token"]
```

**TypeScript Interface**:
```typescript
interface RewardToken {
  authority: PublicKey;
  mint: PublicKey;
  totalSupply: BN;
  rewardRatePerTrade: BN;
  rewardRatePerVote: BN;
  minTradeVolume: BN;
  createdAt: BN;
  lastUpdated: BN;
  bump: number;
}
```

### `UserRewards`

Tracks individual user reward balances and history.

**Structure**:
```rust
#[account]
pub struct UserRewards {
    pub user: Pubkey,              // 32 bytes
    pub total_earned: u64,         // 8 bytes
    pub total_claimed: u64,        // 8 bytes
    pub pending_rewards: u64,      // 8 bytes
    pub trade_rewards: u64,        // 8 bytes
    pub vote_rewards: u64,         // 8 bytes
    pub last_claim_time: i64,      // 8 bytes
    pub created_at: i64,           // 8 bytes
    pub bump: u8,                  // 1 byte
}
```

**Size**: 89 bytes total

**Field Descriptions**:
- `user`: User's public key
- `total_earned`: Lifetime rewards earned
- `total_claimed`: Lifetime rewards claimed
- `pending_rewards`: Unclaimed reward balance
- `trade_rewards`: Rewards earned from trading
- `vote_rewards`: Rewards earned from voting
- `last_claim_time`: Timestamp of last claim
- `created_at`: Account creation timestamp
- `bump`: PDA bump seed

**PDA Derivation**:
```rust
seeds = [b"user_rewards", user.key().as_ref()]
```

**TypeScript Interface**:
```typescript
interface UserRewards {
  user: PublicKey;
  totalEarned: BN;
  totalClaimed: BN;
  pendingRewards: BN;
  tradeRewards: BN;
  voteRewards: BN;
  lastClaimTime: BN;
  createdAt: BN;
  bump: number;
}
```

---

## Constants and Enums

### String Length Constants

```rust
pub const MAX_FIAT_CURRENCY_LEN: usize = 10;   // "USD", "EUR", etc.
pub const MAX_PAYMENT_METHOD_LEN: usize = 50;  // Payment description
pub const MAX_DISPUTE_REASON_LEN: usize = 200; // Dispute explanation
pub const MAX_EVIDENCE_URL_LEN: usize = 300;   // Evidence document URL
pub const MAX_EVIDENCE_ITEMS: usize = 5;       // Max evidence per party
```

### Status Enums

**OfferStatus**:
```rust
pub enum OfferStatus {
    Created = 0,
    Listed = 1,
    Accepted = 2,
    FiatSent = 3,
    FiatConfirmed = 4,
    Completed = 5,
    Disputed = 6,
    Cancelled = 7,
}
```

**DisputeStatus**:
```rust
pub enum DisputeStatus {
    Open = 0,
    JurorsAssigned = 1,
    EvidencePhase = 2,
    VotingPhase = 3,
    Resolved = 4,
    Appealed = 5,
}
```

### Account Seeds

```rust
pub const ADMIN_SEED: &str = "admin";
pub const ESCROW_SEED: &str = "escrow";
pub const USER_PROFILE_SEED: &str = "user_profile";
pub const USER_REWARDS_SEED: &str = "user_rewards";
pub const REWARD_TOKEN_SEED: &str = "reward_token";
pub const REWARD_MINT_SEED: &str = "reward_mint";
pub const VOTE_SEED: &str = "vote";
```

## Account Size Calculations

Account sizes include discriminator (8 bytes) added by Anchor:

| Account | Base Size | With Discriminator |
|---------|-----------|-------------------|
| Admin | 33 | 41 |
| EscrowAccount | 33 | 41 |
| Offer | 157 | 165 |
| Dispute | 3,356 | 3,364 |
| Vote | 74 | 82 |
| UserProfile | 74 | 82 |
| RewardToken | 113 | 121 |
| UserRewards | 89 | 97 |

## Usage Patterns

### Creating Accounts

Most accounts use PDAs for deterministic addressing:

```typescript
// Derive user profile PDA
const [userProfilePDA, bump] = await PublicKey.findProgramAddress(
  [Buffer.from("user_profile"), userPubkey.toBuffer()],
  programId
);

// Derive escrow PDA
const [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
  [Buffer.from("escrow"), offerPubkey.toBuffer()],
  programId
);
```

### Account Relationships

```
Offer ←→ EscrowAccount (1:1)
Offer ←→ Dispute (0:1)
Dispute ←→ Vote (1:3)
User ←→ UserProfile (1:1)
User ←→ UserRewards (1:1)
```

For implementation examples and common patterns, see the [examples directory](./examples/) and [smart contracts documentation](./smart-contracts.md).