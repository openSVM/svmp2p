// Shared fuzzing utilities and types for P2P Exchange contract fuzzing

use arbitrary::{Arbitrary, Unstructured};

/// Fuzzed instruction data for offer creation
#[derive(Debug, Clone, Arbitrary)]
pub struct FuzzCreateOfferData {
    pub amount: u64,
    pub fiat_amount: u64,
    pub fiat_currency: FuzzString,
    pub payment_method: FuzzString,
    pub created_at: i64,
}

/// Fuzzed instruction data for offer acceptance
#[derive(Debug, Clone, Arbitrary)]
pub struct FuzzAcceptOfferData {
    pub security_bond: u64,
}

/// Fuzzed instruction data for dispute creation
#[derive(Debug, Clone, Arbitrary)]
pub struct FuzzDisputeData {
    pub reason: FuzzString,
    pub evidence_hash: FuzzString,
}

/// Wrapper for strings with custom fuzzing strategy
#[derive(Debug, Clone)]
pub struct FuzzString {
    pub value: String,
}

impl<'a> Arbitrary<'a> for FuzzString {
    fn arbitrary(u: &mut Unstructured<'a>) -> arbitrary::Result<Self> {
        // Generate strings with various characteristics for better fuzzing
        let strategy = u.int_in_range(0..=4)?;
        
        let value = match strategy {
            0 => {
                // Normal ASCII string
                let len = u.int_in_range(0..=100)?;
                let mut result = String::new();
                for _ in 0..len {
                    let ch = u.int_in_range(32u8..=126u8)? as char;
                    result.push(ch);
                }
                result
            },
            1 => {
                // Empty string
                String::new()
            },
            2 => {
                // Very long string
                let len = u.int_in_range(1000..=5000)?;
                "A".repeat(len)
            },
            3 => {
                // Unicode string
                let len = u.int_in_range(0..=50)?;
                let mut result = String::new();
                for _ in 0..len {
                    let ch = char::from_u32(u.int_in_range(0x20..=0x10FFFF)?).unwrap_or('A');
                    if ch.is_control() { continue; }
                    result.push(ch);
                }
                result
            },
            4 => {
                // Common currency codes and payment methods for better coverage
                let currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "", "VERYLONGCURRENCY", "🚀", "null"];
                let methods = ["Bank Transfer", "PayPal", "Credit Card", "Cash", "", "VERYLONGPAYMENTMETHOD", "Wire Transfer", "🏦"];
                
                if u.ratio(1, 2)? {
                    currencies[u.choose_index(currencies.len())?].to_string()
                } else {
                    methods[u.choose_index(methods.len())?].to_string()
                }
            }
            _ => unreachable!(),
        };
        
        Ok(FuzzString { value })
    }
}

/// Fuzzed reputation data
#[derive(Debug, Clone, Arbitrary)]
pub struct FuzzReputationData {
    pub rating: u8,
    pub trade_volume: u64,
}

/// Utility function to validate if a string is a valid currency code
pub fn is_valid_currency_code(s: &str) -> bool {
    s.len() == 3 && s.chars().all(|c| c.is_ascii_uppercase())
}

/// Utility function to check UTF-8 validity
pub fn is_valid_utf8_string(s: &str) -> bool {
    s.is_ascii() || std::str::from_utf8(s.as_bytes()).is_ok()
}

/// Generate test corpus seeds for better fuzzing
pub fn generate_corpus_seeds() -> Vec<Vec<u8>> {
    vec![
        // Valid create offer data
        b"valid_offer_data_123".to_vec(),
        // Invalid amount (zero)
        b"zero_amount_offer".to_vec(),
        // Very large amounts
        b"max_amount_offer_test".to_vec(),
        // Invalid currency codes
        b"invalid_currency_xx".to_vec(),
        // Long strings
        b"very_long_payment_method_that_exceeds_limits".to_vec(),
        // Unicode test cases
        "unicode_test_🚀💎".as_bytes().to_vec(),
        // Empty data
        vec![],
        // Malformed data
        vec![0xFF, 0xFE, 0xFD],
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_currency_codes() {
        assert!(is_valid_currency_code("USD"));
        assert!(is_valid_currency_code("EUR"));
        assert!(!is_valid_currency_code("us"));
        assert!(!is_valid_currency_code("USDD"));
        assert!(!is_valid_currency_code(""));
    }
}