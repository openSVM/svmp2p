# Solana SVM P2P Exchange - Smart Contract Architecture

## Overview

This document outlines the architecture for integrating the Solana smart contract with our P2P exchange frontend. The architecture follows the escrow-based model defined in the provided Anchor program, enabling secure peer-to-peer trading of SOL for fiat currencies across multiple SVM networks.

## Smart Contract Structure

### Core Components

1. **Program ID**: The unique identifier for our deployed Anchor program
2. **Accounts**:
   - `Offer`: Stores the details of each P2P exchange offer
   - `Escrow`: Holds the SOL funds during the transaction process

### Offer Account Structure

```rust
#[account]
pub struct Offer {
    pub seller: Pubkey,      // Wallet address of the seller
    pub buyer: Pubkey,       // Wallet address of the buyer (once accepted)
    pub amount: u64,         // Amount of SOL in lamports
    pub status: OfferStatus, // Current state of the offer
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OfferStatus {
    Open,
    AwaitingFiat,
    PaymentConfirmed,
    Completed,
    Dispute,
}
```

### Program Instructions

1. **Create Offer**:
   - Seller creates an offer specifying the SOL amount
   - SOL is transferred to an escrow account
   - Offer status is set to `Open`

2. **Accept Offer**:
   - Buyer accepts an open offer
   - Buyer's public key is recorded in the offer
   - Offer status changes to `AwaitingFiat`

3. **Confirm Payment**:
   - Seller confirms receipt of fiat payment
   - Only the seller can confirm payment
   - Offer status changes to `PaymentConfirmed`

4. **Release Funds**:
   - Escrow releases SOL to the buyer
   - Offer status changes to `Completed`

5. **Dispute Resolution** (future enhancement):
   - Either party can raise a dispute
   - Offer status changes to `Dispute`
   - Requires arbitration mechanism

## State Transition Diagram

```
                  ┌─────────┐
                  │  Open   │
                  └────┬────┘
                       │ accept_offer()
                       ▼
              ┌─────────────────┐
              │  AwaitingFiat   │
              └────────┬────────┘
                       │ confirm_payment()
                       ▼
           ┌───────────────────────┐
           │   PaymentConfirmed    │
           └───────────┬───────────┘
                       │ release_funds()
                       ▼
                ┌─────────────┐
                │  Completed  │
                └─────────────┘
```

## Security Considerations

1. **Access Control**:
   - Only the seller can create and confirm payment
   - Only the buyer can release funds
   - Account validation for each operation

2. **Fund Security**:
   - SOL is held in escrow until transaction completion
   - Escrow account is program-controlled
   - Verification of sufficient funds

3. **State Validation**:
   - Each instruction validates the current state
   - Prevents out-of-sequence operations

## Multi-Network Support

The architecture supports multiple SVM networks:

1. **Network-Specific Program Deployment**:
   - Deploy the same program to each SVM network
   - Track program IDs for each network

2. **Network Selection**:
   - UI allows selection of network
   - Connection parameters adjusted based on network

3. **Network-Specific Parameters**:
   - Gas fees
   - Confirmation times
   - Network status

## Frontend Integration

### Wallet Connection

```typescript
// Initialize wallet connection
const wallet = useWallet();
const { connection } = useConnection();

// Create Anchor provider
const provider = new AnchorProvider(
  connection,
  wallet,
  { preflightCommitment: 'processed' }
);

// Initialize program with IDL
const program = new Program(idl, PROGRAM_ID, provider);
```

### Transaction Flow

1. **Create Offer**:
```typescript
const createOffer = async (amount) => {
  // Convert SOL to lamports
  const lamports = amount * LAMPORTS_PER_SOL;
  
  // Generate a new account for the offer
  const offer = Keypair.generate();
  
  // Create escrow account
  const escrow = Keypair.generate();
  
  // Send transaction
  await program.methods
    .createOffer(new BN(lamports))
    .accounts({
      offer: offer.publicKey,
      seller: wallet.publicKey,
      escrowAccount: escrow.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([offer, escrow])
    .rpc();
};
```

2. **Accept Offer**:
```typescript
const acceptOffer = async (offerPublicKey) => {
  await program.methods
    .acceptOffer()
    .accounts({
      offer: offerPublicKey,
      buyer: wallet.publicKey,
    })
    .rpc();
};
```

3. **Confirm Payment**:
```typescript
const confirmPayment = async (offerPublicKey) => {
  await program.methods
    .confirmPayment()
    .accounts({
      offer: offerPublicKey,
      seller: wallet.publicKey,
    })
    .rpc();
};
```

4. **Release Funds**:
```typescript
const releaseFunds = async (offerPublicKey, escrowPublicKey, buyerPublicKey) => {
  await program.methods
    .releaseFunds()
    .accounts({
      offer: offerPublicKey,
      buyer: buyerPublicKey,
      escrowAccount: escrowPublicKey,
    })
    .rpc();
};
```

## Account Fetching and Monitoring

```typescript
// Fetch all offers
const fetchOffers = async () => {
  const offers = await program.account.offer.all();
  return offers;
};

// Fetch offers by seller
const fetchSellerOffers = async (sellerPublicKey) => {
  const offers = await program.account.offer.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: sellerPublicKey.toBase58(),
      },
    },
  ]);
  return offers;
};

// Subscribe to account changes
const subscribeToOfferChanges = (offerPublicKey, callback) => {
  const subscriptionId = program.account.offer.subscribe(
    offerPublicKey,
    callback
  );
  return subscriptionId;
};
```

## Error Handling

```typescript
try {
  await createOffer(1); // Create offer for 1 SOL
} catch (error) {
  if (error.code === 6001) {
    console.error("Offer is not open for acceptance");
  } else if (error.code === 6002) {
    console.error("Offer is in an invalid state");
  } else if (error.code === 6003) {
    console.error("Escrow account has insufficient funds");
  } else {
    console.error("Transaction failed:", error);
  }
}
```

## Future Enhancements

1. **Dispute Resolution System**:
   - Third-party arbitration
   - Time-locked escrow release
   - Reputation system

2. **Multi-Token Support**:
   - Support for SPL tokens beyond SOL
   - Token-specific escrow accounts

3. **Cross-Network Bridging**:
   - Enable trades between different SVM networks
   - Utilize cross-chain messaging protocols

4. **Enhanced Security**:
   - Multi-signature requirements for high-value trades
   - Time-based automatic cancellation
   - Fraud detection mechanisms
