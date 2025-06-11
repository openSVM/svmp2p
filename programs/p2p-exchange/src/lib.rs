use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9");

#[program]
pub mod p2p_exchange {
    use super::*;

    // Offer Management Instructions
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

    pub fn list_offer(ctx: Context<ListOffer>) -> Result<()> {
        instructions::offers::list_offer(ctx)
    }

    pub fn accept_offer(ctx: Context<AcceptOffer>, security_bond: u64) -> Result<()> {
        instructions::offers::accept_offer(ctx, security_bond)
    }

    pub fn mark_fiat_sent(ctx: Context<MarkFiatSent>) -> Result<()> {
        instructions::offers::mark_fiat_sent(ctx)
    }

    pub fn confirm_fiat_receipt(ctx: Context<ConfirmFiatReceipt>) -> Result<()> {
        instructions::offers::confirm_fiat_receipt(ctx)
    }

    pub fn release_sol(ctx: Context<ReleaseSol>) -> Result<()> {
        instructions::offers::release_sol(ctx)
    }

    // Dispute Resolution Instructions
    pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
        instructions::disputes::open_dispute(ctx, reason)
    }

    pub fn assign_jurors(ctx: Context<AssignJurors>) -> Result<()> {
        instructions::disputes::assign_jurors(ctx)
    }

    pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence_url: String) -> Result<()> {
        instructions::disputes::submit_evidence(ctx, evidence_url)
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_for_buyer: bool) -> Result<()> {
        instructions::disputes::cast_vote(ctx, vote_for_buyer)
    }

    pub fn execute_verdict(ctx: Context<ExecuteVerdict>) -> Result<()> {
        instructions::disputes::execute_verdict(ctx)
    }

    // Reputation System Instructions
    pub fn create_reputation(ctx: Context<CreateReputation>) -> Result<()> {
        instructions::reputation::create_reputation(ctx)
    }

    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        successful_trade: bool,
        dispute_resolved: bool,
        dispute_won: bool,
    ) -> Result<()> {
        instructions::reputation::update_reputation(ctx, successful_trade, dispute_resolved, dispute_won)
    }
}
