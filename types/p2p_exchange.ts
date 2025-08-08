/**
 * TypeScript types for the P2P Exchange Solana Program
 * Generated from IDL for program: FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9
 */

import { IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Import the complete IDL
import IDL from "../idl/p2p_exchange.json";

// Program ID
export const P2P_EXCHANGE_PROGRAM_ID = new PublicKey("FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9");

// IDL type definition
export type P2pExchange = typeof IDL;

// Account type aliases for better TypeScript support
export type AdminAccount = IdlAccounts<P2pExchange>["admin"];
export type EscrowAccount = IdlAccounts<P2pExchange>["escrowAccount"];
export type OfferAccount = IdlAccounts<P2pExchange>["offer"];
export type DisputeAccount = IdlAccounts<P2pExchange>["dispute"];
export type VoteAccount = IdlAccounts<P2pExchange>["vote"];
export type ReputationAccount = IdlAccounts<P2pExchange>["reputation"];
export type RewardTokenAccount = IdlAccounts<P2pExchange>["rewardToken"];
export type UserRewardsAccount = IdlAccounts<P2pExchange>["userRewards"];

// Custom type aliases
export type OfferStatus = IdlTypes<P2pExchange>["OfferStatus"];
export type DisputeStatus = IdlTypes<P2pExchange>["DisputeStatus"];

// Program type
export type P2pExchangeProgram = Program<P2pExchange>;

// Enum values as constants for easier usage
export const OFFER_STATUS = {
  CREATED: 0,
  LISTED: 1,
  ACCEPTED: 2,
  FIAT_SENT: 3,
  SOL_RELEASED: 4,
  DISPUTE_OPENED: 5,
  COMPLETED: 6,
  CANCELLED: 7,
} as const;

export const DISPUTE_STATUS = {
  OPENED: 0,
  JURORS_ASSIGNED: 1,
  EVIDENCE_SUBMISSION: 2,
  VOTING: 3,
  VERDICT_REACHED: 4,
  RESOLVED: 5,
} as const;

// Error codes for easier error handling
export const P2P_EXCHANGE_ERRORS = {
  INVALID_OFFER_STATUS: 6000,
  INVALID_DISPUTE_STATUS: 6001,
  UNAUTHORIZED: 6002,
  INSUFFICIENT_FUNDS: 6003,
  ALREADY_VOTED: 6004,
  NOT_A_JUROR: 6005,
  DISPUTE_ALREADY_EXISTS: 6006,
  INVALID_AMOUNT: 6007,
  INPUT_TOO_LONG: 6008,
  ADMIN_REQUIRED: 6009,
  TOO_MANY_EVIDENCE_ITEMS: 6010,
  INVALID_UTF8: 6011,
  TIED_VOTE: 6012,
  MATH_OVERFLOW: 6013,
  NO_REWARDS_TO_CLAIM: 6014,
  REWARD_TOKEN_NOT_INITIALIZED: 6015,
  TOO_MANY_REQUESTS: 6016,
  INVALID_ESCROW_BALANCE: 6017,
  DISPUTE_EXPIRED: 6018,
  INVALID_CURRENCY_CODE: 6019,
} as const;

// Helper functions for PDA derivation
export function getAdminPDA(programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("admin")], programId);
}

export function getEscrowPDA(offer: PublicKey, programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("escrow"), offer.toBuffer()], programId);
}

export function getReputationPDA(user: PublicKey, programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("reputation"), user.toBuffer()], programId);
}

export function getVotePDA(dispute: PublicKey, juror: PublicKey, programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("vote"), dispute.toBuffer(), juror.toBuffer()], programId);
}

export function getRewardTokenPDA(programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("reward_token")], programId);
}

export function getUserRewardsPDA(user: PublicKey, programId: PublicKey = P2P_EXCHANGE_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("user_rewards"), user.toBuffer()], programId);
}

// Constants from the program
export const MAX_FIAT_CURRENCY_LEN = 10;
export const MAX_PAYMENT_METHOD_LEN = 50;
export const MAX_DISPUTE_REASON_LEN = 200;
export const MAX_EVIDENCE_URL_LEN = 300;
export const MAX_EVIDENCE_ITEMS = 5;

// Dispute deadlines (in seconds)
export const EVIDENCE_SUBMISSION_DEADLINE = 172800; // 48 hours
export const VOTING_DEADLINE = 604800; // 7 days
export const TOTAL_DISPUTE_DEADLINE = 776800; // 9 days total

// Rate limiting constants (in seconds)
export const OFFER_CREATION_COOLDOWN = 300; // 5 minutes
export const DISPUTE_OPENING_COOLDOWN = 3600; // 1 hour

// Export the IDL as default
export default IDL as P2pExchange;
