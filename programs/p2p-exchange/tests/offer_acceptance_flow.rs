use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use p2p_exchange::*;
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

#[tokio::test]
async fn test_offer_acceptance_flow() {
    // Initialize the program test environment
    let program_id = Pubkey::new_unique();
    let mut program_test = ProgramTest::new(
        "p2p_exchange",
        program_id,
        processor!(p2p_exchange::entry),
    );

    // Create test keypairs
    let seller = Keypair::new();
    let buyer = Keypair::new();
    let offer_keypair = Keypair::new();
    let escrow_keypair = Keypair::new();

    // Add accounts with initial balances
    program_test.add_account(
        seller.pubkey(),
        Account {
            lamports: 10_000_000_000, // 10 SOL
            owner: system_program::ID,
            ..Account::default()
        },
    );

    program_test.add_account(
        buyer.pubkey(),
        Account {
            lamports: 10_000_000_000, // 10 SOL
            owner: system_program::ID,
            ..Account::default()
        },
    );

    // Start the test environment
    let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

    // Test parameters
    let amount = 1_000_000_000; // 1 SOL
    let security_bond = 100_000_000; // 0.1 SOL
    let fiat_currency = "USD".to_string();
    let payment_method = "Bank Transfer".to_string();

    // Step 1: Create and list an offer
    let create_offer_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(offer_keypair.pubkey(), false),
            AccountMeta::new(seller.pubkey(), true),
            AccountMeta::new(escrow_keypair.pubkey(), false),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data: anchor_lang::InstructionData::data(
            &p2p_exchange::instruction::CreateAndListOffer {
                amount,
                security_bond,
                fiat_currency: fiat_currency.clone(),
                payment_method: payment_method.clone(),
            },
        ),
    };

    let mut transaction = Transaction::new_with_payer(
        &[create_offer_ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &seller, &offer_keypair], recent_blockhash);

    banks_client.process_transaction(transaction).await.unwrap();

    // Step 2: Accept the offer
    let accept_offer_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(offer_keypair.pubkey(), false),
            AccountMeta::new(buyer.pubkey(), true),
        ],
        data: anchor_lang::InstructionData::data(
            &p2p_exchange::instruction::AcceptOffer {},
        ),
    };

    let mut transaction = Transaction::new_with_payer(
        &[accept_offer_ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &buyer], recent_blockhash);

    banks_client.process_transaction(transaction).await.unwrap();

    // Step 3: Confirm fiat sent
    let confirm_fiat_sent_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(offer_keypair.pubkey(), false),
            AccountMeta::new(buyer.pubkey(), true),
        ],
        data: anchor_lang::InstructionData::data(
            &p2p_exchange::instruction::ConfirmFiatSent {},
        ),
    };

    let mut transaction = Transaction::new_with_payer(
        &[confirm_fiat_sent_ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &buyer], recent_blockhash);

    banks_client.process_transaction(transaction).await.unwrap();

    // Step 4: Confirm fiat receipt
    let confirm_fiat_receipt_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(offer_keypair.pubkey(), false),
            AccountMeta::new(seller.pubkey(), true),
        ],
        data: anchor_lang::InstructionData::data(
            &p2p_exchange::instruction::ConfirmFiatReceipt {},
        ),
    };

    let mut transaction = Transaction::new_with_payer(
        &[confirm_fiat_receipt_ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &seller], recent_blockhash);

    banks_client.process_transaction(transaction).await.unwrap();

    // Step 5: Release SOL
    let release_sol_ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(offer_keypair.pubkey(), false),
            AccountMeta::new(seller.pubkey(), true),
            AccountMeta::new(buyer.pubkey(), false),
            AccountMeta::new(escrow_keypair.pubkey(), false),
        ],
        data: anchor_lang::InstructionData::data(
            &p2p_exchange::instruction::ReleaseSol {},
        ),
    };

    let mut transaction = Transaction::new_with_payer(
        &[release_sol_ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer, &seller], recent_blockhash);

    banks_client.process_transaction(transaction).await.unwrap();

    // Verify final state (would need to fetch account data and assert on it)
    // This is a simplified test that just checks if transactions succeed
    println!("All transactions in the offer acceptance flow completed successfully!");
}
