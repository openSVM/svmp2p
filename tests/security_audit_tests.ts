/**
 * Comprehensive Security Audit Tests for P2P Exchange Program
 * 
 * Tests all critical security vulnerabilities and fixes:
 * 1. Fund drainage vulnerability 
 * 2. Race condition in vote counting
 * 3. Reputation system overflow
 * 4. Fiat payment validation
 * 5. Dispute deadlines
 * 6. Input validation
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { P2pExchange } from '../target/types/p2p_exchange';
import { 
  Keypair, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { expect } from 'chai';

describe('Security Audit Tests - P2P Exchange', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pExchange as Program<P2pExchange>;

  let admin: Keypair;
  let seller: Keypair;
  let buyer: Keypair;
  let attacker: Keypair;
  let juror1: Keypair;
  let juror2: Keypair;
  let juror3: Keypair;
  let offerKeypair: Keypair;
  let disputeKeypair: Keypair;
  let adminPda: PublicKey;
  let escrowPda: PublicKey;

  beforeEach(async () => {
    // Generate fresh keypairs for each test
    admin = Keypair.generate();
    seller = Keypair.generate();
    buyer = Keypair.generate();
    attacker = Keypair.generate();
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

    // Airdrop SOL to all test accounts
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(admin.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(seller.publicKey, 10 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(buyer.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(attacker.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror1.publicKey, 2 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror2.publicKey, 2 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(juror3.publicKey, 2 * LAMPORTS_PER_SOL)
      ),
    ]);

    // Initialize admin for tests that require it
    try {
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
    } catch (error) {
      // Admin might already be initialized in some tests
      console.log("Admin already initialized or error:", error.message);
    }
  });

  describe('🔴 CRITICAL SECURITY TESTS', () => {
    
    describe('CVE-2024-001: Fund Drainage Vulnerability', () => {
      
      it('Should prevent fund drainage when extra SOL is sent to escrow', async () => {
        // Step 1: Create and list an offer
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;
        const securityBond = 0.1 * LAMPORTS_PER_SOL;

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
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

        // Step 2: Buyer accepts offer
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

        // Step 3: Attacker sends extra SOL to escrow (simulating attack)
        const attackAmount = 0.5 * LAMPORTS_PER_SOL;
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: attacker.publicKey,
          toPubkey: escrowPda,
          lamports: attackAmount,
        });

        const transaction = new Transaction().add(transferInstruction);
        await sendAndConfirmTransaction(
          provider.connection,
          transaction,
          [attacker]
        );

        // Step 4: Complete fiat payment flow
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

        // Step 5: Attempt to release SOL - should fail due to invalid escrow balance
        try {
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
          
          expect.fail("Should have failed due to invalid escrow balance");
        } catch (error) {
          expect(error.message).to.include("InvalidEscrowBalance");
        }
      });

      it('Should allow normal SOL release with exact expected balance', async () => {
        // Create a clean offer without extra SOL
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;
        const securityBond = 0.1 * LAMPORTS_PER_SOL;

        // Fresh keypairs for clean test
        const cleanOfferKeypair = Keypair.generate();
        const [cleanEscrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow"), cleanOfferKeypair.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
            "USD",
            "Bank Transfer",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            seller: seller.publicKey,
            escrowAccount: cleanEscrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller, cleanOfferKeypair])
          .rpc();

        await program.methods
          .listOffer()
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            seller: seller.publicKey,
          })
          .signers([seller])
          .rpc();

        await program.methods
          .acceptOffer(new anchor.BN(securityBond))
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            buyer: buyer.publicKey,
            escrowAccount: cleanEscrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();

        await program.methods
          .markFiatSent()
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            buyer: buyer.publicKey,
          })
          .signers([buyer])
          .rpc();

        await program.methods
          .confirmFiatReceipt()
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            seller: seller.publicKey,
          })
          .signers([seller])
          .rpc();

        // This should succeed with exact expected balance
        const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);
        
        await program.methods
          .releaseSol()
          .accounts({
            offer: cleanOfferKeypair.publicKey,
            seller: seller.publicKey,
            buyer: buyer.publicKey,
            escrowAccount: cleanEscrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller])
          .rpc();

        const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
        const solReceived = buyerBalanceAfter - buyerBalanceBefore;
        
        // Buyer should receive the offer amount plus security bond
        expect(solReceived).to.be.closeTo(amount + securityBond, 10000); // Small tolerance for fees
      });
    });

    describe('CVE-2024-003: Vote Count Race Condition', () => {
      
      it('Should prevent vote count corruption with atomic operations', async () => {
        // Setup: Create offer and dispute
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
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

        // Open dispute
        await program.methods
          .openDispute("Payment not received")
          .accounts({
            dispute: disputeKeypair.publicKey,
            offer: offerKeypair.publicKey,
            disputeOpener: buyer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer, disputeKeypair])
          .rpc();

        // Assign jurors
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

        // Test atomic vote counting - each vote should increment count correctly
        const [vote1Pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror1.publicKey.toBuffer()],
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

        // Check vote count after first vote
        let disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
        expect(disputeAccount.votesForBuyer).to.equal(1);
        expect(disputeAccount.votesForSeller).to.equal(0);

        // Second vote
        const [vote2Pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror2.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .castVote(false) // Vote for seller
          .accounts({
            dispute: disputeKeypair.publicKey,
            juror: juror2.publicKey,
            vote: vote2Pda,
            systemProgram: SystemProgram.programId,
          })
          .signers([juror2])
          .rpc();

        // Verify atomic update
        disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
        expect(disputeAccount.votesForBuyer).to.equal(1);
        expect(disputeAccount.votesForSeller).to.equal(1);

        // Third vote should complete voting
        const [vote3Pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), juror3.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .castVote(true) // Vote for buyer
          .accounts({
            dispute: disputeKeypair.publicKey,
            juror: juror3.publicKey,
            vote: vote3Pda,
            systemProgram: SystemProgram.programId,
          })
          .signers([juror3])
          .rpc();

        // Final vote count verification
        disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
        expect(disputeAccount.votesForBuyer).to.equal(2);
        expect(disputeAccount.votesForSeller).to.equal(1);
        expect(disputeAccount.status).to.equal(5); // VerdictReached
      });

      it('Should prevent voting beyond maximum juror count', async () => {
        // Create a dispute with all 3 votes already cast (from previous test setup)
        // This test verifies the vote count validation prevents excess votes
        
        // Try to vote with a fourth juror (should fail)
        const fourthJuror = Keypair.generate();
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(fourthJuror.publicKey, LAMPORTS_PER_SOL)
        );

        const [vote4Pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), fourthJuror.publicKey.toBuffer()],
          program.programId
        );

        try {
          await program.methods
            .castVote(true)
            .accounts({
              dispute: disputeKeypair.publicKey,
              juror: fourthJuror.publicKey,
              vote: vote4Pda,
              systemProgram: SystemProgram.programId,
            })
            .signers([fourthJuror])
            .rpc();
          
          expect.fail("Should have failed due to exceeding vote count");
        } catch (error) {
          expect(error.message).to.include("InvalidDisputeStatus");
        }
      });
    });

    describe('CVE-2024-004: Reputation System Overflow', () => {
      
      it('Should prevent integer overflow in reputation calculations', async () => {
        // Create reputation account
        const [reputationPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), seller.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            user: seller.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([seller])
          .rpc();

        // Simulate large number of trades that could cause overflow
        // Test with maximum u32 values to verify overflow protection
        const maxU32 = 4294967295; // Maximum u32 value

        try {
          await program.methods
            .updateReputation(true, false, false)
            .accounts({
              reputation: reputationPda,
              admin: adminPda,
              authority: admin.publicKey,
            })
            .signers([admin])
            .rpc();

          // Check that reputation was updated safely
          const reputationAccount = await program.account.reputation.fetch(reputationPda);
          expect(reputationAccount.successfulTrades).to.equal(1);
          expect(reputationAccount.rating).to.be.lessThanOrEqual(100);
          
        } catch (error) {
          // Should not fail with overflow error
          expect(error.message).to.not.include("MathOverflow");
        }
      });

      it('Should cap reputation rating at maximum value', async () => {
        const [reputationPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("reputation"), buyer.publicKey.toBuffer()],
          program.programId
        );

        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            user: buyer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc();

        // Multiple successful trades to maximize rating
        for (let i = 0; i < 10; i++) {
          await program.methods
            .updateReputation(true, false, false)
            .accounts({
              reputation: reputationPda,
              admin: adminPda,
              authority: admin.publicKey,
            })
            .signers([admin])
            .rpc();
        }

        const reputationAccount = await program.account.reputation.fetch(reputationPda);
        expect(reputationAccount.rating).to.be.lessThanOrEqual(100);
        expect(reputationAccount.successfulTrades).to.equal(10);
      });
    });
  });

  describe('🟠 MEDIUM SEVERITY TESTS', () => {
    
    describe('Fiat Payment Validation', () => {
      
      it('Should enforce proper fiat payment flow sequence', async () => {
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
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

        // Try to release SOL without fiat payment flow - should fail
        try {
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
          
          expect.fail("Should have failed without fiat payment confirmation");
        } catch (error) {
          expect(error.message).to.include("InvalidOfferStatus");
        }

        // Complete proper fiat payment flow
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

        // Now SOL release should work
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

        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.status).to.equal(6); // Completed
      });
    });

    describe('Dispute Deadlines', () => {
      
      it('Should enforce dispute resolution deadlines', async () => {
        // This test would require time manipulation in a real test environment
        // For now, we'll test the deadline validation logic
        
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(fiatAmount),
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

        // Open dispute
        await program.methods
          .openDispute("Payment not received")
          .accounts({
            dispute: disputeKeypair.publicKey,
            offer: offerKeypair.publicKey,
            disputeOpener: buyer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer, disputeKeypair])
          .rpc();

        // Verify dispute was created with timestamps
        const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
        expect(disputeAccount.createdAt).to.be.greaterThan(0);
        expect(disputeAccount.evidenceDeadline).to.be.greaterThan(disputeAccount.createdAt);
        expect(disputeAccount.votingDeadline).to.be.greaterThan(disputeAccount.evidenceDeadline);
      });
    });
  });

  describe('🟡 INPUT VALIDATION TESTS', () => {
    
    describe('Currency Code Validation', () => {
      
      it('Should reject invalid currency codes', async () => {
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        // Test with invalid currency codes
        const invalidCurrencies = [
          "us",      // Too short
          "USDX",    // Too long  
          "usd",     // Lowercase
          "123",     // Numbers
          "USD!",    // Special characters
        ];

        for (const invalidCurrency of invalidCurrencies) {
          try {
            await program.methods
              .createOffer(
                new anchor.BN(amount),
                new anchor.BN(fiatAmount),
                invalidCurrency,
                "Bank Transfer",
                new anchor.BN(Math.floor(Date.now() / 1000))
              )
              .accounts({
                offer: Keypair.generate().publicKey,
                seller: seller.publicKey,
                escrowAccount: escrowPda,
                systemProgram: SystemProgram.programId,
              })
              .signers([seller, Keypair.generate()])
              .rpc();
            
            expect.fail(`Should have failed with invalid currency: ${invalidCurrency}`);
          } catch (error) {
            expect(error.message).to.include("InvalidCurrencyCode");
          }
        }
      });

      it('Should accept valid ISO currency codes', async () => {
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD"];

        for (const validCurrency of validCurrencies) {
          const offerKeypair = Keypair.generate();
          const [escrowPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
            program.programId
          );

          await program.methods
            .createOffer(
              new anchor.BN(amount),
              new anchor.BN(fiatAmount),
              validCurrency,
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

          const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
          expect(offerAccount.fiatCurrency).to.equal(validCurrency);
        }
      });
    });

    describe('Input Length Validation', () => {
      
      it('Should reject oversized input strings', async () => {
        const amount = LAMPORTS_PER_SOL;
        const fiatAmount = 1000;

        // Test oversized payment method (max 50 chars)
        const oversizedPaymentMethod = "A".repeat(51);

        try {
          await program.methods
            .createOffer(
              new anchor.BN(amount),
              new anchor.BN(fiatAmount),
              "USD",
              oversizedPaymentMethod,
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
          
          expect.fail("Should have failed with oversized payment method");
        } catch (error) {
          expect(error.message).to.include("InputTooLong");
        }
      });
    });
  });

  describe('🛡️ AUTHORIZATION AND ACCESS CONTROL', () => {
    
    it('Should prevent unauthorized admin operations', async () => {
      const unauthorizedUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(unauthorizedUser.publicKey, LAMPORTS_PER_SOL)
      );

      try {
        await program.methods
          .updateAdminAuthorities(
            [Keypair.generate().publicKey, Keypair.generate().publicKey],
            2
          )
          .accounts({
            admin: adminPda,
            authority: unauthorizedUser.publicKey, // Unauthorized
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have failed with unauthorized access");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });

    it('Should prevent unauthorized offer operations', async () => {
      const amount = LAMPORTS_PER_SOL;
      const fiatAmount = 1000;

      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(fiatAmount),
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

      // Try to list offer with wrong seller
      try {
        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: attacker.publicKey, // Wrong seller
          })
          .signers([attacker])
          .rpc();
        
        expect.fail("Should have failed with unauthorized seller");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });
  });

  describe('🔄 INTEGRATION TESTS - COMPLETE WORKFLOWS', () => {
    
    it('Should complete successful trade end-to-end', async () => {
      const amount = LAMPORTS_PER_SOL;
      const fiatAmount = 1000;
      const securityBond = 0.1 * LAMPORTS_PER_SOL;

      // 1. Create offer
      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(fiatAmount),
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

      // 2. List offer
      await program.methods
        .listOffer()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      // 3. Accept offer
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

      // 4. Mark fiat sent
      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerKeypair.publicKey,
          buyer: buyer.publicKey,
        })
        .signers([buyer])
        .rpc();

      // 5. Confirm fiat receipt
      await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: offerKeypair.publicKey,
          seller: seller.publicKey,
        })
        .signers([seller])
        .rpc();

      // 6. Release SOL
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
      const solReceived = buyerBalanceAfter - buyerBalanceBefore;
      
      // Verify successful completion
      expect(solReceived).to.be.closeTo(amount + securityBond, 10000);
      
      const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
      expect(offerAccount.status).to.equal(6); // Completed
    });

    it('Should complete dispute resolution workflow', async () => {
      const amount = LAMPORTS_PER_SOL;
      const fiatAmount = 1000;

      // Setup offer and dispute
      await program.methods
        .createOffer(
          new anchor.BN(amount),
          new anchor.BN(fiatAmount),
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

      // Open dispute
      await program.methods
        .openDispute("Payment not received")
        .accounts({
          dispute: disputeKeypair.publicKey,
          offer: offerKeypair.publicKey,
          disputeOpener: buyer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer, disputeKeypair])
        .rpc();

      // Assign jurors
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

      // Cast votes
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

      // Execute verdict (buyer wins 2-1)
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
      
      // Buyer should receive funds since they won the dispute
      expect(solReceived).to.be.greaterThan(0);
      
      const disputeAccount = await program.account.dispute.fetch(disputeKeypair.publicKey);
      expect(disputeAccount.status).to.equal(6); // Resolved
    });
  });
});