use anchor_lang::prelude::*;
use crate::errors::ErrorCode;

/// Common utility functions for input validation and processing
/// 
/// This module provides shared utilities to avoid code duplication
/// across instruction modules while maintaining safety and consistency.

/// Validates and trims input string for safety
/// 
/// Rust strings are UTF-8 by default, so no additional UTF-8 validation is needed.
/// This function just validates that the input is non-empty after trimming.
/// 
/// # Arguments
/// * `input` - The string to validate and trim
/// 
/// # Returns
/// * `Result<String>` - The trimmed string or an error if invalid
pub fn validate_and_trim_string(input: &str) -> Result<String> {
    let trimmed = input.trim().to_string();
    if trimmed.is_empty() {
        return Err(error!(ErrorCode::InputTooLong)); // Reuse existing error for empty strings
    }
    
    Ok(trimmed)
}

/// Validates string length against a maximum
/// 
/// # Arguments
/// * `input` - The string to validate
/// * `max_length` - Maximum allowed length
/// 
/// # Returns
/// * `Result<()>` - Ok if valid, error if too long
pub fn validate_string_length(input: &str, max_length: usize) -> Result<()> {
    if input.len() > max_length {
        return Err(error!(ErrorCode::InputTooLong));
    }
    Ok(())
}

/// Validates and processes a string with both trimming and length checking
/// 
/// # Arguments
/// * `input` - The string to validate
/// * `max_length` - Maximum allowed length after trimming
/// 
/// # Returns
/// * `Result<String>` - The processed string or an error
pub fn validate_and_process_string(input: &str, max_length: usize) -> Result<String> {
    let trimmed = validate_and_trim_string(input)?;
    validate_string_length(&trimmed, max_length)?;
    Ok(trimmed)
}

/// Validates if a string is a valid currency code (3 uppercase letters)
/// 
/// # Arguments
/// * `code` - The currency code to validate
/// 
/// # Returns
/// * `bool` - True if valid currency code format
pub fn is_valid_currency_code(code: &str) -> bool {
    code.len() == 3 && 
    code.chars().all(|c| c.is_ascii_uppercase()) &&
    code.chars().all(|c| c.is_ascii_alphabetic())
}

/// Validates if a string contains valid UTF-8
/// 
/// # Arguments
/// * `input` - The string to validate
/// 
/// # Returns
/// * `bool` - True if valid UTF-8
pub fn is_valid_utf8_string(input: &str) -> bool {
    // Rust strings are UTF-8 by definition, but this function
    // provides explicit validation for fuzzing and testing
    input.is_ascii() || std::str::from_utf8(input.as_bytes()).is_ok()
}