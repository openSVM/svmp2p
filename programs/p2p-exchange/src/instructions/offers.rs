use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use crate::state::{Offer, OfferStatus};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct CreateOffer<'info> {
    #[account(init, payer = seller, space = 8 + Offer::LEN)]
    pub offer: Account<'info, Offer>,
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: This is the escrow account that will hold the SOL
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
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
    /// CHECK: This is the escrow account that will hold the SOL
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
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
    /// CHECK: This is the seller
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: This is the buyer who will receive the SOL
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// CHECK: This is the escrow account that holds the SOL
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
}

pub fn create_offer(
    ctx: Context<CreateOffer>,
    amount: u64,
    fiat_amount: u64,
    fiat_currency: String,
    payment_method: String,
    created_at: i64,
) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let seller = &ctx.accounts.seller;
    let escrow_account = &ctx.accounts.escrow_account;

    // Initialize offer data
    offer.seller = seller.key();
    offer.buyer = Pubkey::default(); // Will be set when accepted
    offer.amount = amount;
    offer.security_bond = 0; // Will be set when accepted
    offer.status = OfferStatus::Created as u8;
    offer.fiat_amount = fiat_amount;
    offer.fiat_currency = fiat_currency;
    offer.payment_method = payment_method;
    offer.escrow_account = escrow_account.key();
    offer.created_at = created_at;
    offer.updated_at = created_at;
    offer.dispute_id = None;

    // Transfer SOL to escrow account
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
    offer.buyer = buyer.key();
    offer.security_bond = security_bond;
    offer.status = OfferStatus::Accepted as u8;
    offer.updated_at = clock.unix_timestamp;

    // Transfer security bond to escrow account
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
    if offer.buyer != buyer.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Update offer status
    offer.status = OfferStatus::FiatSent as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn confirm_fiat_receipt(ctx: Context<ConfirmFiatReceipt>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::FiatSent as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Update offer status
    offer.status = OfferStatus::AwaitingFiatPayment as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn release_sol(ctx: Context<ReleaseSol>) -> Result<()> {
    let offer = &mut ctx.accounts.offer;
    let seller = &ctx.accounts.seller;
    let buyer = &ctx.accounts.buyer;
    let escrow_account = &ctx.accounts.escrow_account;
    let clock = Clock::get()?;

    // Validate offer status
    if offer.status != OfferStatus::AwaitingFiatPayment as u8 {
        return Err(error!(ErrorCode::InvalidOfferStatus));
    }

    // Validate seller
    if offer.seller != seller.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Validate buyer
    if offer.buyer != buyer.key() {
        return Err(error!(ErrorCode::Unauthorized));
    }

    // Transfer SOL from escrow to buyer
    let escrow_starting_lamports = escrow_account.lamports();
    let buyer_starting_lamports = buyer.lamports();

    **buyer.lamports.borrow_mut() = buyer_starting_lamports
        .checked_add(escrow_starting_lamports)
        .ok_or(ErrorCode::InvalidAmount)?;
    **escrow_account.lamports.borrow_mut() = 0;

    // Update offer status
    offer.status = OfferStatus::Completed as u8;
    offer.updated_at = clock.unix_timestamp;

    Ok(())
}