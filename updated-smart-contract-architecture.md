# Solana SVM P2P Exchange - Updated Smart Contract Architecture

## Overview

This document outlines the expanded architecture for integrating the Solana smart contract with our P2P exchange frontend. The architecture follows the escrow-based model with dispute resolution capabilities, enabling secure peer-to-peer trading of SOL for fiat currencies across multiple SVM networks.

## Smart Contract Structure

### Core Components

1. **Program ID**: The unique identifier for our deployed Anchor program
2. **Accounts**:
   - `Offer`: Stores the details of each P2P exchange offer
   - `Escrow`: Holds the SOL funds and security bonds during the transaction process
   - `Dispute`: Stores dispute information when a conflict arises
   - `Juror`: Represents jurors selected for dispute resolution
   - `Vote`: Records juror votes on disputes
   - `Reputation`: Tracks user reputation scores

### Offer Account Structure

```rust
#[account]
pub struct Offer {
    pub seller: Pubkey,         // Wallet address of the seller
    pub buyer: Pubkey,          // Wallet address of the buyer (once accepted)
    pub amount: u64,            // Amount of SOL in lamports
    pub security_bond: u64,     // Security bond amount in lamports
    pub status: OfferStatus,    // Current state of the offer
    pub fiat_amount: u64,       // Fiat currency amount
    pub fiat_currency: String,  // Fiat currency type (USD, EUR, etc.)
    pub payment_method: String, // Payment method for fiat
    pub created_at: i64,        // Timestamp when offer was created
    pub updated_at: i64,        // Timestamp of last status update
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OfferStatus {
    Created,
    Listed,
    Accepted,
    AwaitingFiatPayment,
    FiatSent,
    SOLReleased,
    DisputeOpened,
    Completed,
    Cancelled
}
```

### Dispute Account Structure

```rust
#[account]
pub struct Dispute {
    pub offer: Pubkey,           // Reference to the offer in dispute
    pub initiator: Pubkey,       // User who initiated the dispute
    pub respondent: Pubkey,      // User responding to the dispute
    pub jurors: Vec<Pubkey>,     // Selected jurors for the dispute
    pub evidence_buyer: Vec<String>, // Evidence hashes provided by buyer
    pub evidence_seller: Vec<String>, // Evidence hashes provided by seller
    pub votes_for_buyer: u8,     // Number of votes favoring buyer
    pub votes_for_seller: u8,    // Number of votes favoring seller
    pub status: DisputeStatus,   // Current state of the dispute
    pub created_at: i64,         // Timestamp when dispute was created
    pub resolved_at: i64,        // Timestamp when dispute was resolved
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeStatus {
    Opened,
    JurorsAssigned,
    EvidenceSubmission,
    Voting,
    VerdictReached,
    Resolved
}
```

### Reputation Account Structure

```rust
#[account]
pub struct Reputation {
    pub user: Pubkey,           // User's wallet address
    pub successful_trades: u32, // Number of successful trades
    pub disputed_trades: u32,   // Number of disputed trades
    pub disputes_won: u32,      // Number of disputes won
    pub disputes_lost: u32,     // Number of disputes lost
    pub rating: u8,             // Overall rating (0-100)
    pub last_updated: i64,      // Timestamp of last update
}
```

## Program Instructions

### Offer Management

1. **Create Offer**:
   - Seller creates an offer specifying the SOL amount and fiat details
   - SOL is transferred to an escrow account
   - Offer status is set to `Created`

2. **List Offer**:
   - Seller makes the offer publicly available
   - Offer status changes to `Listed`

3. **Accept Offer**:
   - Buyer accepts an open offer
   - Buyer deposits security bond
   - Buyer's public key is recorded in the offer
   - Offer status changes to `Accepted`

4. **Mark Fiat Sent**:
   - Buyer indicates they have sent the fiat payment
   - Offer status changes to `AwaitingFiatPayment`

5. **Confirm Fiat Receipt**:
   - Seller confirms receipt of fiat payment
   - Offer status changes to `FiatSent`

6. **Release SOL**:
   - Escrow releases SOL to the buyer
   - Security bonds are returned
   - Offer status changes to `SOLReleased`

7. **Complete Trade**:
   - Final state after successful completion
   - Updates reputation for both parties
   - Offer status changes to `Completed`

8. **Cancel Offer**:
   - Cancels an offer (only possible in certain states)
   - Returns funds to appropriate parties
   - Offer status changes to `Cancelled`

### Dispute Resolution

1. **Open Dispute**:
   - Either party can open a dispute
   - Requires reason and initial evidence
   - Offer status changes to `DisputeOpened`
   - Creates a new Dispute account

2. **Assign Jurors**:
   - Randomly selects jurors from a pool
   - Updates dispute status to `JurorsAssigned`

