# Transaction Flows and Examples

**Version**: 1.0.0  
**Program ID**: `FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9`

## Overview

This document provides complete transaction flow examples for common operations in the SVMP2P platform. Each example includes TypeScript code, account setup, error handling, and best practices.

## Table of Contents

- [Basic Trading Flow](#basic-trading-flow)
- [Dispute Resolution Flow](#dispute-resolution-flow)
- [Reward System Operations](#reward-system-operations)
- [Batch Operations](#batch-operations)
- [Error Recovery Patterns](#error-recovery-patterns)

---

## Basic Trading Flow

### Complete Trade Lifecycle

This example demonstrates a complete peer-to-peer trade from offer creation to completion.

#### Step 1: Create and List Offer (Seller)

```typescript
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';

interface CreateOfferParams {
  amount: BN;           // SOL amount in lamports
  fiatAmount: BN;       // Fiat amount in smallest unit (e.g., cents)
  currency: string;     // Currency code (e.g., "USD")
  paymentMethod: string; // Payment description
}

const createAndListOffer = async (
  program: Program,
  seller: Keypair,
  params: CreateOfferParams
): Promise<{ offerPubkey: PublicKey; signature: string }> => {
  try {
    // Generate offer account
    const offerKeypair = Keypair.generate();
    
    // Derive escrow PDA
    const [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Create offer with escrow
    const createTx = await program.methods
      .createOffer(
        params.amount,
        params.fiatAmount,
        params.currency,
        params.paymentMethod,
        new BN(Math.floor(Date.now() / 1000)) // Current timestamp
      )
      .accounts({
        offer: offerKeypair.publicKey,
        escrowAccount: escrowPDA,
        creator: seller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller, offerKeypair])
      .rpc();
    
    console.log('Offer created:', createTx);
    
    // List the offer publicly
    const listTx = await program.methods
      .listOffer()
      .accounts({
        offer: offerKeypair.publicKey,
        seller: seller.publicKey,
      })
      .signers([seller])
      .rpc();
    
    console.log('Offer listed:', listTx);
    
    return {
      offerPubkey: offerKeypair.publicKey,
      signature: listTx
    };
    
  } catch (error) {
    console.error('Failed to create/list offer:', error);
    throw new Error(`Offer creation failed: ${error.message}`);
  }
};
```

#### Step 2: Accept Offer (Buyer)

```typescript
const acceptOffer = async (
  program: Program,
  buyer: Keypair,
  offerPubkey: PublicKey,
  securityBond: BN
): Promise<string> => {
  try {
    // Get offer account to verify status
    const offerAccount = await program.account.offer.fetch(offerPubkey);
    
    if (offerAccount.status !== 1) { // LISTED status
      throw new Error('Offer is not available for acceptance');
    }
    
    // Derive escrow PDA
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), offerPubkey.toBuffer()],
      program.programId
    );
    
    // Accept the offer
    const signature = await program.methods
      .acceptOffer(securityBond)
      .accounts({
        offer: offerPubkey,
        escrowAccount: escrowPDA,
        buyer: buyer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();
    
    console.log('Offer accepted:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to accept offer:', error);
    throw new Error(`Offer acceptance failed: ${error.message}`);
  }
};
```

#### Step 3: Mark Fiat Sent (Buyer)

```typescript
const markFiatSent = async (
  program: Program,
  buyer: Keypair,
  offerPubkey: PublicKey
): Promise<string> => {
  try {
    const signature = await program.methods
      .markFiatSent()
      .accounts({
        offer: offerPubkey,
        buyer: buyer.publicKey,
      })
      .signers([buyer])
      .rpc();
    
    console.log('Fiat marked as sent:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to mark fiat sent:', error);
    throw new Error(`Mark fiat sent failed: ${error.message}`);
  }
};
```

#### Step 4: Confirm Receipt and Release SOL (Seller)

```typescript
const confirmAndRelease = async (
  program: Program,
  seller: Keypair,
  offerPubkey: PublicKey
): Promise<{ confirmSignature: string; releaseSignature: string }> => {
  try {
    // Get offer account for buyer info
    const offerAccount = await program.account.offer.fetch(offerPubkey);
    
    if (!offerAccount.buyer) {
      throw new Error('No buyer found for offer');
    }
    
    // Derive escrow PDA
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), offerPubkey.toBuffer()],
      program.programId
    );
    
    // Confirm fiat receipt
    const confirmSignature = await program.methods
      .confirmFiatReceipt()
      .accounts({
        offer: offerPubkey,
        seller: seller.publicKey,
      })
      .signers([seller])
      .rpc();
    
    console.log('Fiat receipt confirmed:', confirmSignature);
    
    // Release SOL to buyer
    const releaseSignature = await program.methods
      .releaseSol()
      .accounts({
        offer: offerPubkey,
        escrowAccount: escrowPDA,
        buyer: offerAccount.buyer,
        seller: seller.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller])
      .rpc();
    
    console.log('SOL released:', releaseSignature);
    
    return {
      confirmSignature,
      releaseSignature
    };
    
  } catch (error) {
    console.error('Failed to confirm and release:', error);
    throw new Error(`Confirm and release failed: ${error.message}`);
  }
};
```

#### Complete Flow Example

```typescript
const executeCompleteTradeFlow = async () => {
  const connection = new Connection('https://api.devnet.solana.com');
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(IDL, PROGRAM_ID, provider);
  
  // Setup accounts
  const seller = Keypair.generate();
  const buyer = Keypair.generate();
  
  // Fund accounts (in real scenario, users would have funds)
  await connection.requestAirdrop(seller.publicKey, 2 * web3.LAMPORTS_PER_SOL);
  await connection.requestAirdrop(buyer.publicKey, 2 * web3.LAMPORTS_PER_SOL);
  
  try {
    // Step 1: Seller creates and lists offer
    const { offerPubkey } = await createAndListOffer(program, seller, {
      amount: new BN(1 * web3.LAMPORTS_PER_SOL), // 1 SOL
      fiatAmount: new BN(50000), // $500.00 in cents
      currency: "USD",
      paymentMethod: "Bank transfer - Chase Bank"
    });
    
    // Step 2: Buyer accepts offer
    await acceptOffer(
      program,
      buyer,
      offerPubkey,
      new BN(0.1 * web3.LAMPORTS_PER_SOL) // 0.1 SOL security bond
    );
    
    // Step 3: Buyer marks fiat as sent
    await markFiatSent(program, buyer, offerPubkey);
    
    // Step 4: Seller confirms and releases
    await confirmAndRelease(program, seller, offerPubkey);
    
    console.log('Trade completed successfully!');
    
  } catch (error) {
    console.error('Trade flow failed:', error);
  }
};
```

---

## Dispute Resolution Flow

### Opening and Resolving Disputes

#### Step 1: Open Dispute

```typescript
const openDispute = async (
  program: Program,
  initiator: Keypair,
  offerPubkey: PublicKey,
  reason: string
): Promise<{ disputePubkey: PublicKey; signature: string }> => {
  try {
    const disputeKeypair = Keypair.generate();
    
    const signature = await program.methods
      .openDispute(reason)
      .accounts({
        offer: offerPubkey,
        dispute: disputeKeypair.publicKey,
        initiator: initiator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([initiator, disputeKeypair])
      .rpc();
    
    console.log('Dispute opened:', signature);
    
    return {
      disputePubkey: disputeKeypair.publicKey,
      signature
    };
    
  } catch (error) {
    console.error('Failed to open dispute:', error);
    throw new Error(`Dispute opening failed: ${error.message}`);
  }
};
```

#### Step 2: Assign Jurors (Admin Only)

```typescript
const assignJurors = async (
  program: Program,
  admin: Keypair,
  disputePubkey: PublicKey,
  jurors: PublicKey[]
): Promise<string> => {
  try {
    if (jurors.length !== 3) {
      throw new Error('Exactly 3 jurors must be assigned');
    }
    
    // Derive admin PDA
    const [adminPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("admin")],
      program.programId
    );
    
    const signature = await program.methods
      .assignJurors()
      .accounts({
        admin: adminPDA,
        dispute: disputePubkey,
        authority: admin.publicKey,
        juror1: jurors[0],
        juror2: jurors[1],
        juror3: jurors[2],
      })
      .signers([admin])
      .rpc();
    
    console.log('Jurors assigned:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to assign jurors:', error);
    throw new Error(`Juror assignment failed: ${error.message}`);
  }
};
```

#### Step 3: Submit Evidence

```typescript
const submitEvidence = async (
  program: Program,
  submitter: Keypair,
  disputePubkey: PublicKey,
  evidenceUrl: string
): Promise<string> => {
  try {
    const signature = await program.methods
      .submitEvidence(evidenceUrl)
      .accounts({
        dispute: disputePubkey,
        submitter: submitter.publicKey,
      })
      .signers([submitter])
      .rpc();
    
    console.log('Evidence submitted:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to submit evidence:', error);
    throw new Error(`Evidence submission failed: ${error.message}`);
  }
};
```

#### Step 4: Cast Votes (Jurors)

```typescript
const castVote = async (
  program: Program,
  juror: Keypair,
  disputePubkey: PublicKey,
  voteForBuyer: boolean
): Promise<string> => {
  try {
    // Derive vote PDA
    const [votePDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from("vote"),
        disputePubkey.toBuffer(),
        juror.publicKey.toBuffer()
      ],
      program.programId
    );
    
    const signature = await program.methods
      .castVote(voteForBuyer)
      .accounts({
        dispute: disputePubkey,
        voteAccount: votePDA,
        juror: juror.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([juror])
      .rpc();
    
    console.log('Vote cast:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to cast vote:', error);
    throw new Error(`Vote casting failed: ${error.message}`);
  }
};
```

#### Step 5: Execute Verdict (Admin)

```typescript
const executeVerdict = async (
  program: Program,
  admin: Keypair,
  disputePubkey: PublicKey,
  offerPubkey: PublicKey,
  winner: PublicKey
): Promise<string> => {
  try {
    // Derive PDAs
    const [adminPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("admin")],
      program.programId
    );
    
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), offerPubkey.toBuffer()],
      program.programId
    );
    
    const signature = await program.methods
      .executeVerdict()
      .accounts({
        admin: adminPDA,
        dispute: disputePubkey,
        offer: offerPubkey,
        escrowAccount: escrowPDA,
        winner: winner,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    console.log('Verdict executed:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to execute verdict:', error);
    throw new Error(`Verdict execution failed: ${error.message}`);
  }
};
```

---

## Reward System Operations

### Initialize and Use Reward System

#### Step 1: Initialize Reward Token (Admin Only)

```typescript
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from '@solana/spl-token';

const initializeRewardSystem = async (
  program: Program,
  admin: Keypair,
  rewardRates: {
    perTrade: BN;
    perVote: BN;
    minVolume: BN;
  }
): Promise<string> => {
  try {
    // Derive PDAs
    const [adminPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("admin")],
      program.programId
    );
    
    const [rewardTokenPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_token")],
      program.programId
    );
    
    const [rewardMintPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_mint")],
      program.programId
    );
    
    const signature = await program.methods
      .createRewardToken(
        rewardRates.perTrade,
        rewardRates.perVote,
        rewardRates.minVolume
      )
      .accounts({
        admin: adminPDA,
        rewardToken: rewardTokenPDA,
        rewardMint: rewardMintPDA,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();
    
    console.log('Reward system initialized:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to initialize reward system:', error);
    throw new Error(`Reward system initialization failed: ${error.message}`);
  }
};
```

#### Step 2: Create User Rewards Account

```typescript
const createUserRewards = async (
  program: Program,
  user: Keypair
): Promise<string> => {
  try {
    // Derive PDAs
    const [userRewardsPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("user_rewards"), user.publicKey.toBuffer()],
      program.programId
    );
    
    const [rewardMintPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_mint")],
      program.programId
    );
    
    const [rewardTokenPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_token")],
      program.programId
    );
    
    // Get associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      rewardMintPDA,
      user.publicKey
    );
    
    const signature = await program.methods
      .createUserRewards()
      .accounts({
        userRewards: userRewardsPDA,
        userTokenAccount: userTokenAccount,
        rewardMint: rewardMintPDA,
        rewardToken: rewardTokenPDA,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();
    
    console.log('User rewards account created:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to create user rewards:', error);
    throw new Error(`User rewards creation failed: ${error.message}`);
  }
};
```

#### Step 3: Claim Rewards

```typescript
const claimRewards = async (
  program: Program,
  user: Keypair
): Promise<string> => {
  try {
    // Derive PDAs
    const [userRewardsPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("user_rewards"), user.publicKey.toBuffer()],
      program.programId
    );
    
    const [rewardMintPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_mint")],
      program.programId
    );
    
    const [rewardTokenPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("reward_token")],
      program.programId
    );
    
    const userTokenAccount = await getAssociatedTokenAddress(
      rewardMintPDA,
      user.publicKey
    );
    
    const signature = await program.methods
      .claimRewards()
      .accounts({
        userRewards: userRewardsPDA,
        userTokenAccount: userTokenAccount,
        rewardMint: rewardMintPDA,
        rewardToken: rewardTokenPDA,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
    
    console.log('Rewards claimed:', signature);
    return signature;
    
  } catch (error) {
    console.error('Failed to claim rewards:', error);
    throw new Error(`Reward claiming failed: ${error.message}`);
  }
};
```

---

## Batch Operations

### Batch Transaction Processing

```typescript
const processBatchOperations = async (
  program: Program,
  operations: Array<{
    type: 'create_offer' | 'accept_offer' | 'claim_rewards';
    params: any;
    signer: Keypair;
  }>
): Promise<string[]> => {
  const signatures: string[] = [];
  const batchSize = 5; // Process in batches to avoid rate limits
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (operation) => {
      try {
        switch (operation.type) {
          case 'create_offer':
            return await createAndListOffer(
              program,
              operation.signer,
              operation.params
            );
          case 'accept_offer':
            return await acceptOffer(
              program,
              operation.signer,
              operation.params.offerPubkey,
              operation.params.securityBond
            );
          case 'claim_rewards':
            return await claimRewards(program, operation.signer);
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
      } catch (error) {
        console.error(`Batch operation failed:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    signatures.push(...batchResults.filter(result => result !== null));
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < operations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return signatures;
};
```

---

## Error Recovery Patterns

### Comprehensive Error Handling

```typescript
interface TransactionWithRetry {
  operation: () => Promise<string>;
  maxRetries: number;
  retryDelay: number;
  errorHandler?: (error: Error, attempt: number) => boolean;
}

const executeWithRetry = async ({
  operation,
  maxRetries = 3,
  retryDelay = 1000,
  errorHandler
}: TransactionWithRetry): Promise<string> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      // Check if error handler allows retry
      if (errorHandler && !errorHandler(error, attempt)) {
        throw error;
      }
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
};

// Usage example
const robustOfferCreation = async (
  program: Program,
  seller: Keypair,
  params: CreateOfferParams
) => {
  return executeWithRetry({
    operation: () => createAndListOffer(program, seller, params),
    maxRetries: 3,
    retryDelay: 2000,
    errorHandler: (error, attempt) => {
      // Retry on network errors, but not on validation errors
      if (error.message.includes('blockhash')) {
        return true; // Retry
      }
      if (error.message.includes('Invalid')) {
        return false; // Don't retry validation errors
      }
      return attempt < 3; // Default retry logic
    }
  });
};
```

### Transaction Confirmation with Timeout

```typescript
const confirmTransactionWithTimeout = async (
  connection: Connection,
  signature: string,
  timeout: number = 60000
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const confirmation = await connection.getSignatureStatus(signature);
      
      if (confirmation.value) {
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        
        if (confirmation.value.confirmationStatus === 'confirmed' ||
            confirmation.value.confirmationStatus === 'finalized') {
          return true;
        }
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.warn('Error checking transaction status:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
};
```

For additional examples and advanced patterns, see the [examples directory](./examples/) and other API documentation files.