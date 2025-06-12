# Smart Contract Instructions API

**Version**: 1.0.0  
**Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

This document provides a comprehensive reference for all smart contract instructions in the SVMP2P exchange program. Each instruction includes detailed parameter definitions, account requirements, expected behaviors, and error conditions.

## Table of Contents

- [Admin Instructions](#admin-instructions)
- [Offer Management Instructions](#offer-management-instructions)
- [Dispute Resolution Instructions](#dispute-resolution-instructions)
- [Reputation System Instructions](#reputation-system-instructions)
- [Reward System Instructions](#reward-system-instructions)

---

## Admin Instructions

### `initialize_admin`

Initializes the admin account for the program. This instruction can only be called once during program deployment.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(
        init,
        payer = authority,
        space = Admin::LEN,
        seeds = [Admin::SEED.as_bytes()],
        bump
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
- Creates a new admin account using Program Derived Address (PDA)
- Sets the authority to the transaction signer
- Stores the PDA bump for future reference

**Events Emitted**: None

**Error Conditions**:
- If admin account already exists
- If insufficient funds for account creation
- If invalid authority signature

**Example Usage**:
```typescript
const [adminPDA] = await PublicKey.findProgramAddress(
  [Buffer.from("admin")],
  programId
);

await program.methods
  .initializeAdmin()
  .accounts({
    admin: adminPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

---

## Offer Management Instructions

### `create_offer`

Creates a new P2P exchange offer with escrowed SOL.

**Parameters**:
- `amount: u64` - SOL amount to sell (in lamports, must be > 0)
- `fiat_amount: u64` - Fiat currency amount requested (must be > 0)
- `fiat_currency: String` - Currency code (max 10 characters, e.g., "USD")
- `payment_method: String` - Payment method description (max 50 characters)
- `created_at: i64` - Unix timestamp of creation

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CreateOffer<'info> {
    #[account(
        init,
        payer = creator,
        space = Offer::LEN
    )]
    pub offer: Account<'info, Offer>,
    
    #[account(
        init,
        payer = creator,
        space = EscrowAccount::LEN,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Validates input parameters (amount > 0, valid strings)
2. Creates new offer account with CREATED status
3. Creates escrow account using offer-specific PDA
4. Transfers SOL from creator to escrow account
5. Sets offer metadata and timestamps

**Events Emitted**:
```rust
#[event]
pub struct OfferCreated {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub fiat_amount: u64,
    pub fiat_currency: String,
}
```

**Error Conditions**:
- `InvalidAmount`: Amount must be greater than zero
- `InputTooLong`: Currency or payment method too long
- `InvalidUtf8`: Invalid UTF-8 in string parameters
- `InsufficientFunds`: Not enough SOL for escrow + fees

**Example Usage**:
```typescript
const offerKeypair = Keypair.generate();
const [escrowPDA] = await PublicKey.findProgramAddress(
  [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
  programId
);

await program.methods
  .createOffer(
    new BN(1_000_000_000), // 1 SOL in lamports
    new BN(50_000), // $500.00 in cents
    "USD",
    "Bank transfer - Chase",
    new BN(Date.now() / 1000)
  )
  .accounts({
    offer: offerKeypair.publicKey,
    escrowAccount: escrowPDA,
    creator: seller.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([seller, offerKeypair])
  .rpc();
```

### `list_offer`

Makes an offer visible to the public marketplace.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct ListOffer<'info> {
    #[account(
        mut,
        has_one = seller @ P2PExchangeError::Unauthorized
    )]
    pub offer: Account<'info, Offer>,
    
    pub seller: Signer<'info>,
}
```

**Behavior**:
- Changes offer status from CREATED to LISTED
- Updates the `updated_at` timestamp
- Validates that only the seller can list their offer

**Events Emitted**:
```rust
#[event]
pub struct OfferListed {
    pub offer: Pubkey,
    pub seller: Pubkey,
}
```

**Error Conditions**:
- `Unauthorized`: Only offer creator can list the offer
- `InvalidOfferStatus`: Offer must be in CREATED status

### `accept_offer`

Accepts an existing offer and locks in a security bond.

**Parameters**:
- `security_bond: u64` - Additional security bond amount in lamports

**Accounts**:
```rust
#[derive(Accounts)]
pub struct AcceptOffer<'info> {
    #[account(
        mut,
        constraint = offer.status == OfferStatus::Listed as u8 @ P2PExchangeError::InvalidOfferStatus
    )]
    pub offer: Account<'info, Offer>,
    
    #[account(
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Validates offer is in LISTED status
2. Ensures buyer is not the seller
3. Transfers security bond from buyer to escrow
4. Updates offer status to ACCEPTED
5. Sets buyer field and updated timestamp

**Events Emitted**:
```rust
#[event]
pub struct OfferAccepted {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub security_bond: u64,
}
```

**Error Conditions**:
- `InvalidOfferStatus`: Offer must be LISTED
- `Unauthorized`: Seller cannot accept their own offer
- `InsufficientFunds`: Not enough SOL for security bond

### `mark_fiat_sent`

Marks fiat payment as sent by the buyer.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct MarkFiatSent<'info> {
    #[account(
        mut,
        has_one = buyer @ P2PExchangeError::Unauthorized,
        constraint = offer.status == OfferStatus::Accepted as u8 @ P2PExchangeError::InvalidOfferStatus
    )]
    pub offer: Account<'info, Offer>,
    
    pub buyer: Signer<'info>,
}
```

**Behavior**:
- Updates offer status to FIAT_SENT
- Records timestamp of fiat payment initiation
- Only the buyer can mark fiat as sent

**Events Emitted**:
```rust
#[event]
pub struct FiatMarkedSent {
    pub offer: Pubkey,
    pub buyer: Pubkey,
    pub timestamp: i64,
}
```

**Error Conditions**:
- `Unauthorized`: Only buyer can mark fiat sent
- `InvalidOfferStatus`: Offer must be ACCEPTED

### `confirm_fiat_receipt`

Confirms fiat payment receipt by the seller.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct ConfirmFiatReceipt<'info> {
    #[account(
        mut,
        has_one = seller @ P2PExchangeError::Unauthorized,
        constraint = offer.status == OfferStatus::FiatSent as u8 @ P2PExchangeError::InvalidOfferStatus
    )]
    pub offer: Account<'info, Offer>,
    
    pub seller: Signer<'info>,
}
```

**Behavior**:
- Updates offer status to FIAT_CONFIRMED
- Records confirmation timestamp
- Enables SOL release by seller

**Events Emitted**:
```rust
#[event]
pub struct FiatReceiptConfirmed {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}
```

**Error Conditions**:
- `Unauthorized`: Only seller can confirm receipt
- `InvalidOfferStatus`: Offer must be FIAT_SENT

### `release_sol`

Releases escrowed SOL to the buyer, completing the trade.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct ReleaseSol<'info> {
    #[account(
        mut,
        has_one = seller @ P2PExchangeError::Unauthorized,
        constraint = offer.status == OfferStatus::FiatConfirmed as u8 @ P2PExchangeError::InvalidOfferStatus
    )]
    pub offer: Account<'info, Offer>,
    
    #[account(
        mut,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    /// CHECK: Buyer account verified through offer.buyer
    #[account(
        mut,
        constraint = buyer.key() == offer.buyer.unwrap() @ P2PExchangeError::Unauthorized
    )]
    pub buyer: UncheckedAccount<'info>,
    
    pub seller: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Transfers escrowed SOL to buyer
2. Transfers security bond back to buyer
3. Updates offer status to COMPLETED
4. Records completion timestamp

**Events Emitted**:
```rust
#[event]
pub struct SolReleased {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}
```

**Error Conditions**:
- `Unauthorized`: Only seller can release SOL
- `InvalidOfferStatus`: Fiat must be confirmed first

---

## Dispute Resolution Instructions

### `open_dispute`

Opens a dispute for a trade requiring resolution.

**Parameters**:
- `reason: String` - Detailed dispute reason (max 200 characters)

**Accounts**:
```rust
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    
    #[account(
        init,
        payer = initiator,
        space = Dispute::LEN
    )]
    pub dispute: Account<'info, Dispute>,
    
    #[account(mut)]
    pub initiator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Validates offer can have dispute opened
2. Creates new dispute account
3. Sets dispute metadata and initial status
4. Links dispute to offer

**Events Emitted**:
```rust
#[event]
pub struct DisputeOpened {
    pub dispute: Pubkey,
    pub offer: Pubkey,
    pub initiator: Pubkey,
    pub reason: String,
}
```

**Error Conditions**:
- `DisputeAlreadyExists`: Offer already has an active dispute
- `InputTooLong`: Reason exceeds maximum length
- `Unauthorized`: Only trade participants can open disputes

### `assign_jurors`

Assigns three jurors to a dispute (admin-only operation).

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct AssignJurors<'info> {
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump = admin.bump,
        has_one = authority @ P2PExchangeError::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    
    pub authority: Signer<'info>,
    
    /// CHECK: Juror 1 public key
    pub juror1: UncheckedAccount<'info>,
    
    /// CHECK: Juror 2 public key  
    pub juror2: UncheckedAccount<'info>,
    
    /// CHECK: Juror 3 public key
    pub juror3: UncheckedAccount<'info>,
}
```

**Behavior**:
- Assigns three unique jurors to dispute
- Updates dispute status to JURORS_ASSIGNED
- Validates admin authority

**Events Emitted**:
```rust
#[event]
pub struct JurorsAssigned {
    pub dispute: Pubkey,
    pub jurors: [Pubkey; 3],
}
```

**Error Conditions**:
- `AdminRequired`: Only admin can assign jurors
- `InvalidDisputeStatus`: Dispute must be in OPEN status

### `submit_evidence`

Submits evidence for a dispute.

**Parameters**:
- `evidence_url: String` - URL to evidence document (max 300 characters)

**Accounts**:
```rust
#[derive(Accounts)]
pub struct SubmitEvidence<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    
    pub submitter: Signer<'info>,
}
```

**Behavior**:
1. Validates submitter is dispute participant
2. Adds evidence URL to appropriate array (buyer/seller)
3. Enforces maximum evidence limit per party

**Events Emitted**:
```rust
#[event]
pub struct EvidenceSubmitted {
    pub dispute: Pubkey,
    pub submitter: Pubkey,
    pub evidence_url: String,
}
```

**Error Conditions**:
- `Unauthorized`: Only dispute participants can submit evidence
- `TooManyEvidenceItems`: Maximum 5 evidence items per party
- `InputTooLong`: Evidence URL too long

### `cast_vote`

Casts a vote as an assigned juror.

**Parameters**:
- `vote_for_buyer: bool` - True if voting for buyer, false for seller

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    
    #[account(
        init_if_needed,
        payer = juror,
        space = Vote::LEN,
        seeds = [Vote::SEED.as_bytes(), dispute.key().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub vote_account: Account<'info, Vote>,
    
    #[account(mut)]
    pub juror: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Validates juror is assigned to dispute
2. Creates/updates vote account with PDA
3. Records vote and updates dispute tallies
4. Prevents double voting

**Events Emitted**:
```rust
#[event]
pub struct VoteCast {
    pub dispute: Pubkey,
    pub juror: Pubkey,
    pub vote_for_buyer: bool,
}
```

**Error Conditions**:
- `NotAJuror`: Signer is not assigned as juror
- `AlreadyVoted`: Juror has already cast their vote
- `InvalidDisputeStatus`: Voting not allowed in current state

### `execute_verdict`

Executes the final verdict and distributes funds (admin-only).

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct ExecuteVerdict<'info> {
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump = admin.bump,
        has_one = authority @ P2PExchangeError::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    
    #[account(
        mut,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    /// CHECK: Winner account determined by vote outcome
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,
    
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
1. Calculates final vote tally
2. Determines winner (majority vote required)
3. Transfers escrowed funds to winner
4. Updates dispute status to RESOLVED

**Events Emitted**:
```rust
#[event]
pub struct VerdictExecuted {
    pub dispute: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}
```

**Error Conditions**:
- `AdminRequired`: Only admin can execute verdict
- `TiedVote`: Cannot execute with tied vote (1-1-1)
- `InvalidDisputeStatus`: All jurors must have voted

---

## Reputation System Instructions

### `create_reputation`

Initializes a reputation account for a user.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CreateReputation<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
```

**Behavior**:
- Creates user profile with initial reputation values
- Sets up PDA for future reputation updates

**Events Emitted**:
```rust
#[event]
pub struct ReputationCreated {
    pub user: Pubkey,
}
```

### `update_reputation`

Updates user reputation based on trade outcomes (admin-only).

**Parameters**:
- `successful_trade: bool` - Whether trade completed successfully
- `dispute_resolved: bool` - Whether a dispute was resolved
- `dispute_won: bool` - Whether user won the dispute (if applicable)

**Accounts**:
```rust
#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump = admin.bump,
        has_one = authority @ P2PExchangeError::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(
        mut,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    /// CHECK: User whose reputation is being updated
    pub user: UncheckedAccount<'info>,
    
    pub authority: Signer<'info>,
}
```

**Behavior**:
1. Updates successful trade count
2. Adjusts reputation rating based on outcomes
3. Records dispute resolution history

**Events Emitted**:
```rust
#[event]
pub struct ReputationUpdated {
    pub user: Pubkey,
    pub successful_trades: u32,
    pub rating: u8,
}
```

**Error Conditions**:
- `AdminRequired`: Only admin can update reputation

---

## Reward System Instructions

### `create_reward_token`

Initializes the reward token system (admin-only).

**Parameters**:
- `reward_rate_per_trade: u64` - Tokens awarded per successful trade
- `reward_rate_per_vote: u64` - Tokens awarded per governance vote
- `min_trade_volume: u64` - Minimum trade volume to qualify for rewards

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CreateRewardToken<'info> {
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump = admin.bump,
        has_one = authority @ P2PExchangeError::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(
        init,
        payer = authority,
        space = RewardToken::LEN,
        seeds = [RewardToken::SEED.as_bytes()],
        bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(
        init,
        payer = authority,
        seeds = [b"reward_mint"],
        bump,
        mint::decimals = 6,
        mint::authority = reward_mint,
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    
    pub token_program: Program<'info, Token>,
    
    pub rent: Sysvar<'info, Rent>,
}
```

**Behavior**:
1. Creates reward token configuration account
2. Creates SPL token mint for rewards
3. Sets initial reward parameters

**Events Emitted**:
```rust
#[event]
pub struct RewardTokenCreated {
    pub mint: Pubkey,
    pub reward_rate_per_trade: u64,
    pub reward_rate_per_vote: u64,
}
```

### `create_user_rewards`

Initializes a user rewards account.

**Parameters**: None

**Accounts**:
```rust
#[derive(Accounts)]
pub struct CreateUserRewards<'info> {
    #[account(
        init,
        payer = user,
        space = UserRewards::LEN,
        seeds = [UserRewards::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_rewards: Account<'info, UserRewards>,
    
    #[account(
        init,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"reward_mint"],
        bump = reward_token.mint_bump
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [RewardToken::SEED.as_bytes()],
        bump = reward_token.bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    
    pub token_program: Program<'info, Token>,
    
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    pub rent: Sysvar<'info, Rent>,
}
```

**Behavior**:
- Creates user rewards tracking account
- Creates associated token account for receiving rewards

**Events Emitted**:
```rust
#[event]
pub struct UserRewardsCreated {
    pub user: Pubkey,
    pub token_account: Pubkey,
}
```

### `mint_trade_rewards`

Mints rewards for completed trades.

**Parameters**:
- `trade_volume: u64` - Volume of the completed trade

**Behavior**:
1. Validates trade completion
2. Calculates reward amount based on volume
3. Mints tokens to user's reward balance

**Events Emitted**:
```rust
#[event]
pub struct RewardsEarned {
    pub user: Pubkey,
    pub amount: u64,
    pub reward_type: String,
}
```

### `claim_rewards`

Claims accumulated rewards to user's token account.

**Parameters**: None

**Behavior**:
1. Transfers accumulated rewards to user's token account
2. Resets claimable balance
3. Records claim timestamp

**Events Emitted**:
```rust
#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub amount: u64,
}
```

**Error Conditions**:
- `NoRewardsToClaim`: User has no accumulated rewards

---

## Security Considerations

### Input Validation
- All string inputs are validated for UTF-8 encoding
- Length limits enforced on all text fields
- Numeric values checked for overflow conditions

### Access Control
- Admin-only operations protected by PDA verification
- User authorization verified through account ownership
- Cross-program invocation restrictions in place

### Economic Security
- Escrow accounts use deterministic PDAs
- Security bonds prevent spam and malicious behavior
- Rate limiting on sensitive operations

### State Management
- Status transitions strictly controlled
- Dispute resolution follows formal process
- Reputation updates require admin approval

---

For implementation examples and integration patterns, see the [examples directory](./examples/) and [transaction flows documentation](./transaction-flows.md).