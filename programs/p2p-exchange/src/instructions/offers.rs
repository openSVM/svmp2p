use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, program::invoke_signed, system_instruction};
use crate::state::{EscrowAccount, Offer, OfferStatus, MAX_FIAT_CURRENCY_LEN, MAX_PAYMENT_METHOD_LEN};
use crate::state::{OfferCreated, OfferAccepted, FiatSent, FiatReceiptConfirmed, SolReleased, RewardEligible};
use crate::errors::ErrorCode;
use crate::utils::validate_and_process_string;

// Remove the duplicated validate_and_trim_string function - now using common utility

#[derive(Accounts)]
pub struct CreateOffer<'info> {
    #[account(init, payer = seller, space = 8 + Offer::LEN)]
    pub offer: Account<'info, Offer>,
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        init,
        payer = seller,
        space = 8 + EscrowAccount::LEN,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListOffer<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut, constraint = offer.seller == seller.key())]
    pub seller: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkFiatSent<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut)]
    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfirmFiatReceipt<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut, constraint = offer.seller == seller.key())]
    pub seller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseSol<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(mut, constraint = offer.seller == seller.key())]
    pub seller: Signer<'info>,
    /// CHECK: This is the buyer who will receive the SOL
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [EscrowAccount::SEED.as_bytes(), offer.key().as_ref()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

pub fn create_offer(
    ctx: Context<CreateOffer>,
    amount: u64,
    fiat_amount: u64,
    fiat_currency: String,
    payment_method: String,
    created_at: i64,
) -> Result<()> {
    // Input validation and sanitization
    let fiat_currency = validate_and_process_string(&fiat_currency, MAX_FIAT_CURRENCY_LEN)?;
    let payment_method = validate_and_process_string(&payment_method, MAX_PAYMENT_METHOD_LEN)?;
    
    if fiat_currency.len() > MAX_FIAT_CURRENCY_LEN {
        return Err(error!(ErrorCode::InputTooLong));
    }
    if payment_method.len() > MAX_PAYMENT_METHOD_LEN {
        return Err(error!(ErrorCode::InputTooLong));
    }

    let offer = &mut ctx.accounts.offer;
    let seller = &ctx.accounts.seller;
    let escrow_account = &mut ctx.accounts.escrow_account;

    // Initialize escrow account
    escrow_account.offer = offer.key();
    escrow_account.bump = ctx.bumps.get("escrow_account").copied().unwrap();

    // Initialize offer data
    offer.seller = seller.key();
    offer.buyer = None; // Will be set when accepted
    offer.amount = amount;
    offer.security_bond = 0; // Will be set when accepted
    offer.status = OfferStatus::Created as u8;
    offer.fiat_amount = fiat_amount;
    offer.fiat_currency = fiat_currency.clone();
    offer.payment_method = payment_method.clone();
    offer.created_at = created_at;
    offer.updated_at = created_at;
    offer.dispute_id = None;

    // Transfer SOL to escrow account using regular invoke (user-to-escrow)
    let transfer_instruction = system_instruction::transfer(
        &seller.key(),
        &escrow_account.key(),
        amount,
    );
    
    invoke(
        &transfer_instruction,
        &[
            seller.to_account_info(),
            escrow_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Emit event
    emit!(OfferCreated {
        offer: offer.key(),
        seller: seller.key(),
        amount,
        fiat_amount,
        fiat_currency: fiat_currency.clone(),
    });

    Ok(())
}

pub fn list_offer(ctx: Context<ListOffer>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::Created as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Update offer status
    offer.status = OfferStatus::Listed as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn accept_offer(ctx: Context<AcceptOffer>, security_bond: u64) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let buyer = &ctx.accounts.buyer;
    let escrow_account = &ctx.accounts.escrow_account;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::Listed as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Update offer data
    offer.buyer = Some(buyer.key());
    offer.security_bond = security_bond;
    offer.status = OfferStatus::Accepted as u8;
    offer.updated_at = clock.unix_timestamp;

    // Transfer security bond to escrow account using regular invoke (user-to-escrow)
    if security_bond > 0 {
        let transfer_instruction = system_instruction::transfer(
            &buyer.key(),
            &escrow_account.key(),
            security_bond,
        );
        
        invoke(
            &transfer_instruction,
            &[
                buyer.to_account_info(),
                escrow_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    // Emit event
    emit!(OfferAccepted {
        offer: offer.key(),
        buyer: buyer.key(),
        security_bond,
    });

    Ok(())
}

pub fn mark_fiat_sent(ctx: Context<MarkFiatSent>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let buyer = &ctx.accounts.buyer;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::Accepted as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Validate buyer
    if offer.buyer != Some(buyer.key()) {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Update offer status
    offer.status = OfferStatus::FiatSent as u8;
    offer.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(FiatSent {
        offer: offer.key(),
        buyer: buyer.key(),
    });

    Ok(())
}

pub fn confirm_fiat_receipt(ctx: Context<ConfirmFiatReceipt>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::FiatSent as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Update offer status to indicate seller confirmed fiat receipt
    offer.status = OfferStatus::SolReleased as u8; // Ready for SOL release
    offer.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(FiatReceiptConfirmed {
        offer: offer.key(),
        seller: offer.seller,
    });

    Ok(())
}

pub fn release_sol(ctx: Context<ReleaseSol>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let _seller = &ctx.accounts.seller; // Keep for validation but mark as unused
    let buyer = &ctx.accounts.buyer;
    let escrow_account = &ctx.accounts.escrow_account;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::SolReleased as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Validate buyer
    if offer.buyer != Some(buyer.key()) {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Transfer SOL from escrow to buyer using CPI with proper PDA signing
    let escrow_balance = escrow_account.to_account_info().lamports();
    if escrow_balance > 0 {
        let transfer_instruction = system_instruction::transfer(
            &escrow_account.key(),
            &buyer.key(),
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
                buyer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[escrow_seeds],
        )?;
    }

    // Update offer status
    offer.status = OfferStatus::Completed as u8;
    offer.updated_at = clock.unix_timestamp;

    // Emit event
    emit!(SolReleased {
        offer: offer.key(),
        buyer: buyer.key(),
        amount: escrow_balance,
    });

    // Try to mint trade rewards for both parties (optional - fails silently if reward system not set up)
    let _ = try_mint_trade_rewards_for_completed_trade(
        &offer.seller,
        &buyer.key(),
        escrow_balance,
    );

    Ok(())
}

// Helper function to mint trade rewards after trade completion
fn try_mint_trade_rewards_for_completed_trade(
    seller: &Pubkey,
    buyer: &Pubkey,
    trade_volume: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Rate limiting: Only emit events for substantial trades (>= 0.01 SOL = 10M lamports)
    // This prevents spamming from micro-trades while maintaining monitoring capability
    const MIN_VOLUME_FOR_EVENT: u64 = 10_000_000; // 0.01 SOL in lamports
    
    if trade_volume >= MIN_VOLUME_FOR_EVENT {
        let users = vec![*seller, *buyer];
        
        // Emit event indicating reward eligibility for monitoring
        emit!(RewardEligible {
            users: users.clone(),
            trade_volume,
            reward_type: "trade".to_string(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Trade completed - eligible for rewards. Seller: {}, Buyer: {}, Volume: {}", 
             seller, buyer, trade_volume);
    } else {
        msg!("Trade volume {} below event emission threshold", trade_volume);
    }
    
    Ok(())
}