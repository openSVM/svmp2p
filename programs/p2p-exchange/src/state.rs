use anchor_lang::prelude::*;

declare_id!("FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9");

#[account]
pub struct Admin {
    pub authority: Pubkey,
    pub bump: u8,
}

impl Admin {
    pub const LEN: usize = 32 + // authority
                           1;   // bump

    pub const SEED: &'static str = "admin";
}

#[account]
pub struct EscrowAccount {
    pub offer: Pubkey,
    pub bump: u8,
}

impl EscrowAccount {
    pub const LEN: usize = 32 + // offer
                           1;   // bump

    pub const SEED: &'static str = "escrow";
}

#[account]
pub struct Offer {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub amount: u64,
    pub security_bond: u64,
    pub status: u8,
    pub fiat_amount: u64,
    pub fiat_currency: String,
    pub payment_method: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub dispute_id: Option<Pubkey>,
}

impl Offer {
    pub const LEN: usize = 32 + // seller
                           33 + // buyer (Option<Pubkey>)
                           8 +  // amount
                           8 +  // security_bond
                           1 +  // status
                           8 +  // fiat_amount
                           4 + MAX_FIAT_CURRENCY_LEN + // fiat_currency (with length prefix)
                           4 + MAX_PAYMENT_METHOD_LEN + // payment_method (with length prefix)
                           8 +  // created_at
                           8 +  // updated_at
                           33;  // dispute_id (Option<Pubkey>)
}

#[account]
pub struct Dispute {
    pub offer: Pubkey,
    pub initiator: Pubkey,
    pub respondent: Pubkey,
    pub reason: String,
    pub status: u8,
    pub jurors: [Pubkey; 3],
    pub evidence_buyer: [String; MAX_EVIDENCE_ITEMS],
    pub evidence_buyer_count: u8,
    pub evidence_seller: [String; MAX_EVIDENCE_ITEMS],
    pub evidence_seller_count: u8,
    pub votes_for_buyer: u8,
    pub votes_for_seller: u8,
    pub created_at: i64,
    pub resolved_at: i64,
}

impl Dispute {
    pub const LEN: usize = 32 + // offer
                           32 + // initiator
                           32 + // respondent
                           4 + MAX_DISPUTE_REASON_LEN + // reason (with length prefix)
                           1 +  // status
                           96 + // jurors (3 * 32)
                           (4 + MAX_EVIDENCE_URL_LEN) * MAX_EVIDENCE_ITEMS + // evidence_buyer (fixed array with length prefixes)
                           1 +  // evidence_buyer_count
                           (4 + MAX_EVIDENCE_URL_LEN) * MAX_EVIDENCE_ITEMS + // evidence_seller (fixed array with length prefixes)
                           1 +  // evidence_seller_count
                           1 +  // votes_for_buyer
                           1 +  // votes_for_seller
                           8 +  // created_at
                           8;   // resolved_at
}

#[account]
pub struct Vote {
    pub dispute: Pubkey,
    pub juror: Pubkey,
    pub vote_for_buyer: bool,
    pub timestamp: i64,
}

impl Vote {
    pub const LEN: usize = 32 + // dispute
                           32 + // juror
                           1 +  // vote_for_buyer
                           8;   // timestamp
}

#[account]
pub struct Reputation {
    pub user: Pubkey,
    pub successful_trades: u32,
    pub disputed_trades: u32,
    pub disputes_won: u32,
    pub disputes_lost: u32,
    pub rating: u8,
    pub last_updated: i64,
}

