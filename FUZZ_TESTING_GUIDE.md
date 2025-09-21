# Fuzz Testing and Property-Based Testing Guide

This document provides comprehensive guidance for using the fuzz testing and property-based testing infrastructure implemented for the Solana P2P Exchange smart contracts.

## Overview

The testing infrastructure includes two complementary approaches:

1. **Fuzz Testing**: Uses `cargo-fuzz` with libFuzzer to discover edge cases through input mutation
2. **Property-Based Testing**: Uses `proptest` to verify mathematical properties across input spaces

## Prerequisites

### System Requirements
- Rust nightly toolchain (required for fuzzing)
- Standard Rust stable toolchain (for property tests)
- At least 4GB RAM (recommended 8GB for intensive fuzzing)
- Linux/macOS/WSL environment

### Installation

```bash
# Install nightly Rust for fuzzing
rustup toolchain install nightly

# Install cargo-fuzz
cargo install cargo-fuzz

# Dependencies are already configured in Cargo.toml
```

## Property-Based Testing

Property-based tests verify mathematical invariants and properties that should always hold true.

### Running Property Tests

```bash
# Run all property tests
cd programs/p2p-exchange
cargo test property_tests --lib

# Run with verbose output
cargo test property_tests --lib -- --nocapture

# Run specific property test
cargo test prop_offer_creation_no_overflow --lib
```

### Available Property Tests

| Test | Property Verified | Coverage |
|------|-------------------|----------|
| `prop_offer_creation_no_overflow` | Arithmetic operations never overflow | Offer amounts, security bonds, timestamps |
| `prop_currency_code_validation` | Currency codes follow exact format | 3-letter uppercase validation |
| `prop_offer_status_transitions` | State machine integrity | Valid/invalid status transitions |
| `prop_escrow_balance_conservation` | Money conservation principle | Balance arithmetic, withdrawal limits |
| `prop_dispute_voting_math` | Vote counting accuracy | Tie detection, winner determination |
| `prop_reputation_bounds` | Reputation stays within bounds | Rating calculations, overflow protection |
| `prop_input_length_validation` | Consistent length checking | String validation across all fields |
| `prop_utf8_validation_safety` | Never panics on bad input | UTF-8 handling safety |

### Property Test Configuration

```rust
// Default configuration (in property_tests.rs)
// - 100 test cases per property by default
// - Deterministic shrinking on failure
// - Regression test file saved automatically

// Custom configuration example
proptest! {
    #![proptest_config(ProptestConfig::with_cases(1000))]
    #[test]
    fn my_intensive_property_test(input in 0..1000u32) {
        // Test implementation
    }
}
```

## Fuzz Testing

Fuzz testing uses random input mutation to discover edge cases and crashes.

### Available Fuzz Targets

#### 1. Offer Creation Fuzzer (`fuzz_offer_creation`)
Tests input validation for offer creation:
- Currency code format validation
- Payment method UTF-8 handling
- Amount boundary conditions
- String length enforcement
- Timestamp validation
- Overflow protection

#### 2. Dispute Resolution Fuzzer (`fuzz_dispute_resolution`)
Tests dispute system robustness:
- Dispute reason validation
- Evidence URL handling
- Vote counting edge cases
- Evidence submission limits
- UTF-8 sanitization
- Injection attack prevention

#### 3. Input Validation Fuzzer (`fuzz_input_validation`)
Comprehensive input testing:
- String length boundaries
- UTF-8 encoding edge cases
- Unicode normalization
- Injection patterns (script tags, SQL, etc.)
- Null byte handling
- Control character filtering

### Running Fuzz Tests

```bash
cd programs/p2p-exchange

# Build fuzz targets
cargo +nightly fuzz build fuzz_offer_creation
cargo +nightly fuzz build fuzz_dispute_resolution
cargo +nightly fuzz build fuzz_input_validation

# Run fuzz tests (interactive mode)
cargo +nightly fuzz run fuzz_offer_creation

# Run for specific duration
cargo +nightly fuzz run fuzz_offer_creation -- -max_total_time=300  # 5 minutes

# Run with specific number of iterations
cargo +nightly fuzz run fuzz_offer_creation -- -runs=10000

# List available targets
cargo +nightly fuzz list
```

### Fuzz Test Output

When a crash is found, cargo-fuzz will:
1. Save the crashing input to `fuzz/artifacts/`
2. Display the crash details
3. Provide reproduction instructions

Example output:
```
Running: fuzz/corpus/fuzz_offer_creation/...
#0  INITED cov: 1234 exec/s: 567
#1  NEW    cov: 1235 exec/s: 568
...
==1234==ERROR: AddressSanitizer: heap-buffer-overflow
SUMMARY: AddressSanitizer: heap-buffer-overflow

artifact_prefix='./fuzz/artifacts/fuzz_offer_creation/crash-'; 
Test unit written to ./fuzz/artifacts/fuzz_offer_creation/crash-da39a3ee5e6b4b0d3255bfef95601890afd80709
```

### Reproducing Crashes

```bash
# Reproduce a specific crash
cargo +nightly fuzz run fuzz_offer_creation ./fuzz/artifacts/fuzz_offer_creation/crash-da39a3ee5e6b4b0d3255bfef95601890afd80709

# Minimize crashing input
cargo +nightly fuzz tmin fuzz_offer_creation ./fuzz/artifacts/fuzz_offer_creation/crash-da39a3ee5e6b4b0d3255bfef95601890afd80709
```

