import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { P2pExchange } from '../target/types/p2p_exchange';
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('p2p_exchange', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pExchange as Program<P2pExchange>;

  let seller: Keypair;
  let buyer: Keypair;
  let offerKeypair: Keypair;
  let escrowKeypair: Keypair;

  beforeEach(() => {
    seller = Keypair.generate();
    buyer = Keypair.generate();
    offerKeypair = Keypair.generate();
    escrowKeypair = Keypair.generate();
  });

  it('Creates an offer', async () => {
    // Airdrop SOL to seller
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    const amount = LAMPORTS_PER_SOL; // 1 SOL
    const fiatAmount = 1000; // $1000
    const fiatCurrency = "USD";
    const paymentMethod = "Bank Transfer";
    const createdAt = Math.floor(Date.now() / 1000);

    try {
      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(fiatAmount),
          fiatCurrency,
          paymentMethod,
          new anchor.BN(createdAt)
        )
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          escrowAccount: escrowKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      // Fetch the offer account
      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      
      expect(offerAccount.seller.toString()).to.equal(seller.publicKey.toString());
      expect(offerAccount.amount.toString()).to.equal(amount.toString());
      expect(offerAccount.fiatCurrency).to.equal(fiatCurrency);
      expect(offerAccount.paymentMethod).to.equal(paymentMethod);
      expect(offerAccount.status).to.equal(0); // Created status
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  });

  it('Lists an offer', async () => {
    // First create an offer
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    const amount = LAMPORTS_PER_SOL;
    const fiatAmount = 1000;
    const fiatCurrency = "USD";
    const paymentMethod = "Bank Transfer";
    const createdAt = Math.floor(Date.now() / 1000);

    await program.methods
      .createOffer(
        new anchor.BN(amount),
        new anchor.BN(fiatAmount),
        fiatCurrency,
        paymentMethod,
        new anchor.BN(createdAt)
      )
      .accounts({
        offer: offerKeypair.publicKey,
        seller: seller.publicKey,
        escrowAccount: escrowKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller, offerKeypair])
      .rpc();

    // Now list the offer
    await program.methods
      .listOffer()
      .accounts({
        offer: offerKeypair.publicKey,
        seller: seller.publicKey,
      })
      .signers([seller])
      .rpc();

    // Fetch the offer account
    const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
    expect(offerAccount.status).to.equal(1); // Listed status
  });

  it('Creates a reputation account', async () => {
    const userKeypair = Keypair.generate();

    // Airdrop SOL to user
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(userKeypair.publicKey, LAMPORTS_PER_SOL)
    );

    const [reputationPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), userKeypair.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createReputation()
      .accounts({
        reputation: reputationPda,
        user: userKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();

    // Fetch the reputation account
    const reputationAccount = await program.account.reputation.fetch(reputationPda);
    expect(reputationAccount.user.toString()).to.equal(userKeypair.publicKey.toString());
    expect(reputationAccount.successfulTrades).to.equal(0);
    expect(reputationAccount.rating).to.equal(100);
  });
});