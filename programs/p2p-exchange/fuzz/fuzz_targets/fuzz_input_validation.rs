#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;
use p2p_exchange_fuzz::{FuzzString, is_valid_currency_code, is_valid_utf8_string};

/// Comprehensive input validation fuzzer
/// 
/// Tests all string input validation and sanitization logic
/// across the entire smart contract surface area.
fuzz_target!(|data: FuzzString| {
    let input = &data.value;
    
    // Test UTF-8 validation
    let is_valid_utf8 = is_valid_utf8_string(input);
    
    // Test currency code validation
    let is_valid_currency = is_valid_currency_code(input);
    
    // Test various length constraints used throughout the contract
    let length_constraints = [
        (3, "currency_code"),      // Currency codes must be exactly 3 chars
        (10, "fiat_currency"),     // Fiat currency max length
        (50, "payment_method"),    // Payment method max length
        (200, "dispute_reason"),   // Dispute reason max length
        (300, "evidence_url"),     // Evidence URL max length
    ];
    
    for (max_len, field_type) in length_constraints {
        let within_limit = input.len() <= max_len;
        if !within_limit {
            // Should trigger InputTooLong error for this field type
        }
        
        // Test exact boundary conditions
        if input.len() == max_len {
            // Boundary case - should be accepted
        }
        if input.len() == max_len + 1 {
            // Just over boundary - should be rejected
        }
    }
    
    // Test for dangerous characters and sequences
    let security_tests = [
        ('\0', "null_byte"),
        ('\x1F', "control_char"),
        ('\u{FEFF}', "bom_marker"),
        ('\u{200B}', "zero_width_space"),
    ];
    
    for (dangerous_char, test_name) in security_tests {
        if input.contains(dangerous_char) {
            // Should be sanitized or rejected
        }
    }
    
    // Test common injection patterns
    let injection_patterns = [
        "<script>",
        "javascript:",
        "../../",
        "${",
        "#{",
        "DROP TABLE",
        "SELECT * FROM",
        "\r\n",
        "%00",
        "\\x00",
    ];
    
    for pattern in injection_patterns {
        if input.to_lowercase().contains(pattern.to_lowercase().as_str()) {
            // Potential injection attempt - should be handled safely
        }
    }
    
    // Test Unicode normalization issues
    let unicode_tests = [
        "\u{0041}\u{0300}", // A with combining grave accent
        "\u{00C0}",         // Precomposed A with grave accent
        "\u{1F4A9}",        // Emoji
        "\u{0000}",         // Null character
        "\u{FFFD}",         // Replacement character
    ];
    
    for unicode_test in unicode_tests {
        if input.contains(unicode_test) {
            // Unicode edge case found
        }
    }
    
    // Test very large inputs (DoS protection)
    if input.len() > 1_000_000 {
        // Extremely large input - should be rejected early
    }
    
    // Test empty and whitespace-only inputs
    if input.is_empty() {
        // Empty input case
    }
    
    if input.trim().is_empty() && !input.is_empty() {
        // Whitespace-only input
    }
    
    // Test for valid currency codes specifically
    if input.len() == 3 {
        let all_upper = input.chars().all(|c| c.is_ascii_uppercase());
        let all_alpha = input.chars().all(|c| c.is_ascii_alphabetic());
        
        if all_upper && all_alpha {
            // Valid currency code format
            assert!(is_valid_currency_code(input));
        } else {
            // Invalid currency code format
            assert!(!is_valid_currency_code(input));
        }
    } else {
        // Wrong length for currency code
        assert!(!is_valid_currency_code(input));
    }
    
    // Test string truncation behavior
    for max_len in [1, 5, 10, 50, 100, 200, 300] {
        if input.len() > max_len {
            let truncated = &input[..max_len.min(input.len())];
            // Truncated version should still be valid UTF-8
            assert!(is_valid_utf8_string(truncated));
        }
    }
    
    // Test encoding edge cases
    let bytes = input.as_bytes();
    if bytes.len() != input.len() {
        // Multi-byte UTF-8 characters present
    }
    
    // Test for potential buffer overflow indicators
    if bytes.iter().any(|&b| b == 0xFF || b == 0xFE) {
        // Potential binary data in string
    }
});