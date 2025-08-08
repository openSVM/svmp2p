use anchor_lang::prelude::*;
use crate::state::Admin;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Admin::LEN,
        seeds = [Admin::SEED.as_bytes()],
        bump
    )]
    pub admin: Account<'info, Admin>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAdminAuthorities<'info> {
    #[account(
        mut,
        seeds = [Admin::SEED.as_bytes()],
        bump,
        constraint = admin.authority == authority.key() @ ErrorCode::AdminRequired
    )]
    pub admin: Account<'info, Admin>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    let authority = &ctx.accounts.authority;

    admin.authority = authority.key();
    admin.secondary_authorities = [Pubkey::default(); 2];
    admin.required_signatures = 1; // Start with single signature, can be upgraded
    admin.bump = ctx.bumps.admin;

    Ok(())
}

pub fn update_admin_authorities(
    ctx: Context<UpdateAdminAuthorities>,
    secondary_authorities: [Pubkey; 2],
    required_signatures: u8,
) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    
    // Validate required signatures is between 1 and 3
    if required_signatures == 0 || required_signatures > 3 {
        return Err(error!(ErrorCode::InvalidAmount));
    }
    
    admin.secondary_authorities = secondary_authorities;
    admin.required_signatures = required_signatures;
    
    Ok(())
}

// Helper function to validate multi-sig authorization
pub fn validate_admin_authority(admin: &Admin, signers: &[Pubkey]) -> Result<()> {
    let mut valid_signatures = 0;
    
    // Check primary authority
    if signers.contains(&admin.authority) {
        valid_signatures += 1;
    }
    
    // Check secondary authorities
    for secondary in &admin.secondary_authorities {
        if *secondary != Pubkey::default() && signers.contains(secondary) {
            valid_signatures += 1;
        }
    }
    
    if valid_signatures >= admin.required_signatures {
        Ok(())
    } else {
        Err(error!(ErrorCode::AdminRequired))
    }
}