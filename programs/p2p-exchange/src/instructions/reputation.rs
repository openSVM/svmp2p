use anchor_lang::prelude::*;
use crate::state::{Admin, Reputation, ReputationUpdated};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct CreateReputation<'info> {
    #[account(init, payer = user, space = 8 + Reputation::LEN, seeds = [b"reputation", user.key().as_ref()], bump)]
    pub reputation: Account<'info, Reputation>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut, seeds = [b"reputation", user.key().as_ref()], bump)]
    pub reputation: Account<'info, Reputation>,
    /// CHECK: This is the user whose reputation is being updated
    pub user: AccountInfo<'info>,
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump,
        constraint = admin.authority == authority.key() @ ErrorCode::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn create_reputation(ctx: Context<CreateReputation>) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    let user = &ctx.accounts.user;
    let clock = Clock::get()?;

    // Initialize reputation data
    reputation.user = user.key();
    reputation.successful_trades = 0;
    reputation.disputed_trades = 0;
    reputation.disputes_won = 0;
    reputation.disputes_lost = 0;
    reputation.rating = 100; // Start with perfect rating
    reputation.last_updated = clock.unix_timestamp;

    Ok(())
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    successful_trade: bool,
    dispute_resolved: bool,
    dispute_won: bool,
) -> Result<()> {
    let reputation = &mut ctx.accounts.reputation;
    let clock = Clock::get()?;

    if successful_trade {
        reputation.successful_trades += 1;
    }

    if dispute_resolved {
        reputation.disputed_trades += 1;
        if dispute_won {
            reputation.disputes_won += 1;
        } else {
            reputation.disputes_lost += 1;
        }
    }

    // Recalculate rating based on performance with overflow protection
    let total_trades = reputation.successful_trades
        .checked_add(reputation.disputed_trades)
        .ok_or(ErrorCode::MathOverflow)?;
        
    if total_trades > 0 {
        // Use checked arithmetic to prevent overflow
        let success_rate = reputation.successful_trades
            .checked_mul(100)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(total_trades)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let dispute_win_rate = if reputation.disputed_trades > 0 {
            reputation.disputes_won
                .checked_mul(100)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(reputation.disputed_trades)
                .ok_or(ErrorCode::MathOverflow)?
        } else {
            100
        };
        
        // Rating is weighted average of success rate and dispute win rate
        // Cap the calculation to prevent u8 overflow (rating should be 0-100)
        let weighted_success = success_rate
            .checked_mul(70)
            .ok_or(ErrorCode::MathOverflow)?;
        let weighted_dispute = dispute_win_rate
            .checked_mul(30)
            .ok_or(ErrorCode::MathOverflow)?;
        let combined_rating = weighted_success
            .checked_add(weighted_dispute)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;
            
        // Ensure rating stays within u8 bounds (0-255, but practically should be 0-100)
        reputation.rating = if combined_rating > 100 { 100 } else { combined_rating as u8 };
    }

    reputation.last_updated = clock.unix_timestamp;

    // Emit event
    emit!(ReputationUpdated {
        user: reputation.user,
        successful_trades: reputation.successful_trades,
        rating: reputation.rating,
    });

    Ok(())
}