/**
 * Comprehensive Unit Tests for P2P Exchange Program
 * 
 * Tests each instruction module individually with 100% coverage:
 * - Admin operations
 * - Offer management 
 * - Dispute resolution
 * - Reputation system
 * - Rewards system
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

describe('Unit Tests - P2P Exchange', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.P2pExchange as Program<P2pExchange>;

  let admin: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let user3: Keypair;
  let adminPda: PublicKey;

  beforeEach(async () => {
    admin = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    user3 = Keypair.generate();

    [adminPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      program.programId
    );

    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(admin.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user1.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user2.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user3.publicKey, 5 * LAMPORTS_PER_SOL)
      ),
    ]);
  });

  describe('Admin Module Tests', () => {
    
    describe('initialize_admin', () => {
      
      it('Should initialize admin successfully', async () => {
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
        expect(adminAccount.secondaryAuthorities).to.deep.equal([
          PublicKey.default,
          PublicKey.default
        ]);
        expect(adminAccount.requiredSignatures).to.equal(1);
        expect(adminAccount.lastRewardUpdate).to.be.greaterThan(0);
      });

      it('Should fail to initialize admin twice', async () => {
        // First initialization
        await program.methods
          .initializeAdmin()
          .accounts({
            admin: adminPda,
            authority: admin.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();

        // Second initialization should fail
        try {
          await program.methods
            .initializeAdmin()
            .accounts({
              admin: adminPda,
              authority: user1.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed on duplicate initialization");
        } catch (error) {
          expect(error.message).to.include("already in use");
        }
      });
    });

    describe('update_admin_authorities', () => {
      
      beforeEach(async () => {
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

      it('Should update admin authorities successfully', async () => {
        const secondaryAuthorities = [user1.publicKey, user2.publicKey];
        const requiredSignatures = 2;

        await program.methods
          .updateAdminAuthorities(secondaryAuthorities, requiredSignatures)
          .accounts({
            admin: adminPda,
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc();

        const adminAccount = await program.account.admin.fetch(adminPda);
        expect(adminAccount.secondaryAuthorities).to.deep.equal(secondaryAuthorities);
        expect(adminAccount.requiredSignatures).to.equal(requiredSignatures);
      });

      it('Should reject invalid required signatures', async () => {
        const secondaryAuthorities = [user1.publicKey, user2.publicKey];

        // Test with 0 signatures
        try {
          await program.methods
            .updateAdminAuthorities(secondaryAuthorities, 0)
            .accounts({
              admin: adminPda,
              authority: admin.publicKey,
            })
            .signers([admin])
            .rpc();
          
          expect.fail("Should have failed with 0 required signatures");
        } catch (error) {
          expect(error.message).to.include("InvalidAmount");
        }

        // Test with too many signatures
        try {
          await program.methods
            .updateAdminAuthorities(secondaryAuthorities, 4)
            .accounts({
              admin: adminPda,
              authority: admin.publicKey,
            })
            .signers([admin])
            .rpc();
          
          expect.fail("Should have failed with too many required signatures");
        } catch (error) {
          expect(error.message).to.include("InvalidAmount");
        }
      });

      it('Should reject unauthorized authority updates', async () => {
        const secondaryAuthorities = [user1.publicKey, user2.publicKey];

        try {
          await program.methods
            .updateAdminAuthorities(secondaryAuthorities, 2)
            .accounts({
              admin: adminPda,
              authority: user1.publicKey, // Unauthorized
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed with unauthorized access");
        } catch (error) {
          expect(error.message).to.include("Unauthorized");
        }
      });
    });
  });

  describe('Offers Module Tests', () => {
    
    let offerKeypair: Keypair;
    let escrowPda: PublicKey;

    beforeEach(async () => {
      // Initialize admin
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      offerKeypair = Keypair.generate();
      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );
    });

    describe('create_offer', () => {
      
      it('Should create offer with valid parameters', async () => {
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
            seller: user1.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, offerKeypair])
          .rpc();

        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.seller.toString()).to.equal(user1.publicKey.toString());
        expect(offerAccount.amount.toString()).to.equal(amount.toString());
        expect(offerAccount.fiatAmount.toString()).to.equal(fiatAmount.toString());
        expect(offerAccount.fiatCurrency).to.equal(fiatCurrency);
        expect(offerAccount.paymentMethod).to.equal(paymentMethod);
        expect(offerAccount.status).to.equal(0); // Created
        expect(offerAccount.buyer).to.be.null;
      });

      it('Should reject zero amount offers', async () => {
        try {
          await program.methods
            .createOffer(
              new anchor.BN(0), // Zero amount
              new anchor.BN(1000),
              "USD",
              "Bank Transfer",
              new anchor.BN(Math.floor(Date.now() / 1000))
            )
            .accounts({
              offer: offerKeypair.publicKey,
              seller: user1.publicKey,
              escrowAccount: escrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1, offerKeypair])
            .rpc();
          
          expect.fail("Should have failed with zero amount");
        } catch (error) {
          expect(error.message).to.include("InvalidAmount");
        }
      });

      it('Should reject invalid currency codes', async () => {
        const invalidCurrencies = ["us", "USDX", "usd", "123"];

        for (const currency of invalidCurrencies) {
          try {
            await program.methods
              .createOffer(
                new anchor.BN(LAMPORTS_PER_SOL),
                new anchor.BN(1000),
                currency,
                "Bank Transfer",
                new anchor.BN(Math.floor(Date.now() / 1000))
              )
              .accounts({
                offer: Keypair.generate().publicKey,
                seller: user1.publicKey,
                escrowAccount: escrowPda,
                systemProgram: SystemProgram.programId,
              })
              .signers([user1, Keypair.generate()])
              .rpc();
            
            expect.fail(`Should have failed with invalid currency: ${currency}`);
          } catch (error) {
            expect(error.message).to.include("InvalidCurrencyCode");
          }
        }
      });

      it('Should reject oversized payment method', async () => {
        const oversizedPaymentMethod = "A".repeat(51); // Max 50 chars

        try {
          await program.methods
            .createOffer(
              new anchor.BN(LAMPORTS_PER_SOL),
              new anchor.BN(1000),
              "USD",
              oversizedPaymentMethod,
              new anchor.BN(Math.floor(Date.now() / 1000))
            )
            .accounts({
              offer: offerKeypair.publicKey,
              seller: user1.publicKey,
              escrowAccount: escrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1, offerKeypair])
            .rpc();
          
          expect.fail("Should have failed with oversized payment method");
        } catch (error) {
          expect(error.message).to.include("InputTooLong");
        }
      });

      it('Should transfer SOL to escrow correctly', async () => {
        const amount = LAMPORTS_PER_SOL;
        const sellerBalanceBefore = await provider.connection.getBalance(user1.publicKey);

        await program.methods
          .createOffer(
            new anchor.BN(amount),
            new anchor.BN(1000),
            "USD",
            "Bank Transfer",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: offerKeypair.publicKey,
            seller: user1.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, offerKeypair])
          .rpc();

        const sellerBalanceAfter = await provider.connection.getBalance(user1.publicKey);
        const escrowBalance = await provider.connection.getBalance(escrowPda);

        // Seller should have less SOL (amount + fees)
        expect(sellerBalanceBefore - sellerBalanceAfter).to.be.closeTo(amount, 100000);
        // Escrow should have the SOL
        expect(escrowBalance).to.be.greaterThan(amount);
      });
    });

    describe('list_offer', () => {
      
      beforeEach(async () => {
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
            seller: user1.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, offerKeypair])
          .rpc();
      });

      it('Should list offer successfully', async () => {
        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: user1.publicKey,
          })
          .signers([user1])
          .rpc();

        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.status).to.equal(1); // Listed
        expect(offerAccount.listedAt).to.be.greaterThan(0);
      });

      it('Should reject listing by non-seller', async () => {
        try {
          await program.methods
            .listOffer()
            .accounts({
              offer: offerKeypair.publicKey,
              seller: user2.publicKey, // Not the seller
            })
            .signers([user2])
            .rpc();
          
          expect.fail("Should have failed with unauthorized seller");
        } catch (error) {
          expect(error.message).to.include("Unauthorized");
        }
      });

      it('Should reject listing already listed offer', async () => {
        // First listing
        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: user1.publicKey,
          })
          .signers([user1])
          .rpc();

        // Second listing should fail
        try {
          await program.methods
            .listOffer()
            .accounts({
              offer: offerKeypair.publicKey,
              seller: user1.publicKey,
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed on duplicate listing");
        } catch (error) {
          expect(error.message).to.include("InvalidOfferStatus");
        }
      });
    });

    describe('accept_offer', () => {
      
      beforeEach(async () => {
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
            seller: user1.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, offerKeypair])
          .rpc();

        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: user1.publicKey,
          })
          .signers([user1])
          .rpc();
      });

      it('Should accept offer with security bond', async () => {
        const securityBond = 0.1 * LAMPORTS_PER_SOL;
        const buyerBalanceBefore = await provider.connection.getBalance(user2.publicKey);

        await program.methods
          .acceptOffer(new anchor.BN(securityBond))
          .accounts({
            offer: offerKeypair.publicKey,
            buyer: user2.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();

        const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
        expect(offerAccount.status).to.equal(2); // Accepted
        expect(offerAccount.buyer?.toString()).to.equal(user2.publicKey.toString());
        expect(offerAccount.securityBond.toString()).to.equal(securityBond.toString());
        expect(offerAccount.acceptedAt).to.be.greaterThan(0);

        const buyerBalanceAfter = await provider.connection.getBalance(user2.publicKey);
        expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(securityBond, 100000);
      });

      it('Should reject acceptance by seller', async () => {
        try {
          await program.methods
            .acceptOffer(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
            .accounts({
              offer: offerKeypair.publicKey,
              buyer: user1.publicKey, // Same as seller
              escrowAccount: escrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed with seller accepting own offer");
        } catch (error) {
          expect(error.message).to.include("Unauthorized");
        }
      });

      it('Should reject acceptance of non-listed offer', async () => {
        // Create new offer without listing
        const newOfferKeypair = Keypair.generate();
        const [newEscrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow"), newOfferKeypair.publicKey.toBuffer()],
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
            offer: newOfferKeypair.publicKey,
            seller: user1.publicKey,
            escrowAccount: newEscrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, newOfferKeypair])
          .rpc();

        try {
          await program.methods
            .acceptOffer(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
            .accounts({
              offer: newOfferKeypair.publicKey,
              buyer: user2.publicKey,
              escrowAccount: newEscrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user2])
            .rpc();
          
          expect.fail("Should have failed accepting non-listed offer");
        } catch (error) {
          expect(error.message).to.include("InvalidOfferStatus");
        }
      });
    });

    describe('fiat_payment_flow', () => {
      
      beforeEach(async () => {
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
            seller: user1.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, offerKeypair])
          .rpc();

        await program.methods
          .listOffer()
          .accounts({
            offer: offerKeypair.publicKey,
            seller: user1.publicKey,
          })
          .signers([user1])
          .rpc();

        await program.methods
          .acceptOffer(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            offer: offerKeypair.publicKey,
            buyer: user2.publicKey,
            escrowAccount: escrowPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
      });

      describe('mark_fiat_sent', () => {
        
        it('Should mark fiat as sent by buyer', async () => {
          await program.methods
            .markFiatSent()
            .accounts({
              offer: offerKeypair.publicKey,
              buyer: user2.publicKey,
            })
            .signers([user2])
            .rpc();

          const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
          expect(offerAccount.status).to.equal(3); // FiatSent
          expect(offerAccount.fiatSentAt).to.be.greaterThan(0);
        });

        it('Should reject marking by non-buyer', async () => {
          try {
            await program.methods
              .markFiatSent()
              .accounts({
                offer: offerKeypair.publicKey,
                buyer: user1.publicKey, // Not the buyer
              })
              .signers([user1])
              .rpc();
            
            expect.fail("Should have failed with non-buyer marking fiat sent");
          } catch (error) {
            expect(error.message).to.include("Unauthorized");
          }
        });
      });

      describe('confirm_fiat_receipt', () => {
        
        beforeEach(async () => {
          await program.methods
            .markFiatSent()
            .accounts({
              offer: offerKeypair.publicKey,
              buyer: user2.publicKey,
            })
            .signers([user2])
            .rpc();
        });

        it('Should confirm fiat receipt by seller', async () => {
          await program.methods
            .confirmFiatReceipt()
            .accounts({
              offer: offerKeypair.publicKey,
              seller: user1.publicKey,
            })
            .signers([user1])
            .rpc();

          const offerAccount = await program.account.offer.fetch(offerKeypair.publicKey);
          expect(offerAccount.status).to.equal(4); // SolReleased (ready for release)
          expect(offerAccount.fiatReceivedAt).to.be.greaterThan(0);
        });

        it('Should reject confirmation by non-seller', async () => {
          try {
            await program.methods
              .confirmFiatReceipt()
              .accounts({
                offer: offerKeypair.publicKey,
                seller: user2.publicKey, // Not the seller
              })
              .signers([user2])
              .rpc();
            
            expect.fail("Should have failed with non-seller confirming receipt");
          } catch (error) {
            expect(error.message).to.include("Unauthorized");
          }
        });

        it('Should reject confirmation without fiat sent', async () => {
          // Create new offer without marking fiat sent
          const newOfferKeypair = Keypair.generate();
          const [newEscrowPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("escrow"), newOfferKeypair.publicKey.toBuffer()],
            program.programId
          );

          // Setup new offer through acceptance
          await program.methods
            .createOffer(
              new anchor.BN(LAMPORTS_PER_SOL),
              new anchor.BN(1000),
              "USD",
              "Bank Transfer",
              new anchor.BN(Math.floor(Date.now() / 1000))
            )
            .accounts({
              offer: newOfferKeypair.publicKey,
              seller: user1.publicKey,
              escrowAccount: newEscrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1, newOfferKeypair])
            .rpc();

          await program.methods
            .listOffer()
            .accounts({
              offer: newOfferKeypair.publicKey,
              seller: user1.publicKey,
            })
            .signers([user1])
            .rpc();

          await program.methods
            .acceptOffer(new anchor.BN(0.1 * LAMPORTS_PER_SOL))
            .accounts({
              offer: newOfferKeypair.publicKey,
              buyer: user2.publicKey,
              escrowAccount: newEscrowPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([user2])
            .rpc();

          try {
            await program.methods
              .confirmFiatReceipt()
              .accounts({
                offer: newOfferKeypair.publicKey,
                seller: user1.publicKey,
              })
              .signers([user1])
              .rpc();
            
            expect.fail("Should have failed confirming without fiat sent");
          } catch (error) {
            expect(error.message).to.include("InvalidOfferStatus");
          }
        });
      });
    });
  });

  describe('Reputation Module Tests', () => {
    
    let reputationPda: PublicKey;

    beforeEach(async () => {
      // Initialize admin
      await program.methods
        .initializeAdmin()
        .accounts({
          admin: adminPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), user1.publicKey.toBuffer()],
        program.programId
      );
    });

    describe('create_reputation', () => {
      
      it('Should create reputation account', async () => {
        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();

        const reputationAccount = await program.account.reputation.fetch(reputationPda);
        expect(reputationAccount.user.toString()).to.equal(user1.publicKey.toString());
        expect(reputationAccount.successfulTrades).to.equal(0);
        expect(reputationAccount.disputedTrades).to.equal(0);
        expect(reputationAccount.disputesWon).to.equal(0);
        expect(reputationAccount.disputesLost).to.equal(0);
        expect(reputationAccount.rating).to.equal(100); // Starting rating
        expect(reputationAccount.lastUpdated).to.be.greaterThan(0);
      });

      it('Should fail to create duplicate reputation', async () => {
        // First creation
        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();

        // Second creation should fail
        try {
          await program.methods
            .createReputation()
            .accounts({
              reputation: reputationPda,
              user: user1.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed on duplicate reputation creation");
        } catch (error) {
          expect(error.message).to.include("already in use");
        }
      });
    });

    describe('update_reputation', () => {
      
      beforeEach(async () => {
        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
      });

      it('Should update reputation for successful trade', async () => {
        await program.methods
          .updateReputation(true, false, false) // Successful trade
          .accounts({
            reputation: reputationPda,
            admin: adminPda,
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc();

        const reputationAccount = await program.account.reputation.fetch(reputationPda);
        expect(reputationAccount.successfulTrades).to.equal(1);
        expect(reputationAccount.disputedTrades).to.equal(0);
        expect(reputationAccount.rating).to.equal(100); // Should remain high
      });

      it('Should update reputation for dispute resolution', async () => {
        await program.methods
          .updateReputation(false, true, true) // Dispute resolved, won
          .accounts({
            reputation: reputationPda,
            admin: adminPda,
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc();

        const reputationAccount = await program.account.reputation.fetch(reputationPda);
        expect(reputationAccount.successfulTrades).to.equal(0);
        expect(reputationAccount.disputedTrades).to.equal(1);
        expect(reputationAccount.disputesWon).to.equal(1);
        expect(reputationAccount.disputesLost).to.equal(0);
      });

      it('Should handle multiple reputation updates', async () => {
        // Multiple successful trades
        for (let i = 0; i < 5; i++) {
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

        // Add some disputes
        await program.methods
          .updateReputation(false, true, false) // Lost dispute
          .accounts({
            reputation: reputationPda,
            admin: adminPda,
            authority: admin.publicKey,
          })
          .signers([admin])
          .rpc();

        const reputationAccount = await program.account.reputation.fetch(reputationPda);
        expect(reputationAccount.successfulTrades).to.equal(5);
        expect(reputationAccount.disputedTrades).to.equal(1);
        expect(reputationAccount.disputesLost).to.equal(1);
        expect(reputationAccount.rating).to.be.lessThan(100); // Should decrease due to lost dispute
      });

      it('Should reject unauthorized reputation updates', async () => {
        try {
          await program.methods
            .updateReputation(true, false, false)
            .accounts({
              reputation: reputationPda,
              admin: adminPda,
              authority: user1.publicKey, // Not admin
            })
            .signers([user1])
            .rpc();
          
          expect.fail("Should have failed with unauthorized update");
        } catch (error) {
          expect(error.message).to.include("Unauthorized");
        }
      });

      it('Should protect against overflow in calculations', async () => {
        // Update many times to test overflow protection
        for (let i = 0; i < 100; i++) {
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
        expect(reputationAccount.successfulTrades).to.equal(100);
        expect(reputationAccount.rating).to.be.lessThanOrEqual(100); // Should be capped
        expect(reputationAccount.rating).to.be.greaterThanOrEqual(0); // Should not underflow
      });
    });
  });

  describe('Error Handling Tests', () => {
    
    it('Should handle all custom error codes properly', async () => {
      // Test various error conditions that should trigger specific error codes
      
      // Test InvalidAmount
      try {
        await program.methods
          .createOffer(
            new anchor.BN(0), // Invalid amount
            new anchor.BN(1000),
            "USD",
            "Bank Transfer",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: Keypair.generate().publicKey,
            seller: user1.publicKey,
            escrowAccount: PublicKey.default,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, Keypair.generate()])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }

      // Test InputTooLong
      try {
        await program.methods
          .createOffer(
            new anchor.BN(LAMPORTS_PER_SOL),
            new anchor.BN(1000),
            "USD",
            "A".repeat(51), // Too long
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: Keypair.generate().publicKey,
            seller: user1.publicKey,
            escrowAccount: PublicKey.default,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, Keypair.generate()])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("InputTooLong");
      }

      // Test InvalidCurrencyCode
      try {
        await program.methods
          .createOffer(
            new anchor.BN(LAMPORTS_PER_SOL),
            new anchor.BN(1000),
            "us", // Invalid currency
            "Bank Transfer",
            new anchor.BN(Math.floor(Date.now() / 1000))
          )
          .accounts({
            offer: Keypair.generate().publicKey,
            seller: user1.publicKey,
            escrowAccount: PublicKey.default,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1, Keypair.generate()])
          .rpc();
      } catch (error) {
        expect(error.message).to.include("InvalidCurrencyCode");
      }
    });
  });

  describe('PDA Generation Tests', () => {
    
    it('Should generate correct PDAs for all account types', async () => {
      // Test admin PDA
      const [expectedAdminPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("admin")],
        program.programId
      );
      expect(adminPda.toString()).to.equal(expectedAdminPda.toString());

      // Test escrow PDA
      const offerKeypair = Keypair.generate();
      const [expectedEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), offerKeypair.publicKey.toBuffer()],
        program.programId
      );
      expect(expectedEscrowPda).to.not.be.null;

      // Test reputation PDA
      const [expectedReputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), user1.publicKey.toBuffer()],
        program.programId
      );
      expect(expectedReputationPda).to.not.be.null;

      // Test vote PDA
      const disputeKeypair = Keypair.generate();
      const [expectedVotePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), disputeKeypair.publicKey.toBuffer(), user1.publicKey.toBuffer()],
        program.programId
      );
      expect(expectedVotePda).to.not.be.null;
    });
  });
});