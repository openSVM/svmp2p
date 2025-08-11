import { useMemo } from 'react';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from '../idl/p2p_exchange.json';

// Program ID from the deployed program on Solana Devnet
const PROGRAM_ID = new PublicKey('AqSnWdAnJgdnHzXpUApk9ctPUhaLiikNrrgecbm3YH2k');

/**
 * Hook to create and provide Anchor Program instance
 * @param {Connection} connection - Solana connection instance
 * @param {Object} wallet - Wallet adapter instance with publicKey and signTransaction
 * @returns {Program|null} Anchor program instance or null if not ready
 */
export const useProgram = (connection, wallet) => {
  return useMemo(() => {
    if (!connection || !wallet || !wallet.publicKey) {
      return null;
    }

    try {
      // Create provider with connection and wallet
      const provider = new AnchorProvider(
        connection,
        wallet,
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
        }
      );

      // Create program instance
      const program = new Program(idl, PROGRAM_ID, provider);
      
      return program;
    } catch (error) {
      console.error('Error creating program:', error);
      return null;
    }
  }, [connection, wallet]);
};

/**
 * Get the program ID
 * @returns {PublicKey} The program ID
 */
export const getProgramId = () => PROGRAM_ID;

/**
 * Get the IDL
 * @returns {Object} The program IDL
 */
export const getIdl = () => idl;