3. **Submit Evidence**:
   - Both parties can submit evidence (documents, screenshots, etc.)
   - Evidence is stored as IPFS hashes
   - Dispute status changes to `EvidenceSubmission`

4. **Cast Vote**:
   - Jurors review evidence and cast votes
   - Each vote is recorded in a Vote account
   - Dispute status changes to `Voting`

5. **Reach Verdict**:
   - Once all jurors have voted, a verdict is reached
   - Majority vote determines the outcome
   - Dispute status changes to `VerdictReached`

6. **Resolve Dispute**:
   - Executes the verdict (release funds to buyer or return to seller)
   - Updates reputation for both parties
   - Dispute status changes to `Resolved`
   - Offer status changes to either `Completed` or `Cancelled`

## State Transition Diagram

```
                  ┌─────────┐
                  │ Created │
                  └────┬────┘
                       │ list_offer()
                       ▼
                  ┌─────────┐
                  │ Listed  │
                  └────┬────┘
                       │ accept_offer()
                       ▼
              ┌─────────────────┐
              │    Accepted     │
              └────────┬────────┘
                       │ mark_fiat_sent()
                       ▼
           ┌───────────────────────┐
           │  AwaitingFiatPayment  │
           └───────────┬───────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
    ┌─────────────┐        ┌─────────────┐
    │  FiatSent   │        │DisputeOpened│
    └──────┬──────┘        └──────┬──────┘
           │                      │
           │                      ▼
           │             ┌─────────────────┐
           │             │ JurorsAssigned  │
           │             └────────┬────────┘
           │                      │
           │                      ▼
           │             ┌─────────────────┐
           │             │EvidenceSubmission│
           │             └────────┬────────┘
           │                      │
           │                      ▼
           │             ┌─────────────────┐
           │             │     Voting      │
           │             └────────┬────────┘
           │                      │
           │                      ▼
           │             ┌─────────────────┐
           │             │ VerdictReached  │
           │             └────────┬────────┘
           │                      │
           │             ┌────────┴─────────┐
           │             │                  │
           │             ▼                  ▼
           │     ┌──────────────┐  ┌──────────────┐
           │     │Favor Buyer   │  │Favor Seller  │
           │     └───────┬──────┘  └──────┬───────┘
           │             │                │
           ▼             ▼                ▼
    ┌─────────────┐    ┌─────────────┐  ┌─────────────┐
    │  Completed  │◄───┤  SOLReleased│  │  Cancelled  │
    └─────────────┘    └─────────────┘  └─────────────┘
```

## Security Considerations

1. **Access Control**:
   - Only the seller can create, list, and confirm payment
   - Only the buyer can mark fiat as sent
   - Either party can open a dispute
   - Only assigned jurors can vote on disputes
   - Account validation for each operation

2. **Fund Security**:
   - SOL and security bonds are held in escrow until transaction completion
   - Escrow account is program-controlled
   - Verification of sufficient funds
   - Time-locked escrow for automatic resolution if no action is taken

3. **State Validation**:
   - Each instruction validates the current state
   - Prevents out-of-sequence operations
   - Timeouts for various states to prevent stuck transactions

4. **Juror Selection**:
   - Random selection from a pool of eligible jurors
   - Minimum reputation requirements for jurors
   - Juror rewards for participation
   - Penalties for not voting

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

### Transaction Flow Examples

1. **Create and List Offer**:
```typescript
const createAndListOffer = async (solAmount, fiatAmount, fiatCurrency, paymentMethod) => {
  // Convert SOL to lamports
  const lamports = solAmount * LAMPORTS_PER_SOL;
  
  // Generate a new account for the offer
  const offer = Keypair.generate();
  
  // Create escrow account
  const escrow = Keypair.generate();
  
  // Current timestamp
  const now = Math.floor(Date.now() / 1000);
  
  // Create offer
  await program.methods
    .createOffer(
      new BN(lamports),
      new BN(fiatAmount),
      fiatCurrency,
      paymentMethod,
      new BN(now)
    )
    .accounts({
      offer: offer.publicKey,
      seller: wallet.publicKey,
      escrowAccount: escrow.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([offer, escrow])
    .rpc();
    
  // List offer
  await program.methods
    .listOffer()
    .accounts({
      offer: offer.publicKey,
      seller: wallet.publicKey,
    })
    .rpc();
};
```

2. **Accept Offer**:
```typescript
const acceptOffer = async (offerPublicKey, escrowPublicKey) => {
  // Get offer details
  const offer = await program.account.offer.fetch(offerPublicKey);
  
  // Calculate security bond (e.g., 10% of transaction amount)
  const securityBond = offer.amount.toNumber() * 0.1;
  
  await program.methods
    .acceptOffer(new BN(securityBond))
    .accounts({
      offer: offerPublicKey,
      buyer: wallet.publicKey,
      escrowAccount: escrowPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
};
```

