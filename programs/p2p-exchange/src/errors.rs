use anchor_lang::prelude::*;

#[error_code]
pub enum P2PExchangeError {
    #[msg("Invalid offer status for this operation")]
    InvalidOfferStatus,
    #[msg("Invalid dispute status for this operation")]
    InvalidDisputeStatus,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("Juror has already voted")]
    AlreadyVoted,
    #[msg("You are not a juror for this dispute")]
    NotAJuror,
    #[msg("A dispute already exists for this offer")]
    DisputeAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Input string too long")]
    InputTooLong,
    #[msg("Admin authority required")]
    AdminRequired,
    #[msg("Too many evidence items")]
    TooManyEvidenceItems,
    #[msg("Invalid UTF-8 string")]
    InvalidUtf8,
    #[msg("Vote is tied, cannot execute verdict")]
    TiedVote,
    #[msg("Math operation resulted in overflow")]
    MathOverflow,
    #[msg("No rewards available to claim")]
    NoRewardsToClaim,
    #[msg("Reward token not initialized")]
    RewardTokenNotInitialized,
    #[msg("Too many requests - rate limit exceeded")]
    TooManyRequests,
}

// Maintain backward compatibility
pub use P2PExchangeError as ErrorCode;