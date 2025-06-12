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

    // Recalculate rating based on performance
    let total_trades = reputation.successful_trades + reputation.disputed_trades;
    if total_trades > 0 {
        let success_rate = (reputation.successful_trades * 100) / total_trades;
        let dispute_win_rate = if reputation.disputed_trades > 0 {
            (reputation.disputes_won * 100) / reputation.disputed_trades
        } else {
            100
        };
        
    // Rating is weighted average of success rate and dispute win rate
    reputation.rating = ((success_rate * 70 + dispute_win_rate * 30) / 100) as u8;
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