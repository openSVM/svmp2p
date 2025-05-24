# Smart Contract API Documentation

## Overview
This document provides detailed information about the Solana smart contract API for the SVMP2P platform. It covers all available functions, their parameters, return values, and error conditions.

## Table of Contents
- [Account Structures](#account-structures)
- [Instructions](#instructions)
- [Error Codes](#error-codes)
- [Usage Examples](#usage-examples)
- [Security Considerations](#security-considerations)

## Account Structures

### OfferAccount
Represents a trading offer in the system.

```rust
pub struct OfferAccount {
    pub creator: Pubkey,
    pub asset_type: AssetType,
    pub amount: u64,
    pub price: u64,
    pub payment_methods: Vec<PaymentMethod>,
    pub terms: String,
    pub status: OfferStatus,
    pub created_at: i64,
    pub updated_at: i64,
}
```

### TradeAccount
Represents an active trade between two parties.

```rust
pub struct TradeAccount {
    pub offer_id: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub price: u64,
    pub status: TradeStatus,
    pub escrow_account: Pubkey,
    pub created_at: i64,
    pub updated_at: i64,
    pub completion_deadline: i64,
}
```

### UserProfileAccount
Stores user profile and reputation information.

```rust
pub struct UserProfileAccount {
    pub user: Pubkey,
    pub reputation_score: u32,
    pub successful_trades: u32,
    pub disputed_trades: u32,
    pub joined_at: i64,
    pub last_active: i64,
}
```

### DisputeAccount
Represents a dispute between trading parties.

```rust
pub struct DisputeAccount {
    pub trade_id: Pubkey,
    pub initiator: Pubkey,
    pub respondent: Pubkey,
    pub reason: String,
    pub evidence: String,
    pub status: DisputeStatus,
    pub resolution: Option<DisputeResolution>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

## Instructions

### CreateOffer
Creates a new trading offer.

**Parameters:**
- `asset_type`: Type of asset being offered
- `amount`: Amount of the asset
- `price`: Price per unit
- `payment_methods`: Accepted payment methods
- `terms`: Terms and conditions of the offer

**Accounts Required:**
- `offer`: Offer account (write)
- `creator`: Offer creator (signer)
- `system_program`: System program

**Returns:**
- Offer public key

**Errors:**
- `InvalidAmount`: Amount must be greater than zero
- `InvalidPrice`: Price must be greater than zero
- `InvalidTerms`: Terms cannot be empty

### UpdateOffer
Updates an existing offer.

**Parameters:**
- `amount`: New amount (optional)
- `price`: New price (optional)
- `payment_methods`: New payment methods (optional)
- `terms`: New terms (optional)

**Accounts Required:**
- `offer`: Offer account (write)
- `creator`: Offer creator (signer)

**Errors:**
- `OfferNotFound`: Offer does not exist
- `Unauthorized`: Only the creator can update the offer
- `InvalidOfferStatus`: Cannot update completed or cancelled offers

### CancelOffer
Cancels an existing offer.

**Accounts Required:**
- `offer`: Offer account (write)
- `creator`: Offer creator (signer)

**Errors:**
- `OfferNotFound`: Offer does not exist
- `Unauthorized`: Only the creator can cancel the offer
- `InvalidOfferStatus`: Cannot cancel offers that are already in a trade

### AcceptOffer
Accepts an offer and creates a trade.

**Parameters:**
- `amount`: Amount to trade (can be partial)

**Accounts Required:**
- `offer`: Offer account (write)
- `trade`: Trade account (write)
- `buyer`: Buyer account (signer)
- `escrow`: Escrow account (write)
- `system_program`: System program

**Returns:**
- Trade public key

**Errors:**
- `OfferNotFound`: Offer does not exist
- `InvalidOfferStatus`: Offer is not available
- `InsufficientFunds`: Buyer has insufficient funds
- `AmountTooLarge`: Requested amount exceeds offer amount

### CompleteTrade
Completes a trade and releases funds.

**Accounts Required:**
- `trade`: Trade account (write)
- `seller`: Seller account (write)
- `buyer`: Buyer account (signer)
- `escrow`: Escrow account (write)
- `seller_token_account`: Seller token account (write)
- `system_program`: System program

**Errors:**
- `TradeNotFound`: Trade does not exist
- `Unauthorized`: Only the buyer can complete the trade
- `InvalidTradeStatus`: Trade is not in progress

### InitiateDispute
Initiates a dispute for a trade.

**Parameters:**
- `reason`: Reason for the dispute
- `evidence`: Evidence supporting the claim

**Accounts Required:**
- `dispute`: Dispute account (write)
- `trade`: Trade account (write)
- `initiator`: Dispute initiator (signer)
- `system_program`: System program

**Returns:**
- Dispute public key

**Errors:**
- `TradeNotFound`: Trade does not exist
- `Unauthorized`: Only trade participants can initiate disputes
- `InvalidTradeStatus`: Cannot dispute completed or cancelled trades
- `DisputeAlreadyExists`: A dispute already exists for this trade

### ResolveDispute
Resolves a dispute.

**Parameters:**
- `resolution`: Resolution decision
- `notes`: Resolution notes

**Accounts Required:**
- `dispute`: Dispute account (write)
- `trade`: Trade account (write)
- `resolver`: Dispute resolver (signer)
- `escrow`: Escrow account (write)
- `seller`: Seller account (write)
- `buyer`: Buyer account (write)
- `system_program`: System program

**Errors:**
- `DisputeNotFound`: Dispute does not exist
- `Unauthorized`: Only authorized resolvers can resolve disputes
- `InvalidDisputeStatus`: Dispute is already resolved

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidAmount | Amount must be greater than zero |
| 6001 | InvalidPrice | Price must be greater than zero |
| 6002 | InvalidTerms | Terms cannot be empty |
| 6003 | OfferNotFound | Offer does not exist |
| 6004 | Unauthorized | User is not authorized for this action |
| 6005 | InvalidOfferStatus | Offer status does not allow this action |
| 6006 | InsufficientFunds | Insufficient funds for this action |
| 6007 | AmountTooLarge | Requested amount exceeds available amount |
| 6008 | TradeNotFound | Trade does not exist |
| 6009 | InvalidTradeStatus | Trade status does not allow this action |
| 6010 | DisputeAlreadyExists | A dispute already exists for this trade |
| 6011 | DisputeNotFound | Dispute does not exist |
| 6012 | InvalidDisputeStatus | Dispute status does not allow this action |
| 6013 | DeadlineExceeded | Action deadline has been exceeded |
| 6014 | InvalidEscrow | Escrow account is invalid |
| 6015 | SystemError | Internal system error |

## Usage Examples

### Creating an Offer

```javascript
const createOfferInstruction = await program.methods
  .createOffer(
    { sol: {} }, // asset_type
    new BN(1_000_000_000), // amount (1 SOL in lamports)
    new BN(50_000_000), // price (50 USDC in smallest units)
    [{ bankTransfer: {} }, { usdc: {} }], // payment_methods
    "Payment must be completed within 30 minutes" // terms
  )
  .accounts({
    offer: offerAccount.publicKey,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([offerAccount])
  .rpc();
```

### Accepting an Offer

```javascript
const acceptOfferInstruction = await program.methods
  .acceptOffer(
    new BN(500_000_000) // amount (0.5 SOL in lamports)
  )
  .accounts({
    offer: offerPublicKey,
    trade: tradeAccount.publicKey,
    buyer: wallet.publicKey,
    escrow: escrowAccount.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([tradeAccount])
  .rpc();
```

### Completing a Trade

```javascript
const completeTradeInstruction = await program.methods
  .completeTrade()
  .accounts({
    trade: tradePublicKey,
    seller: sellerPublicKey,
    buyer: wallet.publicKey,
    escrow: escrowPublicKey,
    sellerTokenAccount: sellerTokenAccountPublicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Security Considerations

### Time-Based Security
- All trades have a completion deadline
- Funds can be automatically returned if the deadline is exceeded
- Timestamps are based on Solana's on-chain clock

### Access Control
- Only offer creators can update or cancel their offers
- Only trade participants can initiate disputes
- Only authorized resolvers can resolve disputes

### Fund Security
- All funds are held in escrow accounts
- Escrow accounts are owned by the program
- Funds can only be released according to program rules

### Input Validation
- All inputs are validated before processing
- Amount and price must be greater than zero
- Terms cannot be empty
- Status transitions are strictly controlled

### Rate Limiting
- The program includes rate limiting to prevent spam
- Users are limited in the number of offers they can create
- Dispute initiation is limited to prevent abuse