impl Reputation {
    pub const LEN: usize = 32 + // user
                           4 +  // successful_trades
                           4 +  // disputed_trades
                           4 +  // disputes_won
                           4 +  // disputes_lost
                           1 +  // rating
                           8;   // last_updated
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OfferStatus {
    Created,
    Listed,
    Accepted,
    FiatSent,
    SolReleased,
    DisputeOpened,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeStatus {
    Opened,
    JurorsAssigned,
    EvidenceSubmission,
    Voting,
    VerdictReached,
    Resolved,
}

// Input validation constants
pub const MAX_FIAT_CURRENCY_LEN: usize = 10;  // e.g., "USD", "EUR"
pub const MAX_PAYMENT_METHOD_LEN: usize = 50; // e.g., "Bank Transfer"
pub const MAX_DISPUTE_REASON_LEN: usize = 200;
pub const MAX_EVIDENCE_URL_LEN: usize = 300;
pub const MAX_EVIDENCE_ITEMS: usize = 5; // Maximum evidence items per party

// Events
#[event]
pub struct OfferCreated {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub fiat_amount: u64,
    pub fiat_currency: String,
}

#[event]
pub struct OfferAccepted {
    pub offer: Pubkey,
    pub buyer: Pubkey,
    pub security_bond: u64,
}

#[event]
pub struct FiatSent {
    pub offer: Pubkey,
    pub buyer: Pubkey,
}

#[event]
pub struct FiatReceiptConfirmed {
    pub offer: Pubkey,
    pub seller: Pubkey,
}

#[event]
pub struct SolReleased {
    pub offer: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DisputeOpened {
    pub dispute: Pubkey,
    pub offer: Pubkey,
    pub initiator: Pubkey,
    pub reason: String,
}

#[event]
pub struct JurorsAssigned {
    pub dispute: Pubkey,
    pub jurors: [Pubkey; 3],
}

#[event]
pub struct EvidenceSubmitted {
    pub dispute: Pubkey,
    pub submitter: Pubkey,
    pub evidence_url: String,
}

#[event]
pub struct VoteCast {
    pub dispute: Pubkey,
    pub juror: Pubkey,
    pub vote_for_buyer: bool,
}

#[event]
pub struct VerdictExecuted {
    pub dispute: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ReputationUpdated {
    pub user: Pubkey,
    pub successful_trades: u32,
    pub rating: u8,
}

#[account]
pub struct RewardToken {
    pub authority: Pubkey,
    pub mint: Pubkey,                     // The SPL token mint
    pub total_supply: u64,
    pub reward_rate_per_trade: u64,      // Tokens per successful trade
    pub reward_rate_per_vote: u64,       // Tokens per governance vote
    pub min_trade_volume: u64,           // Minimum volume to qualify for rewards
    pub created_at: i64,
    pub bump: u8,
}

impl RewardToken {
    pub const LEN: usize = 32 + // authority
                           32 + // mint
                           8 +  // total_supply
                           8 +  // reward_rate_per_trade
                           8 +  // reward_rate_per_vote
                           8 +  // min_trade_volume
                           8 +  // created_at
                           1;   // bump

    pub const SEED: &'static str = "reward_token";
}

#[account]
pub struct UserRewards {
    pub user: Pubkey,
    pub total_earned: u64,
    pub total_claimed: u64,
    pub unclaimed_balance: u64,
    pub trading_volume: u64,             // Cumulative trading volume
    pub governance_votes: u32,           // Total governance votes cast
    pub last_trade_reward: i64,          // Timestamp of last trade reward
    pub last_vote_reward: i64,           // Timestamp of last vote reward
    pub bump: u8,
}

impl UserRewards {
    pub const LEN: usize = 32 + // user
                           8 +  // total_earned
                           8 +  // total_claimed
                           8 +  // unclaimed_balance
                           8 +  // trading_volume
                           4 +  // governance_votes
                           8 +  // last_trade_reward
                           8 +  // last_vote_reward
                           1;   // bump

    pub const SEED: &'static str = "user_rewards";
}

// New events for reward system
#[event]
pub struct RewardTokenCreated {
    pub authority: Pubkey,
    pub reward_rate_per_trade: u64,
    pub reward_rate_per_vote: u64,
}

#[event]
pub struct RewardsEarned {
    pub user: Pubkey,
    pub amount: u64,
    pub reason: String, // "trade" or "vote"
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardTokenUpdated {
    pub authority: Pubkey,
    pub reward_rate_per_trade: u64,
    pub reward_rate_per_vote: u64,
    pub min_trade_volume: u64,
    pub timestamp: i64,
}

// Events for monitoring reward system
#[event]
pub struct RewardEligible {
    pub users: Vec<Pubkey>,
    pub trade_volume: u64,
    pub reward_type: String, // "trade" or "vote"
    pub timestamp: i64,
}

#[event]
pub struct RewardSystemFailure {
    pub users: Vec<Pubkey>,
    pub trade_volume: u64,
    pub reward_type: String,
    pub error: String,
    pub timestamp: i64,
}