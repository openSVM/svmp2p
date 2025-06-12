/**
 * Reward System Transaction Utilities
 * 
 * Functions for executing reward-related transactions on the Solana blockchain
 * including claiming rewards, creating user reward accounts, and checking balances.
 */

// Conditional imports to handle test environment
let web3, PublicKey, Transaction, SystemProgram, Connection;
let getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID;

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const solanaWeb3 = require('@solana/web3.js');
    const splToken = require('@solana/spl-token');
    
    web3 = solanaWeb3;
    PublicKey = solanaWeb3.PublicKey;
    Transaction = solanaWeb3.Transaction;
    SystemProgram = solanaWeb3.SystemProgram;
    Connection = solanaWeb3.Connection;
    
    getAssociatedTokenAddress = splToken.getAssociatedTokenAddress;
    createAssociatedTokenAccountInstruction = splToken.createAssociatedTokenAccountInstruction;
    TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;
  } catch (error) {
    console.warn('Solana libraries not available, using mock implementation');
  }
}

// Program ID - should match the deployed program
const PROGRAM_ID_STRING = 'FKkTQLgBE9vDZqgXKWrXZfAv5HgCQdsjDZDzPfJosPt9';

// PDA seeds
const REWARD_TOKEN_SEED = 'reward_token';
const USER_REWARDS_SEED = 'user_rewards';
const REWARD_MINT_SEED = 'reward_mint';

/**
 * Claims accumulated rewards for a user
 * @param {Object} wallet - Wallet adapter instance
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {Promise<string>} Transaction signature
 */
export const claimRewards = async (wallet, connection, userPublicKey) => {
  if (!web3 || !PublicKey) {
    // Mock implementation for test environment
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 10% chance of failure for demonstration
        if (Math.random() < 0.1) {
          reject(new Error('Simulated transaction failure: Network congestion'));
        } else {
          resolve('mock_transaction_signature_' + Date.now());
        }
      }, 2000);
    });
  }

  try {
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

    // Derive PDAs
    const [rewardTokenPda] = await PublicKey.findProgramAddress(
      [Buffer.from(REWARD_TOKEN_SEED)],
      PROGRAM_ID
    );

    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    const [rewardMintPda] = await PublicKey.findProgramAddress(
      [Buffer.from(REWARD_MINT_SEED)],
      PROGRAM_ID
    );

    // Get or create associated token account for user
    const userTokenAccount = await getAssociatedTokenAddress(
      rewardMintPda,
      userPublicKey
    );

    // Check if token account exists
    const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
    
    const transaction = new Transaction();

    // Create associated token account if it doesn't exist
    if (!tokenAccountInfo) {
      const createTokenAccountIx = createAssociatedTokenAccountInstruction(
        userPublicKey, // payer
        userTokenAccount, // ata
        userPublicKey, // owner
        rewardMintPda // mint
      );
      transaction.add(createTokenAccountIx);
    }

    // Create claim rewards instruction
    // Note: This would need to be built using the actual Anchor IDL
    // For now, this is a placeholder showing the structure
    const claimRewardsIx = {
      keys: [
        { pubkey: rewardTokenPda, isSigner: false, isWritable: false },
        { pubkey: rewardMintPda, isSigner: false, isWritable: true },
        { pubkey: userRewardsPda, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([]) // Would contain serialized instruction data
    };

    transaction.add(claimRewardsIx);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw new Error(`Failed to claim rewards: ${error.message}`);
  }
};

/**
 * Creates a user rewards account if it doesn't exist
 * @param {Object} wallet - Wallet adapter instance
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {Promise<string>} Transaction signature
 */
export const createUserRewardsAccount = async (wallet, connection, userPublicKey) => {
  if (!web3 || !PublicKey) {
    // Mock implementation
    return Promise.resolve('mock_create_account_signature_' + Date.now());
  }

  try {
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(userRewardsPda);
    if (accountInfo) {
      throw new Error('User rewards account already exists');
    }

    const transaction = new Transaction();

    // Create user rewards account instruction
    const createUserRewardsIx = {
      keys: [
        { pubkey: userRewardsPda, isSigner: false, isWritable: true },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([]) // Would contain serialized instruction data
    };

    transaction.add(createUserRewardsIx);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('Error creating user rewards account:', error);
    throw new Error(`Failed to create user rewards account: ${error.message}`);
  }
};

/**
 * Checks if the user has an existing rewards account
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} userPublicKey - User's public key
 * @returns {Promise<boolean>} True if account exists
 */
export const hasUserRewardsAccount = async (connection, userPublicKey) => {
  if (!web3 || !PublicKey) {
    // Mock implementation - randomly return true/false
    return Math.random() > 0.5;
  }

  try {
    const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

    const [userRewardsPda] = await PublicKey.findProgramAddress(
      [Buffer.from(USER_REWARDS_SEED), userPublicKey.toBuffer()],
      PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(userRewardsPda);
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking user rewards account:', error);
    return false;
  }
};

/**
 * Enhanced retry logic for transactions
 * @param {Function} transactionFn - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Initial delay between retries in milliseconds
 * @returns {Promise} Result of the transaction function
 */
export const retryTransaction = async (transactionFn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transactionFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on user-cancelled transactions
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.warn(`Transaction attempt ${attempt} failed, retrying in ${delayMs}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }
  
  throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError.message}`);
};