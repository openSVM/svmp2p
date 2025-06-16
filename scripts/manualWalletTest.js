#!/usr/bin/env node

/**
 * Manual Testing Script for Wallet Validation
 * 
 * This script tests various wallet validation scenarios to ensure
 * the validation utilities work correctly with different inputs.
 */

const {
  isValidPublicKey,
  isValidNetwork,
  isValidAmount,
  validateWalletConnection,
  validateTransactionParams,
  validateCrossNetworkTrade,
  sanitizePublicKey,
  sanitizeAmount,
  getErrorMessage,
  WalletValidationError,
  VALIDATION_ERRORS,
  SUPPORTED_NETWORKS
} = require('../src/utils/walletValidation.js');

console.log('🧪 Manual Wallet Validation Testing\n');
console.log('=====================================\n');

// Test scenarios
const testScenarios = [
  {
    name: 'Valid Solana Address',
    test: () => {
      const validAddress = '11111111111111111111111111111112';
      console.log(`Testing address: ${validAddress}`);
      console.log(`isValidPublicKey: ${isValidPublicKey(validAddress)}`);
      console.log(`sanitizePublicKey: ${sanitizePublicKey(validAddress)}`);
    }
  },
  {
    name: 'Invalid Address Formats',
    test: () => {
      const invalidAddresses = [
        'invalid-address',
        '123',
        'a'.repeat(100),
        '',
        null,
        undefined
      ];
      
      invalidAddresses.forEach(addr => {
        console.log(`Testing invalid address: ${addr}`);
        console.log(`  isValidPublicKey: ${isValidPublicKey(addr)}`);
        console.log(`  sanitizePublicKey: ${sanitizePublicKey(addr)}`);
      });
    }
  },
  {
    name: 'Network Validation',
    test: () => {
      console.log('Supported networks:', SUPPORTED_NETWORKS);
      
      const testNetworks = [
        'solana',
        'SOLANA',
        'sonic',
        'ethereum', // Should fail
        'bitcoin',  // Should fail
        '',
        null
      ];
      
      testNetworks.forEach(network => {
        console.log(`Testing network: ${network} -> ${isValidNetwork(network)}`);
      });
    }
  },
  {
    name: 'Amount Validation',
    test: () => {
      const testAmounts = [
        { amount: 1.5, decimals: 9 },
        { amount: '2.5', decimals: 9 },
        { amount: 0, decimals: 9 },      // Should fail
        { amount: -1, decimals: 9 },     // Should fail
        { amount: 1.123456789, decimals: 9 },
        { amount: 1.1234567890123, decimals: 9 }, // Should fail - too many decimals
        { amount: 2000000000, decimals: 9 },      // Should fail - too large
        { amount: 'invalid', decimals: 9 },       // Should fail
      ];
      
      testAmounts.forEach(({ amount, decimals }) => {
        const valid = isValidAmount(amount, decimals);
        const sanitized = sanitizeAmount(amount, decimals);
        console.log(`Amount: ${amount} (${decimals} decimals) -> valid: ${valid}, sanitized: ${sanitized}`);
      });
    }
  },
  {
    name: 'Wallet Connection Validation',
    test: () => {
      const testCases = [
        {
          name: 'Valid connection',
          params: {
            publicKey: '11111111111111111111111111111112',
            network: 'solana'
          }
        },
        {
          name: 'Invalid public key',
          params: {
            publicKey: 'invalid-key',
            network: 'solana'
          }
        },
        {
          name: 'Invalid network',
          params: {
            publicKey: '11111111111111111111111111111112',
            network: 'ethereum'
          }
        },
        {
          name: 'Missing parameters',
          params: null
        }
      ];
      
      testCases.forEach(({ name, params }) => {
        console.log(`\nTesting: ${name}`);
        try {
          const result = validateWalletConnection(params);
          console.log(`  Valid: ${result.valid}`);
          if (!result.valid) {
            console.log(`  Errors: ${result.errors.map(e => e.message).join(', ')}`);
          }
        } catch (error) {
          console.log(`  Error: ${error.message}`);
        }
      });
    }
  },
  {
    name: 'Transaction Parameter Validation',
    test: () => {
      const testCases = [
        {
          name: 'Valid transaction',
          params: {
            from: '11111111111111111111111111111112',
            to: '11111111111111111111111111111113',
            amount: 1.5,
            network: 'solana',
            decimals: 9
          }
        },
        {
          name: 'Same sender and recipient',
          params: {
            from: '11111111111111111111111111111112',
            to: '11111111111111111111111111111112',
            amount: 1.5,
            network: 'solana',
            decimals: 9
          }
        },
        {
          name: 'Invalid amount',
          params: {
            from: '11111111111111111111111111111112',
            to: '11111111111111111111111111111113',
            amount: -1,
            network: 'solana',
            decimals: 9
          }
        }
      ];
      
      testCases.forEach(({ name, params }) => {
        console.log(`\nTesting: ${name}`);
        try {
          const result = validateTransactionParams(params);
          console.log(`  Valid: ${result.valid}`);
          if (!result.valid) {
            result.errors.forEach(error => {
              console.log(`  Error: ${getErrorMessage(error)}`);
            });
          }
        } catch (error) {
          console.log(`  Error: ${error.message}`);
        }
      });
    }
  },
  {
    name: 'Cross-Network Trade Validation',
    test: () => {
      const testCases = [
        {
          name: 'Valid cross-network trade',
          params: {
            sourceNetwork: 'solana',
            destinationNetwork: 'sonic',
            sourceToken: 'SOL',
            destinationToken: 'SONIC'
          }
        },
        {
          name: 'Same source and destination',
          params: {
            sourceNetwork: 'solana',
            destinationNetwork: 'solana',
            sourceToken: 'SOL',
            destinationToken: 'SOL'
          }
        },
        {
          name: 'Unsupported networks',
          params: {
            sourceNetwork: 'ethereum',
            destinationNetwork: 'bitcoin',
            sourceToken: 'ETH',
            destinationToken: 'BTC'
          }
        }
      ];
      
      testCases.forEach(({ name, params }) => {
        console.log(`\nTesting: ${name}`);
        try {
          const result = validateCrossNetworkTrade(params);
          console.log(`  Valid: ${result.valid}`);
          if (!result.valid) {
            result.errors.forEach(error => {
              console.log(`  Error: ${getErrorMessage(error)}`);
            });
          }
        } catch (error) {
          console.log(`  Error: ${error.message}`);
        }
      });
    }
  },
  {
    name: 'Error Message Generation',
    test: () => {
      const testErrors = [
        new WalletValidationError(VALIDATION_ERRORS.INVALID_PUBLIC_KEY),
        new WalletValidationError(VALIDATION_ERRORS.INVALID_NETWORK),
        new WalletValidationError(VALIDATION_ERRORS.INVALID_AMOUNT),
        new Error('User rejected the request'),
        new Error('insufficient funds for transaction'),
        new Error('Unknown error type')
      ];
      
      testErrors.forEach(error => {
        console.log(`Error: ${error.message}`);
        console.log(`  User message: ${getErrorMessage(error)}`);
      });
    }
  }
];

// Run all test scenarios
console.log('Running manual validation tests...\n');

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log('='.repeat(scenario.name.length + 4));
  
  try {
    scenario.test();
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
  
  console.log('');
});

console.log('\n✅ Manual testing completed!');
console.log('\nNext steps:');
console.log('1. Test with actual wallet providers (Phantom, Solflare, etc.)');
console.log('2. Test network switching scenarios');
console.log('3. Test with different token types and decimals');
console.log('4. Test error recovery flows');
console.log('5. Test cross-network compatibility');