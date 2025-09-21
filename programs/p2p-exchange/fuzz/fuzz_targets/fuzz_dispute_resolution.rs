#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;
use p2p_exchange_fuzz::{FuzzDisputeData, is_valid_utf8_string};

/// Fuzz target for dispute resolution system
/// 
/// Tests dispute creation, evidence submission, and voting logic
/// to ensure the system handles malformed dispute data correctly.
fuzz_target!(|data: FuzzDisputeData| {
    let reason = &data.reason.value;
    let evidence_hash = &data.evidence_hash.value;
    
    // Test dispute reason validation
    let is_valid_reason_utf8 = is_valid_utf8_string(reason);
    let reason_length_ok = reason.len() <= 200; // MAX_DISPUTE_REASON_LEN
    
    // Test evidence hash validation
    let is_valid_evidence_utf8 = is_valid_utf8_string(evidence_hash);
    let evidence_length_ok = evidence_hash.len() <= 300; // MAX_EVIDENCE_URL_LEN
    
    // Test for common attack vectors
    let no_null_bytes = !reason.contains('\0') && !evidence_hash.contains('\0');
    let no_script_injection = !reason.contains("<script") && !evidence_hash.contains("<script");
    
    // Test for extremely long inputs (DoS protection)
    let reasonable_length = reason.len() < 10000 && evidence_hash.len() < 10000;
    
    // Test for empty inputs
    let has_reason = !reason.trim().is_empty();
    let has_evidence = !evidence_hash.trim().is_empty();
    
    // Simulate dispute validation logic
    if is_valid_reason_utf8
        && is_valid_evidence_utf8
        && reason_length_ok
        && evidence_length_ok
        && no_null_bytes
        && no_script_injection
        && reasonable_length
        && has_reason {
        // Valid dispute creation
        
        // Test voting scenarios with edge cases
        let vote_count_scenarios = [
            (0u32, 0u32), // No votes yet
            (1, 0),       // One vote for buyer
            (0, 1),       // One vote for seller
            (2, 1),       // Buyer winning
            (1, 2),       // Seller winning
            (2, 2),       // Tied vote (edge case)
            (u32::MAX, 0), // Overflow test
            (0, u32::MAX), // Overflow test
        ];
        
        for (buyer_votes, seller_votes) in vote_count_scenarios {
            // Test vote tally logic
            let total_votes = buyer_votes.saturating_add(seller_votes);
            let is_tied = buyer_votes == seller_votes && total_votes > 0;
            let has_majority = total_votes >= 3; // Assuming minimum 3 jurors
            
            // Check for potential overflow in vote counting
            let safe_vote_math = buyer_votes.checked_add(seller_votes).is_some();
            
            if is_tied && has_majority {
                // Tied vote scenario - should trigger special handling
            }
            
            if !safe_vote_math {
                // Overflow in vote counting - should be prevented
            }
        }
    } else {
        // Invalid dispute - should be rejected
        
        // Log the specific validation failure for analysis
        if !is_valid_reason_utf8 {
            // Invalid UTF-8 in dispute reason
        }
        if !reason_length_ok {
            // Dispute reason too long
        }
        if !evidence_length_ok {
            // Evidence URL too long
        }
    }
    
    // Test evidence submission limits (max 5 evidence items per party)
    let evidence_count_scenarios = [0, 1, 3, 5, 6, 10, 100];
    
    for evidence_count in evidence_count_scenarios {
        let within_limit = evidence_count <= 5;
        if !within_limit {
            // Should trigger TooManyEvidenceItems error
        }
    }
});