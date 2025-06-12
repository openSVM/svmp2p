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