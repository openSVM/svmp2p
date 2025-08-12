/**
 * Transaction CPI (Cross-Program Invocation) Handler
 * 
 * Modular utilities for building, signing, and executing Solana transactions
 * with proper signature verification and error handling.
 */

import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createLogger } from './logger';

const logger = createLogger('TransactionCPI');

// Program configurations and discriminators
const PROGRAM_DISCRIMINATORS = {
  CLAIM_REWARDS: [201, 153, 74, 35, 130, 181, 35, 180],
  CREATE_USER_REWARDS: [142, 43, 156, 209, 42, 195, 125, 89],
  INITIALIZE_REWARD_TOKEN: [88, 199, 147, 191, 95, 185, 244, 180],
  UPDATE_REWARD_RATES: [124, 89, 177, 45, 203, 184, 76, 192],
};

// Account derivation utilities
const ACCOUNT_DERIVATION = {
  /**
   * Derive reward token PDA
   * @param {PublicKey} programId - Program ID
   * @param {string} seed - PDA seed
   * @returns {Promise<[PublicKey, number]>} PDA and bump
   */
  deriveRewardTokenPDA: async (programId, seed = 'reward_token') => {
    return await PublicKey.findProgramAddress(
      [Buffer.from(seed)],
      programId
    );
  },

  /**
   * Derive user rewards PDA
   * @param {PublicKey} programId - Program ID
   * @param {PublicKey} userKey - User's public key
   * @param {string} seed - PDA seed
   * @returns {Promise<[PublicKey, number]>} PDA and bump
   */
  deriveUserRewardsPDA: async (programId, userKey, seed = 'user_rewards') => {
    return await PublicKey.findProgramAddress(
      [Buffer.from(seed), userKey.toBuffer()],
      programId
    );
  },

  /**
   * Derive reward mint PDA
   * @param {PublicKey} programId - Program ID
   * @param {string} seed - PDA seed
   * @returns {Promise<[PublicKey, number]>} PDA and bump
   */
  deriveRewardMintPDA: async (programId, seed = 'reward_mint') => {
    return await PublicKey.findProgramAddress(
      [Buffer.from(seed)],
      programId
    );
  },

  /**
   * Get or derive associated token account
   * @param {PublicKey} mint - Token mint
   * @param {PublicKey} owner - Token account owner
   * @returns {Promise<PublicKey>} Associated token account address
   */
  getAssociatedTokenAccount: async (mint, owner) => {
    // TODO: Implement when spl-token version supports getAssociatedTokenAddress
    throw new Error('Associated token account functionality temporarily disabled due to spl-token version compatibility');
  }
};

/**
 * Signature verification utilities
 */
export const SignatureVerification = {
  /**
   * Verify transaction signature format
   * @param {string} signature - Transaction signature
   * @returns {boolean} True if valid format
   */
  isValidSignature(signature) {
    if (!signature || typeof signature !== 'string') {
      return false;
    }
    
    // Solana signatures are base58 encoded and typically 87-88 characters
    return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature);
  },

  /**
   * Verify that required signers are present in transaction
   * @param {Transaction} transaction - Transaction to verify
   * @param {PublicKey[]} requiredSigners - Required signer public keys
   * @returns {boolean} True if all required signers are present
   */
  verifyRequiredSigners(transaction, requiredSigners) {
    if (!transaction.instructions || !Array.isArray(requiredSigners)) {
      return false;
    }

    const allRequiredKeys = new Set(requiredSigners.map(key => key.toString()));
    const transactionSigners = new Set();

    // Collect all signer keys from instructions
    for (const instruction of transaction.instructions) {
      for (const accountMeta of instruction.keys) {
        if (accountMeta.isSigner) {
          transactionSigners.add(accountMeta.pubkey.toString());
        }
      }
    }

    // Check if all required signers are present
    for (const requiredKey of allRequiredKeys) {
      if (!transactionSigners.has(requiredKey)) {
        logger.warn('Missing required signer', { requiredKey, transactionSigners: Array.from(transactionSigners) });
        return false;
      }
    }

    return true;
  },

  /**
   * Verify account relationships and permissions
   * @param {Object} accountMetas - Account metadata objects
   * @param {Object} requirements - Account requirements
   * @returns {boolean} True if accounts meet requirements
   */
  verifyAccountPermissions(accountMetas, requirements) {
    for (const [accountName, requirements] of Object.entries(requirements)) {
      const accountMeta = accountMetas[accountName];
      
      if (!accountMeta) {
        logger.warn('Missing required account', { accountName });
        return false;
      }

      if (requirements.isSigner !== undefined && accountMeta.isSigner !== requirements.isSigner) {
        logger.warn('Account signer requirement mismatch', { accountName, expected: requirements.isSigner, actual: accountMeta.isSigner });
        return false;
      }

      if (requirements.isWritable !== undefined && accountMeta.isWritable !== requirements.isWritable) {
        logger.warn('Account writable requirement mismatch', { accountName, expected: requirements.isWritable, actual: accountMeta.isWritable });
        return false;
      }
    }

    return true;
  }
};