## Corpus Management

### Initial Corpus
The fuzzer uses seed inputs for better coverage:

```bash
# Add custom corpus entries
echo "valid_test_input" > fuzz/corpus/fuzz_offer_creation/custom_seed_1
echo '{"currency":"USD","amount":1000}' > fuzz/corpus/fuzz_offer_creation/json_seed

# View corpus statistics
cargo +nightly fuzz cov fuzz_offer_creation
```

### Coverage Analysis

```bash
# Generate coverage report
cargo +nightly fuzz coverage fuzz_offer_creation

# View coverage in browser
cargo +nightly fuzz coverage fuzz_offer_creation --html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Fuzz and Property Testing

on: [push, pull_request]

jobs:
  property-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Run Property Tests
        run: |
          cd programs/p2p-exchange
          cargo test property_tests --lib
  
  fuzz-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: nightly
      
      - name: Install cargo-fuzz
        run: cargo install cargo-fuzz
      
      - name: Build fuzz targets
        run: |
          cd programs/p2p-exchange
          cargo +nightly fuzz build fuzz_offer_creation
          cargo +nightly fuzz build fuzz_dispute_resolution
          cargo +nightly fuzz build fuzz_input_validation
      
      - name: Run fuzz tests
        run: |
          cd programs/p2p-exchange
          timeout 300 cargo +nightly fuzz run fuzz_offer_creation -- -max_total_time=60 || true
          timeout 300 cargo +nightly fuzz run fuzz_dispute_resolution -- -max_total_time=60 || true
          timeout 300 cargo +nightly fuzz run fuzz_input_validation -- -max_total_time=60 || true
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: fuzz-artifacts
          path: programs/p2p-exchange/fuzz/artifacts/
```

## Development Workflow

### Adding New Fuzz Targets

1. Create new fuzz target file:
```bash
cd programs/p2p-exchange
cargo +nightly fuzz add fuzz_new_feature
```

2. Implement the fuzz target in `fuzz/fuzz_targets/fuzz_new_feature.rs`:
```rust
#![no_main]

use libfuzzer_sys::fuzz_target;
use arbitrary::Arbitrary;

#[derive(Arbitrary, Debug)]
struct NewFeatureInput {
    // Define input structure
}

fuzz_target!(|data: NewFeatureInput| {
    // Test the new feature
});
```

3. Update `fuzz/Cargo.toml` to include the new target:
```toml
[[bin]]
name = "fuzz_new_feature"
path = "fuzz_targets/fuzz_new_feature.rs"
test = false
doc = false
bench = false
```

### Adding New Property Tests

1. Add test to `src/tests/property_tests.rs`:
```rust
proptest! {
    #[test]
    fn prop_new_feature_property(
        input in strategy_for_input()
    ) {
        // Verify the property holds
        prop_assert!(property_condition);
    }
}
```

2. Define input generation strategies:
```rust
prop_compose! {
    fn strategy_for_input()(
        field1 in 0..1000u32,
        field2 in ".*"
    ) -> (u32, String) {
        (field1, field2)
    }
}
```

## Best Practices

### Fuzz Testing
- Start with short runs (1-5 minutes) to catch obvious issues
- Run longer sessions (hours/overnight) for thorough testing
- Focus on input validation and parsing logic
- Use structured input for complex data types
- Monitor resource usage (CPU, memory)

### Property Testing
- Define clear, testable properties
- Use appropriate input ranges
- Keep tests deterministic when possible
- Document the properties being tested
- Start with simple properties, build complexity

### Security Focus
- Test UTF-8 handling thoroughly
- Validate all string length limits
- Check arithmetic overflow conditions
- Test state machine transitions
- Verify authorization checks
- Test error handling paths

## Troubleshooting

### Common Issues

**Fuzz target won't build:**
```bash
# Ensure nightly toolchain is installed
rustup toolchain install nightly

# Check dependencies
cargo +nightly check --manifest-path fuzz/Cargo.toml
```

**Property test failures:**
```bash
# Enable detailed output
RUST_BACKTRACE=1 cargo test property_tests --lib -- --nocapture

# Run single test with logging
cargo test prop_specific_test --lib -- --exact --nocapture
```

**Performance issues:**
- Reduce test case count: `proptest_config(ProptestConfig::with_cases(10))`
- Use faster input generators
- Profile memory usage
- Consider parallel test execution

### Debug Mode

Enable debug output for detailed analysis:

```bash
# Verbose fuzz output
RUST_LOG=debug cargo +nightly fuzz run fuzz_offer_creation

# Property test debug
cargo test property_tests --lib --features debug-assertions
```

## Security Considerations

This testing infrastructure helps identify:

- **Input validation bypass attempts**
- **Buffer overflow conditions**
- **Integer overflow in calculations**
- **UTF-8 encoding attacks**
- **State machine violations**
- **Injection attack vectors**
- **Resource exhaustion scenarios**

Regular execution of these tests significantly improves the security posture of the smart contracts by discovering edge cases that manual testing might miss.

## Performance Metrics

Typical performance characteristics:

- **Property tests**: ~200ms for full suite
- **Fuzz tests**: ~1000 exec/sec per target
- **Coverage**: Targets 90%+ path coverage
- **Memory usage**: ~100MB per fuzz process

Monitor these metrics and adjust test parameters as needed for your CI/CD environment.