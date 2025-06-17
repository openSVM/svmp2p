/**
 * SVM Networks Configuration
 * 
 * Centralized network configuration for all Solana Virtual Machine networks
 * including endpoints, fallbacks, and connection parameters.
 */

import { clusterApiUrl } from '@solana/web3.js';

/**
 * SVM Networks configuration with primary and fallback endpoints
 */
export const SVM_NETWORKS = {
  'solana': {
    name: 'Solana',
    endpoint: clusterApiUrl('devnet'),
    programId: 'YOUR_SOLANA_PROGRAM_ID',
    icon: '/images/solana-logo.svg',
    color: '#9945FF',
    explorerUrl: 'https://explorer.solana.com',
    fallbackEndpoints: [
      'https://api.devnet.solana.com',
      'https://solana-devnet-rpc.allthatnode.com',
    ],
    connectionConfig: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }
  },
  'sonic': {
    name: 'Sonic',
    endpoint: 'https://sonic-api.example.com',
    programId: 'YOUR_SONIC_PROGRAM_ID',
    icon: '/images/sonic-logo.svg',
    color: '#00C2FF',
    explorerUrl: 'https://explorer.sonic.example.com',
    fallbackEndpoints: [],
    connectionConfig: {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    }
  }
};

/**
 * Get network configuration by name
 * @param {string} networkName - Network name (e.g., 'solana', 'sonic')
 * @returns {Object|null} Network configuration or null if not found
 */
export const getNetworkConfig = (networkName) => {
  return SVM_NETWORKS[networkName] || null;
};

/**
 * Get default network configuration (Solana)
 * @returns {Object} Default network configuration
 */
export const getDefaultNetworkConfig = () => {
  return SVM_NETWORKS.solana;
};

/**
 * Get all available network names
 * @returns {string[]} Array of network names
 */
export const getAvailableNetworks = () => {
  return Object.keys(SVM_NETWORKS);
};

/**
 * Validate network configuration
 * @param {Object} config - Network configuration to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateNetworkConfig = (config) => {
  return !!(
    config &&
    config.name &&
    config.endpoint &&
    config.connectionConfig
  );
};