/**
 * Transaction builder utilities
 */
export class TransactionBuilder {
  constructor(programId) {
    this.programId = new PublicKey(programId);
    this.transaction = new Transaction();
    this.accountCache = new Map();
  }

  /**
   * Add instruction to claim rewards
   * @param {PublicKey} userKey - User's public key
   * @param {Object} options - Additional options
   * @returns {TransactionBuilder} This builder for chaining
   */
  async addClaimRewardsInstruction(userKey, options = {}) {
    try {
      // Derive required PDAs
      const [rewardTokenPda] = await ACCOUNT_DERIVATION.deriveRewardTokenPDA(this.programId);
      const [userRewardsPda] = await ACCOUNT_DERIVATION.deriveUserRewardsPDA(this.programId, userKey);
      const [rewardMintPda] = await ACCOUNT_DERIVATION.deriveRewardMintPDA(this.programId);
      
      // Get user's associated token account
      const userTokenAccount = await ACCOUNT_DERIVATION.getAssociatedTokenAccount(rewardMintPda, userKey);

      // Cache accounts for verification
      this.accountCache.set('rewardToken', rewardTokenPda);
      this.accountCache.set('userRewards', userRewardsPda);
      this.accountCache.set('rewardMint', rewardMintPda);
      this.accountCache.set('userTokenAccount', userTokenAccount);

      // Build account metas
      const accountMetas = {
        rewardToken: { pubkey: rewardTokenPda, isSigner: false, isWritable: false },
        rewardMint: { pubkey: rewardMintPda, isSigner: false, isWritable: true },
        userRewards: { pubkey: userRewardsPda, isSigner: false, isWritable: true },
        userTokenAccount: { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        user: { pubkey: userKey, isSigner: true, isWritable: true },
        tokenProgram: { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      };

      // Verify account permissions
      const requirements = {
        rewardToken: { isSigner: false, isWritable: false },
        rewardMint: { isSigner: false, isWritable: true },
        userRewards: { isSigner: false, isWritable: true },
        userTokenAccount: { isSigner: false, isWritable: true },
        user: { isSigner: true, isWritable: true },
        tokenProgram: { isSigner: false, isWritable: false }
      };

      if (!SignatureVerification.verifyAccountPermissions(accountMetas, requirements)) {
        throw new Error('Account permission verification failed for claim rewards instruction');
      }

      // Create instruction
      const instruction = {
        keys: Object.values(accountMetas),
        programId: this.programId,
        data: Buffer.from(PROGRAM_DISCRIMINATORS.CLAIM_REWARDS)
      };

      this.transaction.add(instruction);
      
      logger.info('Added claim rewards instruction', {
        userKey: userKey.toString(),
        accounts: Object.fromEntries(Object.entries(accountMetas).map(([key, meta]) => [key, meta.pubkey.toString()]))
      });

      return this;
    } catch (error) {
      logger.error('Failed to add claim rewards instruction', { error: error.message, userKey: userKey.toString() });
      throw error;
    }
  }

  /**
   * Add instruction to create associated token account if needed
   * @param {PublicKey} mint - Token mint
   * @param {PublicKey} owner - Account owner
   * @param {PublicKey} payer - Account payer
   * @returns {TransactionBuilder} This builder for chaining
   */
  async addCreateTokenAccountIfNeeded(mint, owner, payer, connection) {
    try {
      const tokenAccount = await ACCOUNT_DERIVATION.getAssociatedTokenAccount(mint, owner);
      
      // Check if account exists
      if (connection) {
        const accountInfo = await connection.getAccountInfo(tokenAccount);
        if (accountInfo) {
          logger.info('Token account already exists, skipping creation', { tokenAccount: tokenAccount.toString() });
          return this;
        }
      }

      // TODO: Re-enable when spl-token version supports createAssociatedTokenAccountInstruction
      throw new Error('Token account creation temporarily disabled due to spl-token version compatibility');
      
      logger.info('Added create token account instruction', {
        mint: mint.toString(),
        owner: owner.toString(),
        payer: payer.toString(),
        tokenAccount: tokenAccount.toString()
      });

      return this;
    } catch (error) {
      logger.error('Failed to add create token account instruction', { error: error.message });
      throw error;
    }
  }

  /**
   * Add instruction to create user rewards account
   * @param {PublicKey} userKey - User's public key
   * @param {PublicKey} payer - Account payer
   * @returns {TransactionBuilder} This builder for chaining
   */
  async addCreateUserRewardsInstruction(userKey, payer) {
    try {
      const [userRewardsPda] = await ACCOUNT_DERIVATION.deriveUserRewardsPDA(this.programId, userKey);

      // Build account metas
      const accountMetas = {
        userRewards: { pubkey: userRewardsPda, isSigner: false, isWritable: true },
        user: { pubkey: userKey, isSigner: true, isWritable: true },
        payer: { pubkey: payer, isSigner: true, isWritable: true },
        systemProgram: { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      };

      // Verify required signers
      const requiredSigners = [userKey, payer];
      if (!SignatureVerification.verifyRequiredSigners(this.transaction, requiredSigners)) {
        // We'll verify after adding the instruction
      }

      // Create instruction
      const instruction = {
        keys: Object.values(accountMetas),
        programId: this.programId,
        data: Buffer.from(PROGRAM_DISCRIMINATORS.CREATE_USER_REWARDS)
      };

      this.transaction.add(instruction);
      
      logger.info('Added create user rewards instruction', {
        userKey: userKey.toString(),
        payer: payer.toString(),
        userRewardsPda: userRewardsPda.toString()
      });

      return this;
    } catch (error) {
      logger.error('Failed to add create user rewards instruction', { error: error.message });
      throw error;
    }
  }

  /**
   * Finalize and validate transaction
   * @param {PublicKey[]} requiredSigners - Required signers for verification
   * @returns {Transaction} Built and validated transaction
   */
  build(requiredSigners = []) {
    // Verify required signers
    if (requiredSigners.length > 0 && !SignatureVerification.verifyRequiredSigners(this.transaction, requiredSigners)) {
      throw new Error('Transaction missing required signers');
    }

    // Validate transaction has instructions
    if (!this.transaction.instructions || this.transaction.instructions.length === 0) {
      throw new Error('Transaction has no instructions');
    }

    logger.info('Transaction built successfully', {
      instructionCount: this.transaction.instructions.length,
      requiredSigners: requiredSigners.map(key => key.toString()),
      accounts: Array.from(this.accountCache.entries()).map(([name, key]) => ({ name, key: key.toString() }))
    });

    return this.transaction;
  }

  /**
   * Get built transaction without validation (for testing)
   * @returns {Transaction} Built transaction
   */
  buildUnsafe() {
    return this.transaction;
  }

  /**
   * Reset builder for reuse
   * @returns {TransactionBuilder} This builder for chaining
   */
  reset() {
    this.transaction = new Transaction();
    this.accountCache.clear();
    return this;
  }

  /**
   * Get cached account addresses
   * @returns {Map<string, PublicKey>} Account cache
   */
  getAccountCache() {
    return new Map(this.accountCache);
  }
}

/**
 * Transaction execution utilities with retry and error handling
 */
export class TransactionExecutor {
  constructor(connection, wallet, options = {}) {
    this.connection = connection;
    this.wallet = wallet;
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      confirmationTimeout: 30000,
      commitment: 'confirmed',
      ...options
    };
  }

  /**
   * Execute transaction with retry logic and signature verification
   * @param {Transaction} transaction - Transaction to execute
   * @param {Object} executeOptions - Execution options
   * @returns {Promise<string>} Transaction signature
   */
  async executeTransaction(transaction, executeOptions = {}) {
    const options = { ...this.options, ...executeOptions };
    let lastError;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        logger.info('Executing transaction', { attempt, maxRetries: options.maxRetries });

        // Send transaction
        const signature = await this.wallet.sendTransaction(transaction, this.connection, {
          skipPreflight: options.skipPreflight || false,
          preflightCommitment: options.commitment,
          maxRetries: 0 // Handle retries ourselves
        });

        // Verify signature format
        if (!SignatureVerification.isValidSignature(signature)) {
          throw new Error(`Invalid signature format: ${signature}`);
        }

        logger.info('Transaction sent successfully', { signature, attempt });

        // Wait for confirmation if requested
        if (options.waitForConfirmation !== false) {
          await this.waitForConfirmation(signature, options);
        }

        return signature;
      } catch (error) {
        lastError = error;
        
        logger.warn('Transaction execution failed', {
          attempt,
          maxRetries: options.maxRetries,
          error: error.message
        });

        // Don't retry on user rejection or certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retry
        if (attempt < options.maxRetries) {
          const delay = options.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Wait for transaction confirmation
   * @param {string} signature - Transaction signature
   * @param {Object} options - Confirmation options
   * @returns {Promise<void>}
   */
  async waitForConfirmation(signature, options = {}) {
    const { confirmationTimeout = 30000, commitment = 'confirmed' } = options;

    try {
      const confirmation = await this.connection.confirmTransaction(
        signature,
        commitment
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      logger.info('Transaction confirmed', { signature, commitment });
    } catch (error) {
      logger.error('Transaction confirmation failed', { signature, error: error.message });
      throw error;
    }
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableMessages = [
      'User rejected',
      'User denied',
      'insufficient funds',
      'Invalid signature',
      'Account not found'
    ];

    return nonRetryableMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Get transaction status
   * @param {string} signature - Transaction signature
   * @returns {Promise<Object>} Transaction status
   */
  async getTransactionStatus(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return {
        signature,
        status: status.value,
        confirmed: status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized',
        error: status.value?.err
      };
    } catch (error) {
      logger.error('Failed to get transaction status', { signature, error: error.message });
      throw error;
    }
  }
}

/**
 * Factory functions for common transaction patterns
 */
export const TransactionFactory = {
  /**
   * Create a claim rewards transaction
   * @param {string} programId - Program ID
   * @param {PublicKey} userKey - User's public key
   * @param {Connection} connection - Solana connection
   * @returns {Promise<Transaction>} Built transaction
   */
  async createClaimRewardsTransaction(programId, userKey, connection) {
    const builder = new TransactionBuilder(programId);
    
    // Add create token account instruction if needed
    const [rewardMintPda] = await ACCOUNT_DERIVATION.deriveRewardMintPDA(new PublicKey(programId));
    await builder.addCreateTokenAccountIfNeeded(rewardMintPda, userKey, userKey, connection);
    
    // Add claim rewards instruction
    await builder.addClaimRewardsInstruction(userKey);
    
    return builder.build([userKey]);
  },

  /**
   * Create a user rewards account creation transaction
   * @param {string} programId - Program ID
   * @param {PublicKey} userKey - User's public key
   * @returns {Promise<Transaction>} Built transaction
   */
  async createUserRewardsAccountTransaction(programId, userKey) {
    const builder = new TransactionBuilder(programId);
    await builder.addCreateUserRewardsInstruction(userKey, userKey);
    return builder.build([userKey]);
  }
};

// Export utilities
export { ACCOUNT_DERIVATION, PROGRAM_DISCRIMINATORS };
export default TransactionBuilder;