use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::errors::*;

/// Initialize the reward token system (admin-only)
#[derive(Accounts)]
pub struct CreateRewardToken<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RewardToken::LEN,
        seeds = [RewardToken::SEED.as_bytes()],
        bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = reward_token,
        seeds = [b"reward_mint"],
        bump
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [Admin::SEED.as_bytes()],
        bump = admin.bump,
        has_one = authority
    )]
    pub admin: Account<'info, Admin>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Initialize user rewards account
#[derive(Accounts)]
pub struct CreateUserRewards<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserRewards::LEN,
        seeds = [UserRewards::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_rewards: Account<'info, UserRewards>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Mint rewards for trading activity (internal function)
#[derive(Accounts)]
pub struct MintTradeRewards<'info> {
    #[account(
        seeds = [RewardToken::SEED.as_bytes()],
        bump = reward_token.bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(
        mut,
        address = reward_token.mint
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [UserRewards::SEED.as_bytes(), user.key().as_ref()],
        bump = user_rewards.bump
    )]
    pub user_rewards: Account<'info, UserRewards>,
    
    /// CHECK: This account is validated through PDA seeds
    pub user: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Mint rewards for governance activity (internal function) 
#[derive(Accounts)]
pub struct MintVoteRewards<'info> {
    #[account(
        seeds = [RewardToken::SEED.as_bytes()],
        bump = reward_token.bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(
        mut,
        address = reward_token.mint
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [UserRewards::SEED.as_bytes(), user.key().as_ref()],
        bump = user_rewards.bump
    )]
    pub user_rewards: Account<'info, UserRewards>,
    
    /// CHECK: This account is validated through PDA seeds
    pub user: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Claim accumulated rewards
#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        seeds = [RewardToken::SEED.as_bytes()],
        bump = reward_token.bump
    )]
    pub reward_token: Account<'info, RewardToken>,
    
    #[account(
        mut,
        address = reward_token.mint
    )]
    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [UserRewards::SEED.as_bytes(), user.key().as_ref()],
        bump = user_rewards.bump
    )]
    pub user_rewards: Account<'info, UserRewards>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

pub fn create_reward_token(
    ctx: Context<CreateRewardToken>,
    reward_rate_per_trade: u64,
    reward_rate_per_vote: u64,
    min_trade_volume: u64,
) -> Result<()> {
    let reward_token = &mut ctx.accounts.reward_token;
    let clock = Clock::get()?;
    
    reward_token.authority = ctx.accounts.authority.key();
    reward_token.mint = ctx.accounts.reward_mint.key();
    reward_token.total_supply = 0;
    reward_token.reward_rate_per_trade = reward_rate_per_trade;
    reward_token.reward_rate_per_vote = reward_rate_per_vote;
    reward_token.min_trade_volume = min_trade_volume;
    reward_token.created_at = clock.unix_timestamp;
    reward_token.bump = *ctx.bumps.get("reward_token").unwrap();
    
    emit!(RewardTokenCreated {
        authority: ctx.accounts.authority.key(),
        reward_rate_per_trade,
        reward_rate_per_vote,
    });
    
    Ok(())
}

pub fn create_user_rewards(ctx: Context<CreateUserRewards>) -> Result<()> {
    let user_rewards = &mut ctx.accounts.user_rewards;
    
    user_rewards.user = ctx.accounts.user.key();
    user_rewards.total_earned = 0;
    user_rewards.total_claimed = 0;
    user_rewards.unclaimed_balance = 0;
    user_rewards.trading_volume = 0;
    user_rewards.governance_votes = 0;
    user_rewards.last_trade_reward = 0;
    user_rewards.last_vote_reward = 0;
    user_rewards.bump = *ctx.bumps.get("user_rewards").unwrap();
    
    Ok(())
}

pub fn mint_trade_rewards(
    ctx: Context<MintTradeRewards>,
    trade_volume: u64,
) -> Result<()> {
    let reward_token = &ctx.accounts.reward_token;
    let user_rewards = &mut ctx.accounts.user_rewards;
    let clock = Clock::get()?;
    
    // Check if trade volume meets minimum threshold
    if trade_volume < reward_token.min_trade_volume {
        return Ok(()); // No rewards for trades below threshold
    }
    
    // Calculate reward amount
    let reward_amount = reward_token.reward_rate_per_trade;
    
    // Update user rewards tracking (actual minting happens during claim)
    user_rewards.total_earned = user_rewards.total_earned
        .checked_add(reward_amount)
        .ok_or(P2PExchangeError::MathOverflow)?;
    
    user_rewards.unclaimed_balance = user_rewards.unclaimed_balance
        .checked_add(reward_amount)
        .ok_or(P2PExchangeError::MathOverflow)?;
        
    user_rewards.trading_volume = user_rewards.trading_volume
        .checked_add(trade_volume)
        .ok_or(P2PExchangeError::MathOverflow)?;
        
    user_rewards.last_trade_reward = clock.unix_timestamp;
    
    emit!(RewardsEarned {
        user: ctx.accounts.user.key(),
        amount: reward_amount,
        reason: "trade".to_string(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

pub fn mint_vote_rewards(ctx: Context<MintVoteRewards>) -> Result<()> {
    let reward_token = &ctx.accounts.reward_token;
    let user_rewards = &mut ctx.accounts.user_rewards;
    let clock = Clock::get()?;
    
    // Calculate reward amount
    let reward_amount = reward_token.reward_rate_per_vote;
    
    // Update user rewards tracking (actual minting happens during claim)
    user_rewards.total_earned = user_rewards.total_earned
        .checked_add(reward_amount)
        .ok_or(P2PExchangeError::MathOverflow)?;
    
    user_rewards.unclaimed_balance = user_rewards.unclaimed_balance
        .checked_add(reward_amount)
        .ok_or(P2PExchangeError::MathOverflow)?;
        
    user_rewards.governance_votes = user_rewards.governance_votes
        .checked_add(1)
        .ok_or(P2PExchangeError::MathOverflow)?;
        
    user_rewards.last_vote_reward = clock.unix_timestamp;
    
    emit!(RewardsEarned {
        user: ctx.accounts.user.key(),
        amount: reward_amount,
        reason: "vote".to_string(),
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let reward_token = &ctx.accounts.reward_token;
    let user_rewards = &mut ctx.accounts.user_rewards;
    let clock = Clock::get()?;
    
    // Check if there are rewards to claim
    if user_rewards.unclaimed_balance == 0 {
        return Err(P2PExchangeError::NoRewardsToClaim.into());
    }
    
    let claim_amount = user_rewards.unclaimed_balance;
    
    // Mint SPL tokens to user's token account
    let seeds = &[
        RewardToken::SEED.as_bytes(),
        &[reward_token.bump],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.reward_mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.reward_token.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::mint_to(cpi_ctx, claim_amount)?;
    
    // Update balances after successful minting
    user_rewards.total_claimed = user_rewards.total_claimed
        .checked_add(claim_amount)
        .ok_or(P2PExchangeError::MathOverflow)?;
        
    user_rewards.unclaimed_balance = 0;
    
    emit!(RewardsClaimed {
        user: ctx.accounts.user.key(),
        amount: claim_amount,
        timestamp: clock.unix_timestamp,
    });
    
    Ok(())
}