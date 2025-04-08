use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod p2p_exchange {
    use super::*;

    // Create and list an offer
    pub fn create_and_list_offer(
        ctx: Context<CreateAndListOffer>,
        amount: u64,
        security_bond: u64,
        fiat_currency: String,
        payment_method: String,
    ) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let seller = &ctx.accounts.seller;
        let escrow_account = &ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Initialize offer data
        offer.seller = seller.key();
        offer.buyer = None;
        offer.amount = amount;
        offer.security_bond = security_bond;
        offer.fiat_currency = fiat_currency;
        offer.payment_method = payment_method;
        offer.status = OfferStatus::Listed as u8;
        offer.created_at = clock.unix_timestamp;
        offer.updated_at = clock.unix_timestamp;
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

        emit!(OfferCreatedEvent {
            offer: offer.key(),
            seller: seller.key(),
            amount,
            fiat_currency: fiat_currency.clone(),
            payment_method: payment_method.clone(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // Accept an offer
    pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let buyer = &ctx.accounts.buyer;
        let clock = Clock::get()?;

        // Validate offer status
        if offer.status != OfferStatus::Listed as u8 {
            return Err(error!(ErrorCode::InvalidOfferStatus));
        }

        // Update offer data
        offer.buyer = Some(buyer.key());
        offer.status = OfferStatus::Accepted as u8;
        offer.updated_at = clock.unix_timestamp;

        emit!(OfferAcceptedEvent {
            offer: offer.key(),
            seller: offer.seller,
            buyer: buyer.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // Confirm fiat payment sent
    pub fn confirm_fiat_sent(ctx: Context<ConfirmFiatSent>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let buyer = &ctx.accounts.buyer;
        let clock = Clock::get()?;

        // Validate offer status
        if offer.status != OfferStatus::Accepted as u8 {
            return Err(error!(ErrorCode::InvalidOfferStatus));
        }

        // Validate buyer
        if offer.buyer.unwrap() != buyer.key() {
            return Err(error!(ErrorCode::Unauthorized));
        }

        // Update offer status
        offer.status = OfferStatus::AwaitingFiatPayment as u8;
        offer.updated_at = clock.unix_timestamp;

        emit!(FiatSentEvent {
            offer: offer.key(),
            buyer: buyer.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // Confirm fiat payment received
    pub fn confirm_fiat_receipt(ctx: Context<ConfirmFiatReceipt>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let seller = &ctx.accounts.seller;
        let clock = Clock::get()?;

        // Validate offer status
        if offer.status != OfferStatus::AwaitingFiatPayment as u8 {
            return Err(error!(ErrorCode::InvalidOfferStatus));
        }

        // Validate seller
        if offer.seller != seller.key() {
            return Err(error!(ErrorCode::Unauthorized));
        }

        // Update offer status
        offer.status = OfferStatus::FiatSent as u8;
        offer.updated_at = clock.unix_timestamp;

        emit!(FiatReceivedEvent {
            offer: offer.key(),
            seller: seller.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // Release SOL to buyer
    pub fn release_sol(ctx: Context<ReleaseSol>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let seller = &ctx.accounts.seller;
        let buyer = &ctx.accounts.buyer;
        let escrow_account = &ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Validate offer status
        if offer.status != OfferStatus::FiatSent as u8 {
            return Err(error!(ErrorCode::InvalidOfferStatus));
        }

        // Validate seller
        if offer.seller != seller.key() {
            return Err(error!(ErrorCode::Unauthorized));
        }

        // Validate buyer
        if offer.buyer.unwrap() != buyer.key() {
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

        emit!(SolReleasedEvent {
            offer: offer.key(),
            seller: seller.key(),
            buyer: buyer.key(),
            amount: offer.amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAndListOffer<'info> {
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
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfirmFiatSent<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfirmFiatReceipt<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(constraint = offer.seller == seller.key())]
    pub seller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseSol<'info> {
    #[account(mut)]
    pub offer: Account<'info, Offer>,
    #[account(constraint = offer.seller == seller.key())]
    pub seller: Signer<'info>,
    /// CHECK: This is the buyer who will receive the SOL
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// CHECK: This is the escrow account that holds the SOL
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
}

#[account]
pub struct Offer {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub amount: u64,
    pub security_bond: u64,
    pub fiat_currency: String,
    pub payment_method: String,
    pub status: u8,
    pub created_at: i64,
    pub updated_at: i64,
    pub dispute_id: Option<Pubkey>,
}

impl Offer {
    pub const LEN: usize = 32 + // seller
                           33 + // buyer (Option<Pubkey>)
                           8 +  // amount
                           8 +  // security_bond
                           36 + // fiat_currency (max 32 chars + 4 bytes for length)
                           36 + // payment_method (max 32 chars + 4 bytes for length)
                           1 +  // status
                           8 +  // created_at
                           8 +  // updated_at
                           33;  // dispute_id (Option<Pubkey>)
}

#[event]
pub struct OfferCreatedEvent {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub fiat_currency: String,
    pub payment_method: String,
    pub timestamp: i64,
}

#[event]
pub struct OfferAcceptedEvent {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FiatSentEvent {
    pub offer: Pubkey,
    pub buyer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FiatReceivedEvent {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SolReleasedEvent {
    pub offer: Pubkey,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid offer status for this operation")]
    InvalidOfferStatus,
    #[msg("Invalid dispute status for this operation")]
    InvalidDisputeStatus,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("Juror has already voted")]
    AlreadyVoted,
    #[msg("You are not a juror for this dispute")]
    NotAJuror,
    #[msg("A dispute already exists for this offer")]
    DisputeAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
}

#[derive(Clone, Copy, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum OfferStatus {
    Created,
    Listed,
    Accepted,
    AwaitingFiatPayment,
    FiatSent,
    SolReleased,
    DisputeOpened,
    Completed,
    Cancelled,
}
