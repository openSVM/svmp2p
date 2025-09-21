#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;
use p2p_exchange_fuzz::{FuzzCreateOfferData, is_valid_currency_code, is_valid_utf8_string};

/// Fuzz target for offer creation validation logic
/// 
/// This fuzzer tests the input validation and processing logic used in create_offer
/// to ensure it handles all edge cases and malformed inputs gracefully.
fuzz_target!(|data: FuzzCreateOfferData| {
    // Test currency code validation
    let currency = &data.fiat_currency.value;
    let is_valid_currency = is_valid_currency_code(currency);
    
    // Test payment method validation
    let payment_method = &data.payment_method.value;
    let is_valid_utf8_payment = is_valid_utf8_string(payment_method);
    
    // Test amount validation
    let has_valid_amount = data.amount > 0;
    let has_valid_fiat_amount = data.fiat_amount > 0;
    
    // Test string length constraints
    let currency_length_ok = currency.len() <= 10; // MAX_FIAT_CURRENCY_LEN
    let payment_method_length_ok = payment_method.len() <= 50; // MAX_PAYMENT_METHOD_LEN
    
    // Test timestamp validation
    let has_reasonable_timestamp = data.created_at > 0 && data.created_at < i64::MAX / 2;
    
    // Test for potential overflow conditions
    let no_amount_overflow = data.amount.checked_mul(data.fiat_amount).is_some();
    
    // Log interesting cases for corpus building
    if !is_valid_currency && !currency.is_empty() {
        // Found an invalid currency format
    }
    
    if !is_valid_utf8_payment && !payment_method.is_empty() {
        // Found invalid UTF-8 in payment method
    }
    
    if !currency_length_ok || !payment_method_length_ok {
        // Found length violations
    }
    
    if data.amount == 0 || data.fiat_amount == 0 {
        // Found zero amounts
    }
    
    if !no_amount_overflow {
        // Found potential overflow condition
    }
    
    // Simulate the validation logic that would be in the smart contract
    if has_valid_amount 
        && has_valid_fiat_amount 
        && is_valid_currency
        && is_valid_utf8_payment
        && currency_length_ok
        && payment_method_length_ok
        && has_reasonable_timestamp
        && no_amount_overflow {
        // This would be considered a valid offer creation request
    } else {
        // This should be rejected by the contract's validation logic
        // The fuzzer helps us find edge cases in validation
    }
});
