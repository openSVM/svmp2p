use anchor_lang::prelude::*;
use crate::state::Admin;

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

pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    let authority = &ctx.accounts.authority;

    admin.authority = authority.key();
    admin.bump = *ctx.bumps.get("admin").unwrap();

    Ok(())
}