3. **Mark Fiat as Sent**:
```typescript
const markFiatSent = async (offerPublicKey) => {
  await program.methods
    .markFiatSent()
    .accounts({
      offer: offerPublicKey,
      buyer: wallet.publicKey,
    })
    .rpc();
};
```

4. **Confirm Fiat Receipt and Release SOL**:
```typescript
const confirmAndRelease = async (offerPublicKey, escrowPublicKey, buyerPublicKey) => {
  // Confirm fiat receipt
  await program.methods
    .confirmFiatReceipt()
    .accounts({
      offer: offerPublicKey,
      seller: wallet.publicKey,
    })
    .rpc();
    
  // Release SOL
  await program.methods
    .releaseSol()
    .accounts({
      offer: offerPublicKey,
      seller: wallet.publicKey,
      buyer: buyerPublicKey,
      escrowAccount: escrowPublicKey,
    })
    .rpc();
};
```

5. **Open Dispute**:
```typescript
const openDispute = async (offerPublicKey, reason, evidenceHash) => {
  // Generate a new account for the dispute
  const dispute = Keypair.generate();
  
  await program.methods
    .openDispute(reason, evidenceHash)
    .accounts({
      offer: offerPublicKey,
      dispute: dispute.publicKey,
      initiator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([dispute])
    .rpc();
};
```

6. **Submit Evidence**:
```typescript
const submitEvidence = async (disputePublicKey, evidenceHash) => {
  await program.methods
    .submitEvidence(evidenceHash)
    .accounts({
      dispute: disputePublicKey,
      submitter: wallet.publicKey,
    })
    .rpc();
};
```

7. **Cast Vote as Juror**:
```typescript
const castVote = async (disputePublicKey, voteForBuyer) => {
  // Generate a new account for the vote
  const vote = Keypair.generate();
  
  await program.methods
    .castVote(voteForBuyer)
    .accounts({
      dispute: disputePublicKey,
      juror: wallet.publicKey,
      vote: vote.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([vote])
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

// Fetch offers by status
const fetchOffersByStatus = async (status) => {
  const offers = await program.account.offer.all([
    {
      memcmp: {
        offset: 8 + 32 + 32 + 8 + 8, // Skip discriminator + seller + buyer + amount + security_bond
        bytes: status,
      },
    },
  ]);
  return offers;
};

// Fetch disputes
const fetchDisputes = async () => {
  const disputes = await program.account.dispute.all();
  return disputes;
};

// Subscribe to offer changes
const subscribeToOfferChanges = (offerPublicKey, callback) => {
  const subscriptionId = program.account.offer.subscribe(
    offerPublicKey,
    callback
  );
  return subscriptionId;
};

// Subscribe to dispute changes
const subscribeToDisputeChanges = (disputePublicKey, callback) => {
  const subscriptionId = program.account.dispute.subscribe(
    disputePublicKey,
    callback
  );
  return subscriptionId;
};
```

## Error Handling

```typescript
try {
  await createAndListOffer(1, 100, "USD", "Bank Transfer");
} catch (error) {
  if (error.code === 6001) {
    console.error("Insufficient funds for offer creation");
  } else if (error.code === 6002) {
    console.error("Invalid offer state transition");
  } else if (error.code === 6003) {
    console.error("Unauthorized action");
  } else if (error.code === 6004) {
    console.error("Dispute already exists for this offer");
  } else {
    console.error("Transaction failed:", error);
  }
}
```

## Reputation System

The reputation system tracks user behavior and provides a trust score:

```typescript
// Update reputation after successful trade
const updateReputationAfterTrade = async (userPublicKey) => {
  // Fetch existing reputation or create new one
  let reputation;
  try {
    reputation = await program.account.reputation.fetch(userPublicKey);
  } catch (error) {
    // Create new reputation account if it doesn't exist
    const reputationAccount = Keypair.generate();
    
    await program.methods
      .createReputation()
      .accounts({
        reputation: reputationAccount.publicKey,
        user: userPublicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([reputationAccount])
      .rpc();
      
    reputation = await program.account.reputation.fetch(reputationAccount.publicKey);
  }
  
  // Update reputation
  await program.methods
    .updateReputation(true, false, false, false)
    .accounts({
      reputation: reputation.publicKey,
      updater: wallet.publicKey,
    })
    .rpc();
};
```

## Future Enhancements

1. **Enhanced Dispute Resolution**:
   - Appeal process for disputed verdicts
   - Specialized juror selection based on expertise
   - Staking mechanism for jurors

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

5. **Advanced Reputation System**:
   - Weighted ratings based on transaction volume
   - Reputation staking for high-value trades
   - Reputation recovery mechanisms
