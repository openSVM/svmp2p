use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
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
}