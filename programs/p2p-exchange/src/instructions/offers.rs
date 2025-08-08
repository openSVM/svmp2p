use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, program::invoke_signed, system_instruction, sysvar::rent::Rent};
use crate::state::{EscrowAccount, Offer, OfferStatus, Reputation, MAX_FIAT_CURRENCY_LEN, MAX_PAYMENT_METHOD_LEN};
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

    // Enhanced currency code validation - ensure proper ISO format
    if fiat_currency.len() < 3 || fiat_currency.len() > 3 {
        return Err(error!(ErrorCode::InvalidCurrencyCode));
    }
    
    // Check that currency code contains only uppercase letters
    if !fiat_currency.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(error!(ErrorCode::InvalidCurrencyCode));
    }

    // Validate amount
    if amount == 0 || fiat_amount == 0 {
        return Err(error!(ErrorCode::InvalidAmount));
    }

    let offer = &mut ctx.accounts.offer;
    let seller = &ctx.accounts.seller;
    let escrow_account = &mut ctx.accounts.escrow_account;

    // Initialize escrow account
    escrow_account.offer = offer.key();
    escrow_account.bump = ctx.bumps.escrow_account;

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

    // Enhanced fiat payment validation - ensure proper payment flow was completed
    if offer.status != OfferStatus::SolReleased as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Validate buyer
    if offer.buyer != Some(buyer.key()) {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Additional security: Ensure the offer went through proper fiat payment flow
    // The status should have been set to SolReleased only after seller confirmed fiat receipt
    // This prevents release without proper fiat payment confirmation
    if offer.buyer.is_none() {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Transfer SOL from escrow to buyer using CPI with proper PDA signing
    let escrow_balance = escrow_account.to_account_info().lamports();
    
    // Critical security fix: Validate exact balance to prevent fund drainage
    let minimum_rent_exempt = Rent::get()?.minimum_balance(EscrowAccount::LEN + 8);
    let expected_balance = offer.amount
        .checked_add(offer.security_bond)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_add(minimum_rent_exempt)
        .ok_or(ErrorCode::MathOverflow)?;
    
    // Ensure escrow balance matches exactly what we expect
    if escrow_balance != expected_balance {
        return Err(error!(ErrorCode::InvalidEscrowBalance));
    }
    
    // Calculate transferable amount (exclude rent exempt amount)
    let transferable_amount = escrow_balance
        .checked_sub(minimum_rent_exempt)
        .ok_or(ErrorCode::MathOverflow)?;
    
    if transferable_amount > 0 {
        let transfer_instruction = system_instruction::transfer(
            &escrow_account.key(),
            &buyer.key(),
            transferable_amount,
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
        amount: transferable_amount,
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