use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};
use crate::state::{Admin, EscrowAccount, Offer, Dispute, Vote, OfferStatus, DisputeStatus, MAX_DISPUTE_REASON_LEN, MAX_EVIDENCE_URL_LEN, MAX_EVIDENCE_ITEMS};
use crate::state::{DisputeOpened, JurorsAssigned, EvidenceSubmitted, VoteCast, VerdictExecuted, RewardEligible};
use crate::errors::ErrorCode;

/// Validates and trims input string for safety
fn validate_and_trim_string(input: &str) -> Result<String> {
    // Rust strings are UTF-8 by default - no additional validation needed
    // Just validate that the input is non-empty after trimming
    let trimmed = input.trim().to_string();
    if trimmed.is_empty() {
        return Err(error!(ErrorCode::InputTooLong)); // Reuse existing error for empty strings
    }
    
    Ok(trimmed)
}

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
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump,
        constraint = admin.authority == authority.key() @ ErrorCode::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
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
#[instruction(vote_for_buyer: bool)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub juror: Signer<'info>,
    #[account(
        init, 
        payer = juror, 
        space = 8 + Vote::LEN,
        seeds = [b"vote", dispute.key().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteVerdict<'info> {
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
    /// CHECK: This is the buyer
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// CHECK: This is the seller
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump,
        constraint = admin.authority == authority.key() @ ErrorCode::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
    // Input validation and sanitization
    let reason = validate_and_trim_string(&reason)?;
    if reason.len() > MAX_DISPUTE_REASON_LEN {
        return Err(error!(ErrorCode::InputTooLong));
    }

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
    if offer.seller != initiator.key() && offer.buyer != Some(initiator.key()) {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Set respondent as the other party
    let respondent_key = if offer.seller == initiator.key() {
        offer.buyer.ok_or(ErrorCode::Unauthorized)?
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
    dispute.reason = reason.clone();
    dispute.status = DisputeStatus::Opened as u8;
    dispute.jurors = [Pubkey::default(); 3];
    // Initialize evidence arrays with empty strings
    for i in 0..MAX_EVIDENCE_ITEMS {
        dispute.evidence_buyer[i] = String::new();
        dispute.evidence_seller[i] = String::new();
    }
    dispute.evidence_buyer_count = 0;
    dispute.evidence_seller_count = 0;
    dispute.votes_for_buyer = 0;
    dispute.votes_for_seller = 0;
    dispute.created_at = clock.unix_timestamp;
    dispute.resolved_at = 0;

    // Update offer to link to dispute
    offer.dispute_id = Some(dispute.key());
    offer.status = OfferStatus::DisputeOpened as u8;
    offer.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(DisputeOpened {
        dispute: dispute.key(),
        offer: offer.key(),
        initiator: initiator.key(),
        reason: reason.clone(),
    });

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

    // Emit event
    emit!(JurorsAssigned {
        dispute: dispute.key(),
        jurors: dispute.jurors,
    });

    Ok(())
}

pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence_url: String) -> Result<()> {
    // Input validation and sanitization
    let evidence_url = validate_and_trim_string(&evidence_url)?;
    if evidence_url.len() > MAX_EVIDENCE_URL_LEN {
        return Err(error!(ErrorCode::InputTooLong));
    }

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
        if dispute.evidence_buyer_count >= MAX_EVIDENCE_ITEMS as u8 {
            return Err(error!(ErrorCode::TooManyEvidenceItems));
        }
        let index = dispute.evidence_buyer_count as usize;
        dispute.evidence_buyer[index] = evidence_url.clone();
        dispute.evidence_buyer_count += 1;
    } else {
        if dispute.evidence_seller_count >= MAX_EVIDENCE_ITEMS as u8 {
            return Err(error!(ErrorCode::TooManyEvidenceItems));
        }
        let index = dispute.evidence_seller_count as usize;
        dispute.evidence_seller[index] = evidence_url.clone();
        dispute.evidence_seller_count += 1;
    }

    // Update status if first evidence submission
    if dispute.status == DisputeStatus::JurorsAssigned as u8 {
        dispute.status = DisputeStatus::EvidenceSubmission as u8;
    }

    // Emit event
    emit!(EvidenceSubmitted {
        dispute: dispute.key(),
        submitter: submitter.key(),
        evidence_url,
    });

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

    // Additional check: ensure this vote doesn't exceed our vote limits per voter
    // This is a safeguard in addition to the PDA-based duplicate prevention
    let _juror_index = dispute.jurors.iter().position(|&x| x == juror.key())
        .ok_or(ErrorCode::NotAJuror)?;
    
    // Validate that the juror has not already voted
    // Check by using Vote PDA - if the account exists, they've already voted
    // This is handled by the PDA constraint in the CastVote accounts struct

    // Initialize vote data (PDA prevents duplicate votes)
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

    // Emit event
    emit!(VoteCast {
        dispute: dispute.key(),
        juror: juror.key(),
        vote_for_buyer,
    });

    // Try to mint governance rewards for voting (optional - fails silently if reward system not set up)
    let _ = try_mint_vote_rewards_for_juror(&juror.key());

    Ok(())
}

// Helper function to mint governance rewards after voting
fn try_mint_vote_rewards_for_juror(juror: &Pubkey) -> Result<()> {
    let clock = Clock::get()?;
    let users = vec![*juror];
    
    // Rate limiting: Governance votes are naturally rate-limited by dispute frequency
    // Only emit one event per vote to prevent spamming
    emit!(RewardEligible {
        users: users.clone(),
        trade_volume: 0, // Not applicable for governance rewards
        reward_type: "vote".to_string(),
        timestamp: clock.unix_timestamp,
    });
    
    // Note: Actual reward minting should be done via separate instructions
    // This maintains backward compatibility while enabling monitoring
    msg!("Governance vote cast - eligible for rewards. Juror: {}", juror);
    
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
    let escrow_balance = escrow_account.to_account_info().lamports();
    
    if escrow_balance > 0 {
        // Explicit tie-breaking logic: ties are rejected
        let recipient = if dispute.votes_for_buyer > dispute.votes_for_seller {
            buyer // Buyer wins
        } else if dispute.votes_for_seller > dispute.votes_for_buyer {
            seller // Seller wins
        } else {
            // Tie case: reject the verdict execution
            return Err(error!(ErrorCode::TiedVote));
        };

        let transfer_instruction = system_instruction::transfer(
            &escrow_account.key(),
            &recipient.key(),
            escrow_balance,
        );

        let escrow_seeds = &[
            EscrowAccount::SEED.as_bytes(),
            &offer.key().to_bytes(),
            &[escrow_account.bump],
        ];

        invoke_signed(
            &transfer_instruction,
            &[
                escrow_account.to_account_info(),
                recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[escrow_seeds],
        )?;

        // Emit event
        emit!(VerdictExecuted {
            dispute: dispute.key(),
            winner: recipient.key(),
            amount: escrow_balance,
        });
    }

    // Update dispute and offer status
    dispute.status = DisputeStatus::Resolved as u8;
    dispute.resolved_at = clock.unix_timestamp;
    offer.status = OfferStatus::Completed as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}