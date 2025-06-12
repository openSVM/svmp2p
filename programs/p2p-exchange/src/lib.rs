//! # P2P Exchange Program
//! 
//! A decentralized peer-to-peer exchange program built on Solana using the Anchor framework.
//! This program facilitates secure trading between parties with escrow, dispute resolution,
//! and reputation management.
//!
//! ## Architecture
//!
//! - **Offers**: Trade offers with escrow-backed security
//! - **Disputes**: Multi-juror dispute resolution system  
//! - **Reputation**: User rating system based on trade history
//! - **Admin**: Centralized administration for critical operations
//!
//! ## Security Features
//!
//! - PDA-based escrow accounts with deterministic addressing
//! - Input validation and UTF-8 sanitization
//! - Anti-double-voting mechanisms using PDA vote accounts
//! - Admin-only access control for sensitive operations
//!
//! ## Usage
//!
//! 1. Create and list offers with escrowed SOL
//! 2. Accept offers with security bonds
//! 3. Complete fiat payments and release SOL
//! 4. Handle disputes through jury-based resolution
//! 5. Maintain reputation scores for all participants

use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9");

#[program]
pub mod p2p_exchange {
    use super::*;

    /// Initialize the admin account
    /// Only called once to set up program administration
    pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
        instructions::admin::initialize_admin(ctx)
    }

    /// Create a new P2P exchange offer with escrowed SOL
    /// 
    /// # Arguments
    /// * `amount` - SOL amount to sell (in lamports)
    /// * `fiat_amount` - Fiat currency amount requested
    /// * `fiat_currency` - Currency code (e.g., "USD", max 10 chars)
    /// * `payment_method` - Payment method description (max 50 chars)
    /// * `created_at` - Timestamp of creation
    pub fn create_offer(
        ctx: Context<CreateOffer>,
        amount: u64,
        fiat_amount: u64,
        fiat_currency: String,
        payment_method: String,
        created_at: i64,
    ) -> Result<()> {
        instructions::offers::create_offer(ctx, amount, fiat_amount, fiat_currency, payment_method, created_at)
    }

    /// Make an offer visible to the public
    pub fn list_offer(ctx: Context<ListOffer>) -> Result<()> {
        instructions::offers::list_offer(ctx)
    }

    /// Accept an offer and lock in security bond
    ///
    /// # Arguments  
    /// * `security_bond` - Additional bond amount (in lamports)
    pub fn accept_offer(ctx: Context<AcceptOffer>, security_bond: u64) -> Result<()> {
        instructions::offers::accept_offer(ctx, security_bond)
    }

    /// Mark fiat payment as sent by buyer
    pub fn mark_fiat_sent(ctx: Context<MarkFiatSent>) -> Result<()> {
        instructions::offers::mark_fiat_sent(ctx)
    }

    /// Confirm fiat payment received by seller
    pub fn confirm_fiat_receipt(ctx: Context<ConfirmFiatReceipt>) -> Result<()> {
        instructions::offers::confirm_fiat_receipt(ctx)
    }

    /// Release escrowed SOL to buyer (completes the trade)
    pub fn release_sol(ctx: Context<ReleaseSol>) -> Result<()> {
        instructions::offers::release_sol(ctx)
    }

    /// Open a dispute for a trade
    ///
    /// # Arguments
    /// * `reason` - Detailed reason for the dispute (max 200 chars)
    pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
        instructions::disputes::open_dispute(ctx, reason)
    }

    /// Assign 3 jurors to a dispute (admin-only)
    pub fn assign_jurors(ctx: Context<AssignJurors>) -> Result<()> {
        instructions::disputes::assign_jurors(ctx)
    }

    /// Submit evidence for a dispute
    ///
    /// # Arguments
    /// * `evidence_url` - URL to evidence document (max 300 chars, max 5 per party)
    pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence_url: String) -> Result<()> {
        instructions::disputes::submit_evidence(ctx, evidence_url)
    }

    /// Cast a vote as an assigned juror
    ///
    /// # Arguments
    /// * `vote_for_buyer` - true if voting for buyer, false for seller
    pub fn cast_vote(ctx: Context<CastVote>, vote_for_buyer: bool) -> Result<()> {
        instructions::disputes::cast_vote(ctx, vote_for_buyer)
    }

    /// Execute the final verdict and distribute funds (admin-only)
    /// Note: Tied votes (1-1-1) will be rejected and require re-voting
    pub fn execute_verdict(ctx: Context<ExecuteVerdict>) -> Result<()> {
        instructions::disputes::execute_verdict(ctx)
    }

    /// Initialize a reputation account for a user
    pub fn create_reputation(ctx: Context<CreateReputation>) -> Result<()> {
        instructions::reputation::create_reputation(ctx)
    }

    /// Update user reputation based on trade outcomes (admin-only)
    ///
    /// # Arguments
    /// * `successful_trade` - Whether the trade completed successfully
    /// * `dispute_resolved` - Whether a dispute was resolved
    /// * `dispute_won` - Whether the user won the dispute (if applicable)
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        successful_trade: bool,
        dispute_resolved: bool,
        dispute_won: bool,
    ) -> Result<()> {
        instructions::reputation::update_reputation(ctx, successful_trade, dispute_resolved, dispute_won)
    }
}
