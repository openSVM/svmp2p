use anchor_lang::prelude::*;
use crate::state::{Offer, Dispute, Vote, OfferStatus, DisputeStatus};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(init, payer = initiator, space = 8 + Dispute::LEN)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut)]
    pub initiator: Signer<'info>,
    /// CHECK: This is the respondent in the dispute
    pub respondent: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignJurors<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    /// CHECK: This is juror 1
    pub juror1: AccountInfo<'info>,
    /// CHECK: This is juror 2
    pub juror2: AccountInfo<'info>,
    /// CHECK: This is juror 3
    pub juror3: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitEvidence<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub submitter: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub juror: Signer<'info>,
    #[account(init, payer = juror, space = 8 + Vote::LEN)]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteVerdict<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    /// CHECK: This is the escrow account that holds the SOL
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    /// CHECK: This is the buyer
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// CHECK: This is the seller
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let offer = &mut ctx.accounts.offer;
    let initiator = &ctx.accounts.initiator;
    let respondent = &ctx.accounts.respondent;
    let clock = Clock::get()?;

    // Validate that the offer doesn't already have a dispute
    if offer.dispute_id.is_some() {
        return Err(error!(ErrorCode::DisputeAlreadyExists));
    }

    // Validate that initiator is either buyer or seller
    if offer.seller != initiator.key() && offer.buyer != initiator.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Set respondent as the other party
    let respondent_key = if offer.seller == initiator.key() {
        offer.buyer
    } else {
        offer.seller
    };

    if respondent_key != respondent.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Initialize dispute data
    dispute.offer = offer.key();
    dispute.initiator = initiator.key();
    dispute.respondent = respondent.key();
    dispute.reason = reason;
    dispute.status = DisputeStatus::Opened as u8;
    dispute.jurors = [Pubkey::default(); 3];
    dispute.evidence_buyer = Vec::new();
    dispute.evidence_seller = Vec::new();
    dispute.votes_for_buyer = 0;
    dispute.votes_for_seller = 0;
    dispute.created_at = clock.unix_timestamp;
    dispute.resolved_at = 0;

    // Update offer to link to dispute
    offer.dispute_id = Some(dispute.key());
    offer.status = OfferStatus::DisputeOpened as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn assign_jurors(ctx: Context<AssignJurors>) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let juror1 = &ctx.accounts.juror1;
    let juror2 = &ctx.accounts.juror2;
    let juror3 = &ctx.accounts.juror3;

    // Validate dispute status
    if dispute.status != DisputeStatus::Opened as u8 {
        return Err(error!(ErrorCode::InvalidDisputeStatus));
    }

    // Assign jurors
    dispute.jurors[0] = juror1.key();
    dispute.jurors[1] = juror2.key();
    dispute.jurors[2] = juror3.key();
    dispute.status = DisputeStatus::JurorsAssigned as u8;

    Ok(())
}

pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence_url: String) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let submitter = &ctx.accounts.submitter;

    // Validate dispute status
    if dispute.status != DisputeStatus::JurorsAssigned as u8 && dispute.status != DisputeStatus::EvidenceSubmission as u8 {
        return Err(error!(ErrorCode::InvalidDisputeStatus));
    }

    // Validate submitter is a party to the dispute
    if dispute.initiator != submitter.key() && dispute.respondent != submitter.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Add evidence to appropriate list
    if dispute.initiator == submitter.key() {
        dispute.evidence_buyer.push(evidence_url);
    } else {
        dispute.evidence_seller.push(evidence_url);
    }

    // Update status if first evidence submission
    if dispute.status == DisputeStatus::JurorsAssigned as u8 {
        dispute.status = DisputeStatus::EvidenceSubmission as u8;
    }

    Ok(())
}

pub fn cast_vote(ctx: Context<CastVote>, vote_for_buyer: bool) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let juror = &ctx.accounts.juror;
    let vote = &mut ctx.accounts.vote;
    let clock = Clock::get()?;

    // Validate dispute status
    if dispute.status != DisputeStatus::EvidenceSubmission as u8 && dispute.status != DisputeStatus::Voting as u8 {
        return Err(error!(ErrorCode::InvalidDisputeStatus));
    }

    // Validate juror is assigned to this dispute
    if !dispute.jurors.contains(&juror.key()) {
        return Err(error!(ErrorCode::NotAJuror));
    }

    // Initialize vote data
    vote.dispute = dispute.key();
    vote.juror = juror.key();
    vote.vote_for_buyer = vote_for_buyer;
    vote.timestamp = clock.unix_timestamp;

    // Update vote counts
    if vote_for_buyer {
        dispute.votes_for_buyer += 1;
    } else {
        dispute.votes_for_seller += 1;
    }

    // Update status if first vote
    if dispute.status == DisputeStatus::EvidenceSubmission as u8 {
        dispute.status = DisputeStatus::Voting as u8;
    }

    // Check if verdict is reached (majority of 3)
    if dispute.votes_for_buyer >= 2 || dispute.votes_for_seller >= 2 {
        dispute.status = DisputeStatus::VerdictReached as u8;
    }

    Ok(())
}

pub fn execute_verdict(ctx: Context<ExecuteVerdict>) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let offer = &mut ctx.accounts.offer;
    let escrow_account = &ctx.accounts.escrow_account;
    let buyer = &ctx.accounts.buyer;
    let seller = &ctx.accounts.seller;
    let clock = Clock::get()?;

    // Validate dispute status
    if dispute.status != DisputeStatus::VerdictReached as u8 {
        return Err(error!(ErrorCode::InvalidDisputeStatus));
    }

    // Determine winner and transfer funds accordingly
    let escrow_balance = escrow_account.lamports();
    
    if dispute.votes_for_buyer > dispute.votes_for_seller {
        // Buyer wins - gets the SOL
        **buyer.lamports.borrow_mut() = buyer.lamports()
            .checked_add(escrow_balance)
            .ok_or(ErrorCode::InvalidAmount)?;
    } else {
        // Seller wins - gets the SOL back
        **seller.lamports.borrow_mut() = seller.lamports()
            .checked_add(escrow_balance)
            .ok_or(ErrorCode::InvalidAmount)?;
    }

    // Clear escrow account
    **escrow_account.lamports.borrow_mut() = 0;

    // Update dispute and offer status
    dispute.status = DisputeStatus::Resolved as u8;
    dispute.resolved_at = clock.unix_timestamp;
    offer.status = OfferStatus::Completed as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}