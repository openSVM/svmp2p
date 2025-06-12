/**
 * Basic Trading Example: Complete Offer Creation and Listing
 * 
 * This example demonstrates how to create a new trading offer with proper
 * escrow setup and make it visible in the marketplace.
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Keypair,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';

interface OfferParams {
  amount: BN;           // SOL amount in lamports
  fiatAmount: BN;       // Fiat amount in smallest unit (e.g., cents)
  currency: string;     // Currency code (e.g., "USD")
  paymentMethod: string; // Payment description
}

/**
 * Creates a new trading offer with escrowed SOL
 * @param program - Anchor program instance
 * @param seller - Seller's keypair
 * @param params - Offer parameters
 * @returns Created offer public key and transaction signature
 */
export const createOffer = async (
  program: Program,
  seller: Keypair,
  params: OfferParams
): Promise<{ offerPubkey: PublicKey; signature: string }> => {
  try {
    // Validate input parameters
    validateOfferParams(params);
    
    // Generate new offer account
    const offerKeypair = Keypair.generate();
    
    // Derive escrow account PDA
    const [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    console.log(`Creating offer: ${offerKeypair.publicKey.toString()}`);
    console.log(`Escrow account: ${escrowPDA.toString()}`);
    
    // Check seller has sufficient funds
    const connection = program.provider.connection;
    await checkSufficientFunds(connection, seller.publicKey, params.amount);
    
    // Create the offer with escrow
    const signature = await program.methods
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
    
    console.log(`Offer created successfully: ${signature}`);
    
    return {
      offerPubkey: offerKeypair.publicKey,
      signature
    };
    
  } catch (error) {
    console.error('Failed to create offer:', error);
    throw new Error(`Offer creation failed: ${error.message}`);
  }
};

/**
 * Lists an existing offer in the public marketplace
 * @param program - Anchor program instance
 * @param seller - Seller's keypair
 * @param offerPubkey - Offer account public key
 * @returns Transaction signature
 */
export const listOffer = async (
  program: Program,
  seller: Keypair,
  offerPubkey: PublicKey
): Promise<string> => {
  try {
    // Verify offer exists and seller owns it
    const offerAccount = await program.account.offer.fetch(offerPubkey);
    
    if (!offerAccount.seller.equals(seller.publicKey)) {
      throw new Error('Only offer creator can list the offer');
    }
    
    if (offerAccount.status !== 0) { // CREATED status
      throw new Error('Offer must be in CREATED status to list');
    }
    
    console.log(`Listing offer: ${offerPubkey.toString()}`);
    
    // List the offer publicly
    const signature = await program.methods
      .listOffer()
      .accounts({
        offer: offerPubkey,
        seller: seller.publicKey,
      })
      .signers([seller])
      .rpc();
    
    console.log(`Offer listed successfully: ${signature}`);
    return signature;
    
  } catch (error) {
    console.error('Failed to list offer:', error);
    throw new Error(`Offer listing failed: ${error.message}`);
  }
};

/**
 * Creates and immediately lists an offer
 * @param program - Anchor program instance
 * @param seller - Seller's keypair
 * @param params - Offer parameters
 * @returns Offer public key and listing signature
 */
export const createAndListOffer = async (
  program: Program,
  seller: Keypair,
  params: OfferParams
): Promise<{ offerPubkey: PublicKey; signature: string }> => {
  // Create the offer
  const { offerPubkey } = await createOffer(program, seller, params);
  
  // List it publicly
  const listingSignature = await listOffer(program, seller, offerPubkey);
  
  return {
    offerPubkey,
    signature: listingSignature
  };
};

/**
 * Validates offer parameters
 * @param params - Offer parameters to validate
 */
const validateOfferParams = (params: OfferParams): void => {
  if (params.amount.lte(new BN(0))) {
    throw new Error('SOL amount must be greater than zero');
  }
  
  if (params.fiatAmount.lte(new BN(0))) {
    throw new Error('Fiat amount must be greater than zero');
  }
  
  if (!params.currency || params.currency.length > 10) {
    throw new Error('Currency code must be 1-10 characters');
  }
  
  if (!params.paymentMethod || params.paymentMethod.length > 50) {
    throw new Error('Payment method must be 1-50 characters');
  }
  
  // Validate UTF-8 encoding
  try {
    new TextEncoder().encode(params.currency);
    new TextEncoder().encode(params.paymentMethod);
  } catch (error) {
    throw new Error('Currency and payment method must be valid UTF-8');
  }
};

/**
 * Checks if seller has sufficient funds for the transaction
 * @param connection - Solana connection
 * @param publicKey - Seller's public key
 * @param amount - Required amount in lamports
 */
const checkSufficientFunds = async (
  connection: Connection,
  publicKey: PublicKey,
  amount: BN
): Promise<void> => {
  const balance = await connection.getBalance(publicKey);
  const requiredAmount = amount.toNumber();
  const estimatedFee = 5000; // Estimated transaction fee
  
  if (balance < requiredAmount + estimatedFee) {
    throw new Error(
      `Insufficient funds. Required: ${(requiredAmount + estimatedFee) / LAMPORTS_PER_SOL} SOL, ` +
      `Available: ${balance / LAMPORTS_PER_SOL} SOL`
    );
  }
};

/**
 * Example usage
 */
export const exampleUsage = async () => {
  // Setup (replace with your actual setup)
  const connection = new Connection('https://api.devnet.solana.com');
  const seller = Keypair.generate(); // In real app, this would be from wallet
  
  // Fund the seller account for testing
  await connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL);
  
  // Wait for airdrop confirmation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const { offerPubkey, signature } = await createAndListOffer(
      program, // Your program instance
      seller,
      {
        amount: new BN(1 * LAMPORTS_PER_SOL), // 1 SOL
        fiatAmount: new BN(50000), // $500.00 in cents
        currency: 'USD',
        paymentMethod: 'Bank transfer - Chase Bank'
      }
    );
    
    console.log('Offer created and listed successfully!');
    console.log('Offer ID:', offerPubkey.toString());
    console.log('Transaction:', signature);
    
  } catch (error) {
    console.error('Example failed:', error);
  }
};