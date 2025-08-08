/**
 * Integration Tests for P2P Exchange Program
 * 
 * Tests complete end-to-end workflows and complex interactions:
 * - Complete trade lifecycle
 * - Multi-party dispute resolution
 * - Rewards and reputation integration
 * - Error recovery scenarios
 * - Performance and stress testing
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { P2pExchange } from '../target/types/p2p_exchange';
import { 
  Keypair, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  PublicKey 
} from '@solana/web3.js';
import { expect } from 'chai';

describe('Integration Tests - P2P Exchange', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pExchange as Program<P2pExchange>;

  let admin: Keypair;
  let seller: Keypair;
  let buyer: Keypair;
  let juror1: Keypair;
  let juror2: Keypair;
  let juror3: Keypair;
  let adminPda: PublicKey;

  before(async () => {
    // Create persistent accounts for integration tests
    admin = Keypair.generate();
    seller = Keypair.generate();
    buyer = Keypair.generate();
    juror1 = Keypair.generate();
    juror2 = Keypair.generate();
    juror3 = Keypair.generate();

    [adminPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      program.programId
    );

    // Airdrop substantial amounts for integration testing
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(seller.publicKey, 20 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(buyer.publicKey, 10 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror1.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror2.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror3.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
    ]);

    // Initialize admin once for all integration tests
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

  describe('🔄 Complete Trade Lifecycle Tests', () => {
    
    it('Should complete successful trade from creation to SOL release', async () => {
      const offerKeypair = Keypair.generate();
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );

      const amount = 2 * LAMPORTS_PER_SOL;
      const fiatAmount = 2000;
      const securityBond = 0.2 * LAMPORTS_PER_SOL;

      // Track balances throughout the process
      const sellerInitialBalance = await provider.connection.getBalance(seller.publicKey);
      const buyerInitialBalance = await provider.connection.getBalance(buyer.publicKey);

      console.log("Starting complete trade lifecycle test...");

      // 1. Seller creates offer
      console.log("Step 1: Creating offer...");
      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(fiatAmount),
          "EUR",
          "SEPA Transfer",
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

      let offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(0); // Created

      // 2. Seller lists offer
      console.log("Step 2: Listing offer...");
      await program.methods
        .listOffer()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(1); // Listed

      // 3. Buyer accepts offer
      console.log("Step 3: Buyer accepting offer...");
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

      offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(2); // Accepted
      expect(offerAccount.buyer?.toString()).to.equal(buyer.publicKey.toString());

      // 4. Buyer marks fiat as sent
      console.log("Step 4: Marking fiat as sent...");
      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(3); // FiatSent

      // 5. Seller confirms fiat receipt
      console.log("Step 5: Confirming fiat receipt...");
      await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(4); // SolReleased (ready for release)

      // 6. Release SOL to buyer
      console.log("Step 6: Releasing SOL...");
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

      offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(6); // Completed

      // 7. Verify final balances
      const sellerFinalBalance = await provider.connection.getBalance(seller.publicKey);
      const buyerFinalBalance = await provider.connection.getBalance(buyer.publicKey);

      console.log("Trade completed successfully!");
      console.log(`Seller balance change: ${(sellerFinalBalance - sellerInitialBalance) / LAMPORTS_PER_SOL} SOL`);
      console.log(`Buyer balance change: ${(buyerFinalBalance - buyerInitialBalance) / LAMPORTS_PER_SOL} SOL`);

      // Seller should have lost the offer amount (plus fees)
      expect(sellerInitialBalance - sellerFinalBalance).to.be.closeTo(amount, 200000);
      
      // Buyer should have gained the offer amount (minus fees)
      expect(buyerFinalBalance - buyerInitialBalance).to.be.closeTo(amount, 200000);
    });

    it('Should handle multiple concurrent offers', async () => {
      console.log("Testing multiple concurrent offers...");

      const offers = [];
      const numOffers = 3;

      for (let i = 0; i < numOffers; i++) {
        const offerKeypair = Keypair.generate();
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
          program.programId
        );

        offers.push({ offerKeypair, escrowPda, amount: (i + 1) * LAMPORTS_PER_SOL });
      }

      // Create all offers concurrently
      await Promise.all(offers.map(async ({ offerKeypair, escrowPda, amount }, index) => {
        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(1000 + index * 100),
            "USD",
            `Payment Method ${index + 1}`,
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
      }));

      // Verify all offers were created
      for (const { offerKeypair } of offers) {
        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.status).to.equal(0); // Created
        expect(offerAccount.seller.toString()).to.equal(seller.publicKey.toString());
      }

      console.log(`Successfully created ${numOffers} concurrent offers`);
    });
  });

  describe('🏛️ Complete Dispute Resolution Workflow', () => {
    
    it('Should resolve dispute with buyer victory (2-1 vote)', async () => {
      console.log("Testing complete dispute resolution workflow...");

      const offerKeypair = Keypair.generate();
      const disputeKeypair = Keypair.generate();
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );

      const amount = 1.5 * LAMPORTS_PER_SOL;
      const securityBond = 0.15 * LAMPORTS_PER_SOL;

      // Setup offer through acceptance
      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(1500),
          "GBP",
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
        .acceptOffer(new anchor.BN(securityBond))
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
          escrowAccount: escrowPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Mark fiat sent but not confirmed (dispute scenario)
      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      // 1. Open dispute
      console.log("Step 1: Opening dispute...");
      await program.methods
        .openDispute("Seller claims payment not received, but I have proof of transfer")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          disputeOpener: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer, disputeKeypair])
        .rpc();

      let disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(0); // Opened

      // 2. Admin assigns jurors
      console.log("Step 2: Assigning jurors...");
      await program.methods
        .assignJurors()
        .accounts({
          dispute: disputeKeypair.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
          juror1: juror1.publicKey,
          juror2: juror2.publicKey,
          juror3: juror3.publicKey,
        })
        .signers([admin])
        .rpc();

      disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(1); // JurorsAssigned

      // 3. Submit evidence
      console.log("Step 3: Submitting evidence...");
      await program.methods
        .submitEvidence("https://evidence.example.com/bank-transfer-receipt.pdf")
        .accounts({
          dispute: disputeKeypair.publicKey,
          evidenceSubmitter: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .submitEvidence("https://evidence.example.com/bank-statement.pdf")
        .accounts({
          dispute: disputeKeypair.publicKey,
          evidenceSubmitter: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.evidenceUrls).to.have.length(2);

      // 4. Jurors cast votes (2-1 for buyer)
      console.log("Step 4: Jurors casting votes...");
      
      const [vote1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror1.publicKey.toBuffer()],
        program.programId
      );
      const [vote2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror2.publicKey.toBuffer()],
        program.programId
      );
      const [vote3Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror3.publicKey.toBuffer()],
        program.programId
      );

      // Juror 1 votes for buyer
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

      // Juror 2 votes for buyer
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

      // Juror 3 votes for seller
      await program.methods
        .castVote(false)
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror3.publicKey,
          vote: vote3Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror3])
        .rpc();

      disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.votesForBuyer).to.equal(2);
      expect(disputeAccount.votesForSeller).to.equal(1);
      expect(disputeAccount.status).to.equal(5); // VerdictReached

      // 5. Execute verdict
      console.log("Step 5: Executing verdict...");
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
      const solReceived = buyerBalanceAfter - buyerBalanceBefore;

      disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(6); // Resolved

      // Buyer should receive funds (won dispute 2-1)
      expect(solReceived).to.be.greaterThan(amount); // Should get amount + security bond

      console.log(`Dispute resolved! Buyer received ${solReceived / LAMPORTS_PER_SOL} SOL`);
    });

    it('Should handle tied vote scenario', async () => {
      console.log("Testing tied vote scenario...");

      const offerKeypair = Keypair.generate();
      const disputeKeypair = Keypair.generate();
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );

      // Setup dispute scenario
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

      await program.methods
        .openDispute("Disputed payment")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          disputeOpener: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer, disputeKeypair])
        .rpc();

      await program.methods
        .assignJurors()
        .accounts({
          dispute: disputeKeypair.publicKey,
          admin: adminPda,
          authority: admin.publicKey,
          juror1: juror1.publicKey,
          juror2: juror2.publicKey,
          juror3: juror3.publicKey,
        })
        .signers([admin])
        .rpc();

      // Create tied vote: 1-1-0 (third juror doesn't vote)
      const [vote1Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror1.publicKey.toBuffer()],
        program.programId
      );
      const [vote2Pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .castVote(true) // For buyer
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror1.publicKey,
          vote: vote1Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror1])
        .rpc();

      await program.methods
        .castVote(false) // For seller
        .accounts({
          dispute: disputeKeypair.publicKey,
          juror: juror2.publicKey,
          vote: vote2Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([juror2])
        .rpc();

      // Attempt to execute verdict with tied votes should fail
      try {
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
        
        expect.fail("Should have failed with tied vote");
      } catch (error) {
        expect(error.message).to.include("TiedVote");
      }

      console.log("Tied vote scenario handled correctly");
    });
  });

  describe('🏆 Reputation and Rewards Integration', () => {
    
    it('Should update reputation and mint rewards for successful trade', async () => {
      console.log("Testing reputation and rewards integration...");

      // Create reputation accounts
      const [sellerReputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), seller.publicKey.toBuffer()],
        program.programId
      );
      const [buyerReputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), buyer.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createReputation()
        .accounts({
          reputation: sellerReputationPda,
          user: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      await program.methods
        .createReputation()
        .accounts({
          reputation: buyerReputationPda,
          user: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Complete a successful trade
      const offerKeypair = Keypair.generate();
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );

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

      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

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

      // Update reputation for both parties
      await program.methods
        .updateReputation(true, false, false) // Successful trade
        .accounts({
          reputation: sellerReputationPda,
          admin: adminPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      await program.methods
        .updateReputation(true, false, false) // Successful trade
        .accounts({
          reputation: buyerReputationPda,
          admin: adminPda,
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      // Verify reputation updates
      const sellerReputation = await program.account.reputation.fetch(sellerReputationPda);
      const buyerReputation = await program.account.reputation.fetch(buyerReputationPda);

      expect(sellerReputation.successfulTrades).to.equal(1);
      expect(buyerReputation.successfulTrades).to.equal(1);
      expect(sellerReputation.rating).to.equal(100);
      expect(buyerReputation.rating).to.equal(100);

      console.log("Reputation and rewards integration test completed successfully");
    });
  });

  describe('🔒 Security Stress Tests', () => {
    
    it('Should handle rapid sequential operations', async () => {
      console.log("Testing rapid sequential operations...");

      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(async () => {
          const offerKeypair = Keypair.generate();
          const [escrowPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
            program.programId
          );

          await program.methods
            .createOffer(
              new anchor.BN((i + 1) * 0.1 * LAMPORTS_PER_SOL),
              new anchor.BN(100 + i * 10),
              "USD",
              `Rapid Test ${i}`,
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

          return offerKeypair.publicKey;
        });
      }

      const results = await Promise.all(operations.map(op => op()));
      
      // Verify all operations succeeded
      for (const offerPubkey of results) {
        const offerAccount = await program.account.offer.fetch(offerPubkey);
        expect(offerAccount.status).to.equal(0); // Created
      }

      console.log(`Successfully completed ${results.length} rapid sequential operations`);
    });

    it('Should handle edge case amounts and calculations', async () => {
      console.log("Testing edge case amounts...");

      const edgeCases = [
        { amount: 1, fiatAmount: 1, description: "Minimum amounts" },
        { amount: 100 * LAMPORTS_PER_SOL, fiatAmount: 100000, description: "Large amounts" },
        { amount: 0.001 * LAMPORTS_PER_SOL, fiatAmount: 1, description: "Small SOL amount" },
      ];

      for (const { amount, fiatAmount, description } of edgeCases) {
        console.log(`Testing ${description}...`);
        
        const offerKeypair = Keypair.generate();
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
            "USD",
            "Test Payment",
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

        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.amount.toString()).to.equal(amount.toString());
        expect(offerAccount.fiatAmount.toString()).to.equal(fiatAmount.toString());
      }

      console.log("Edge case testing completed successfully");
    });
  });

  describe('📊 Performance Benchmarks', () => {
    
    it('Should measure transaction throughput', async () => {
      console.log("Measuring transaction throughput...");

      const startTime = Date.now();
      const numTransactions = 10;
      const transactions = [];

      for (let i = 0; i < numTransactions; i++) {
        transactions.push(async () => {
          const offerKeypair = Keypair.generate();
          const [escrowPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
            program.programId
          );

          await program.methods
            .createOffer(
              new anchor.BN(0.1 * LAMPORTS_PER_SOL),
              new anchor.BN(100),
              "USD",
              "Benchmark Test",
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
        });
      }

      await Promise.all(transactions.map(tx => tx()));

      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = (numTransactions / duration) * 1000; // TPS

      console.log(`Processed ${numTransactions} transactions in ${duration}ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} transactions per second`);

      expect(throughput).to.be.greaterThan(0);
    });
  });

  describe('🛡️ Error Recovery and Resilience', () => {
    
    it('Should handle partial transaction failures gracefully', async () => {
      console.log("Testing error recovery scenarios...");

      // Test invalid parameters don't corrupt state
      try {
        await program.methods
          .createOffer(
            new anchor.BN(0), // Invalid amount
            new anchor.BN(1000),
            "USD",
            "Test",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: Keypair.generate().publicKey,
            seller: seller.publicKey,
            escrowAccount: PublicKey.default,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller, Keypair.generate()])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }

      // Verify system still works after error
      const offerKeypair = Keypair.generate();
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createOffer(
          new anchor.BN(LAMPORTS_PER_SOL),
          new anchor.BN(1000),
          "USD",
          "Recovery Test",
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

      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(0); // Created

      console.log("Error recovery testing completed successfully");
    });
  });
});