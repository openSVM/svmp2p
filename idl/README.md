# P2P Exchange Program IDL

This directory contains the Interface Description Language (IDL) files for the Solana P2P Exchange Program.

## Files

- `p2p_exchange.json` - Complete IDL specification for the P2P Exchange program

## Program ID

`FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

The IDL defines the complete interface for the P2P Exchange Solana program, including:

### Instructions (21 total)
- **Admin Functions**: `initializeAdmin`, `updateAdminAuthorities`
- **Offer Management**: `createOffer`, `listOffer`, `acceptOffer`, `markFiatSent`, `confirmFiatReceipt`, `releaseSol`
- **Dispute Resolution**: `openDispute`, `assignJurors`, `submitEvidence`, `castVote`, `executeVerdict`
- **Reputation System**: `createReputation`, `updateReputation`
- **Reward System**: `createRewardToken`, `updateRewardToken`, `createUserRewards`, `mintTradeRewards`, `mintVoteRewards`, `claimRewards`

### Account Types (8 total)
- `Admin` - Program administration account
- `EscrowAccount` - SOL escrow for trades
- `Offer` - Trade offer details
- `Dispute` - Dispute resolution data
- `Vote` - Individual juror votes
- `Reputation` - User reputation scores
- `RewardToken` - Reward token configuration
- `UserRewards` - User reward balances

### Events (16 total)
Complete event emission for all major program actions including offer lifecycle, dispute resolution, reputation updates, and reward distribution.

### Error Codes (20 total)
Comprehensive error handling covering all failure scenarios from invalid states to security violations.

## Usage

This IDL can be used with:
- Anchor client libraries
- TypeScript/JavaScript SDKs
- Python clients
- Rust clients
- Any Solana SDK that supports IDL-based program interaction

## Security Features

The program includes enterprise-grade security features:
- Multi-signature admin support
- Input validation and sanitization
- Mathematical overflow protection
- Rate limiting mechanisms
- Escrow balance validation
- Dispute deadlines and expiration handling