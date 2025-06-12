import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { P2pExchange } from '../target/types/p2p_exchange';
import { Keypair, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

describe('Comprehensive P2P Exchange Tests', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pExchange as Program<P2pExchange>;

  let admin: Keypair;
  let seller: Keypair;
  let buyer: Keypair;
  let juror1: Keypair;
  let juror2: Keypair;
  let juror3: Keypair;
  let offerKeypair: Keypair;
  let disputeKeypair: Keypair;
  let adminPda: PublicKey;
  let escrowPda: PublicKey;

  beforeEach(async () => {
    admin = Keypair.generate();
    seller = Keypair.generate();
    buyer = Keypair.generate();
    juror1 = Keypair.generate();
    juror2 = Keypair.generate();
    juror3 = Keypair.generate();
    offerKeypair = Keypair.generate();
    disputeKeypair = Keypair.generate();

    // Derive PDAs
    [adminPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(admin.publicKey, 2 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(seller.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(buyer.publicKey, 3 * LAMPORTS_PER_SOL)
      ),
    ]);
  });

  describe('Admin Setup', () => {
    it('Initializes admin', async () => {
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const adminAccount = await program.account.admin.fetch(adminPda);
      expect(adminAccount.authority.toString()).to.equal(admin.publicKey.toString());
    });
  });

  describe('Offer Lifecycle with PDA Escrow', () => {
    beforeEach(async () => {
      // Initialize admin first
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
    });

    it('Creates an offer with PDA escrow', async () => {
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
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
      
      expect(offerAccount.seller.toString()).to.equal(seller.publicKey.toString());
      expect(offerAccount.buyer).to.be.null;
      expect(offerAccount.amount.toString()).to.equal(amount.toString());
      expect(offerAccount.status).to.equal(0); // Created status
      expect(escrowAccount.offer.toString()).to.equal(offerKeypair.publicKey.toString());

      // Check that escrow account has the SOL
      const escrowBalance = await provider.connection.getBalance(escrowPda);
      expect(escrowBalance).to.be.greaterThan(amount); // Should have amount + rent
    });

    it('Lists and accepts an offer', async () => {
      // Create offer first
      await program.methods
        .createOffer(
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(1000),
          "USD",
          "Bank Transfer",
          new anchor.BN(Math.floor(Date.now() / 1000))
        )
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      // List the offer
      await program.methods
        .listOffer()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      // Accept the offer
      const securityBond = 0.1 * LAMPORTS_PER_SOL;
      await program.methods
        .acceptOffer(new anchor.BN(securityBond))
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.buyer.toString()).to.equal(buyer.publicKey.toString());
      expect(offerAccount.status).to.equal(2); // Accepted status
      expect(offerAccount.securityBond.toString()).to.equal(securityBond.toString());
    });

    it('Completes full trade workflow', async () => {
      // Create and list offer
      await program.methods
        .createOffer(
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(1000),
          "USD",
          "Bank Transfer",
          new anchor.BN(Math.floor(Date.now() / 1000))
        )
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      await program.methods
        .listOffer()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      // Accept offer
      await program.methods
        .acceptOffer(new anchor.BN(0))
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Mark fiat sent
      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      // Confirm fiat receipt
      await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      // Release SOL
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);
      
      await program.methods
        .releaseSol()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);

      expect(offerAccount.status).to.equal(6); // Completed status
      expect(buyerBalanceAfter).to.be.greaterThan(buyerBalanceBefore);
    });
  });

  describe('Dispute Resolution Workflow', () => {
    beforeEach(async () => {
      // Initialize admin and create accepted offer
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      await program.methods
        .createOffer(
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(1000),
          "USD",
          "Bank Transfer",
          new anchor.BN(Math.floor(Date.now() / 1000))
        )
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      await program.methods
        .listOffer()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      await program.methods
        .acceptOffer(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
    });

    it('Opens a dispute', async () => {
      const reason = "Buyer did not send fiat payment";

      await program.methods
        .openDispute(reason)
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          initiator: seller.publicKey,
          respondent: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, disputeKeypair])
        .rpc();

      const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);

      expect(disputeAccount.initiator.toString()).to.equal(seller.publicKey.toString());
      expect(disputeAccount.respondent.toString()).to.equal(buyer.publicKey.toString());
      expect(disputeAccount.reason).to.equal(reason);
      expect(disputeAccount.status).to.equal(0); // Opened status
      expect(offerAccount.status).to.equal(5); // DisputeOpened status
    });

    it('Assigns jurors to dispute', async () => {
      // Open dispute first
      await program.methods
        .openDispute("Payment issue")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          initiator: seller.publicKey,
          respondent: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, disputeKeypair])
        .rpc();

      // Assign jurors
      await program.methods
        .assignJurors()
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror1: juror1.publicKey,
          juror2: juror2.publicKey,
          juror3: juror3.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(1); // JurorsAssigned status
      expect(disputeAccount.jurors[0].toString()).to.equal(juror1.publicKey.toString());
      expect(disputeAccount.jurors[1].toString()).to.equal(juror2.publicKey.toString());
      expect(disputeAccount.jurors[2].toString()).to.equal(juror3.publicKey.toString());
    });

    it('Submits evidence and casts votes', async () => {
      // Open dispute and assign jurors
      await program.methods
        .openDispute("Payment issue")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          initiator: seller.publicKey,
          respondent: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, disputeKeypair])
        .rpc();

      await program.methods
        .assignJurors()
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror1: juror1.publicKey,
          juror2: juror2.publicKey,
          juror3: juror3.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      // Submit evidence
      await program.methods
        .submitEvidence("https://evidence.example.com/seller-proof")
        .accounts({
          dispute: disputeKeypair.publicKey,
          submitter: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      await program.methods
        .submitEvidence("https://evidence.example.com/buyer-proof")
        .accounts({
          dispute: disputeKeypair.publicKey,
          submitter: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      // Cast votes
      const [vote1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror1.publicKey.toBuffer()],
        program.programId
      );

      const [vote2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .castVote(true) // Vote for buyer
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror1.publicKey,
          vote: vote1Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror1])
        .rpc();

      await program.methods
        .castVote(true) // Vote for buyer
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror2.publicKey,
          vote: vote2Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror2])
        .rpc();

      const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(3); // VerdictReached status
      expect(disputeAccount.votesForBuyer).to.equal(2);
      expect(disputeAccount.votesForSeller).to.equal(0);
    });

    it('Executes verdict and transfers funds', async () => {
      // Setup dispute with votes
      await program.methods
        .openDispute("Payment issue")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          initiator: seller.publicKey,
          respondent: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, disputeKeypair])
        .rpc();

      await program.methods
        .assignJurors()
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror1: juror1.publicKey,
          juror2: juror2.publicKey,
          juror3: juror3.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      // Cast majority votes for buyer
      const [vote1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror1.publicKey.toBuffer()],
        program.programId
      );

      const [vote2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .castVote(true)
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror1.publicKey,
          vote: vote1Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror1])
        .rpc();

      await program.methods
        .castVote(true)
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror2.publicKey,
          vote: vote2Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror2])
        .rpc();

      // Execute verdict
      const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

      await program.methods
        .executeVerdict()
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          escrowAccount: escrowPda,
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
      const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);

      expect(disputeAccount.status).to.equal(5); // Resolved status
      expect(offerAccount.status).to.equal(6); // Completed status
      expect(buyerBalanceAfter).to.be.greaterThan(buyerBalanceBefore);
    });
  });

  describe('Reputation System', () => {
    it('Creates and updates reputation', async () => {
      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), seller.publicKey.toBuffer()],
        program.programId
      );

      // Create reputation
      await program.methods
        .createReputation()
        .accounts({
          reputation: reputationPda,
          user: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      // Update reputation
      await program.methods
        .updateReputation(true, false, false) // Successful trade, no dispute
        .accounts({
          reputation: reputationPda,
          user: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      const reputationAccount = await program.account.reputation.fetch(reputationPda);
      expect(reputationAccount.user.toString()).to.equal(seller.publicKey.toString());
      expect(reputationAccount.successfulTrades).to.equal(1);
      expect(reputationAccount.disputedTrades).to.equal(0);
      expect(reputationAccount.rating).to.be.greaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('Prevents unauthorized actions', async () => {
      // Initialize admin and create offer
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      await program.methods
        .createOffer(
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(1000),
          "USD",
          "Bank Transfer",
          new anchor.BN(Math.floor(Date.now() / 1000))
        )
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller, offerKeypair])
        .rpc();

      // Try to list offer with wrong signer
      try {
        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: buyer.publicKey, // Wrong signer
          })
          .signers([buyer])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("A seeds constraint was violated");
      }
    });

    it('Validates input lengths', async () => {
      const longString = "x".repeat(300); // Too long for fiat currency
      
      try {
        await program.methods
          .createOffer(
            new anchor.BN(LAMPORTS_PER_SOL),
            new anchor.BN(1000),
            longString, // This should be too long
            "Bank Transfer",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: offerKeypair.publicKey,
            seller: seller.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller, offerKeypair])
          .rpc();
        
        expect.fail("Should have thrown an error for input too long");
      } catch (error) {
        expect(error.message).to.include("InputTooLong");
      }
    });
  });
});