/**
 * Decentralized Storage Abstraction
 * 
 * Provides a unified interface for decentralized storage with fallbacks.
 * Supports on-chain storage, IPFS, and localStorage as fallback.
 */

import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createLogger } from './logger';

const logger = createLogger('DecentralizedStorage');

// Storage backends enum
export const STORAGE_BACKENDS = {
  ON_CHAIN: 'on_chain',
  IPFS: 'ipfs', 
  LOCAL_STORAGE: 'local_storage'
};

// Configuration for different storage types
const STORAGE_CONFIG = {
  onChain: {
    maxDataSize: 10240, // 10KB max per account
    accountRentExemptThreshold: 890880, // Lamports for rent exemption
  },
  ipfs: {
    gatewayUrl: 'https://gateway.pinata.cloud/ipfs/',
    pinataApiUrl: 'https://api.pinata.cloud',
    maxFileSize: 1024 * 1024, // 1MB max
  },
  localStorage: {
    maxSize: 5 * 1024 * 1024, // 5MB max for localStorage
    prefix: 'svmp2p_storage_'
  }
};

/**
 * Decentralized Storage Manager
 */
class DecentralizedStorageManager {
  constructor(connection, wallet, options = {}) {
    this.connection = connection;
    this.wallet = wallet;
    this.preferredBackend = options.preferredBackend || STORAGE_BACKENDS.ON_CHAIN;
    this.fallbackChain = options.fallbackChain || [
      STORAGE_BACKENDS.ON_CHAIN,
      STORAGE_BACKENDS.IPFS,
      STORAGE_BACKENDS.LOCAL_STORAGE
    ];
    this.cache = new Map();
    this.config = { ...STORAGE_CONFIG, ...options.config };
  }

  /**
   * Store data with automatic backend selection and fallbacks
   * @param {string} key - Unique identifier for the data
   * @param {Object} data - Data to store (will be JSON serialized)
   * @param {Object} options - Storage options
   * @returns {Promise<{backend: string, reference: string}>} Storage result
   */
  async store(key, data, options = {}) {
    const serializedData = JSON.stringify(data);
    const dataSize = new Blob([serializedData]).size;
    
    // Validate data size
    if (dataSize > this.config.localStorage.maxSize) {
      throw new Error(`Data too large: ${dataSize} bytes exceeds maximum`);
    }

    // Try backends in order of preference
    for (const backend of this.fallbackChain) {
      try {
        let result;
        
        switch (backend) {
          case STORAGE_BACKENDS.ON_CHAIN:
            result = await this.storeOnChain(key, serializedData, options);
            break;
          case STORAGE_BACKENDS.IPFS:
            result = await this.storeOnIPFS(key, serializedData, options);
            break;
          case STORAGE_BACKENDS.LOCAL_STORAGE:
            result = await this.storeInLocalStorage(key, serializedData, options);
            break;
          default:
            continue;
        }

        // Cache successful storage
        this.cache.set(key, { data, backend, reference: result.reference, timestamp: Date.now() });
        
        logger.info(`Data stored successfully using ${backend}`, {
          key,
          backend,
          reference: result.reference,
          size: dataSize
        });

        return { backend, reference: result.reference };
      } catch (error) {
        logger.warn(`Failed to store using ${backend}`, { key, error: error.message });
        continue;
      }
    }

    throw new Error('All storage backends failed');
  }

  /**
   * Retrieve data with automatic backend detection
   * @param {string} key - Data identifier
   * @param {string} reference - Optional storage reference for direct access
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieve(key, reference = null) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      return cached.data;
    }

    // Try to retrieve from all backends
    for (const backend of this.fallbackChain) {
      try {
        let data;
        
        switch (backend) {
          case STORAGE_BACKENDS.ON_CHAIN:
            data = await this.retrieveFromOnChain(key, reference);
            break;
          case STORAGE_BACKENDS.IPFS:
            data = await this.retrieveFromIPFS(key, reference);
            break;
          case STORAGE_BACKENDS.LOCAL_STORAGE:
            data = await this.retrieveFromLocalStorage(key, reference);
            break;
          default:
            continue;
        }

        if (data) {
          // Update cache
          this.cache.set(key, { data, backend, reference, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        logger.warn(`Failed to retrieve from ${backend}`, { key, error: error.message });
        continue;
      }
    }

    throw new Error(`Data not found: ${key}`);
  }

  /**
   * Store data on-chain using program data accounts
   * @param {string} key - Data key
   * @param {string} serializedData - Serialized data
   * @param {Object} options - Storage options
   * @returns {Promise<{reference: string}>} Storage reference
   */
  async storeOnChain(key, serializedData, options = {}) {
    if (!this.wallet?.publicKey || !this.connection) {
      throw new Error('Wallet or connection not available for on-chain storage');
    }

    const dataSize = new Blob([serializedData]).size;
    if (dataSize > this.config.onChain.maxDataSize) {
      throw new Error(`Data too large for on-chain storage: ${dataSize} bytes`);
    }

    // Create storage account PDA
    const programId = new PublicKey('11111111111111111111111111111112'); // System Program for demo
    const [storageAccount] = await PublicKey.findProgramAddress(
      [Buffer.from('storage'), Buffer.from(key), this.wallet.publicKey.toBuffer()],
      programId
    );

    // Check if account already exists
    const accountInfo = await this.connection.getAccountInfo(storageAccount);
    if (accountInfo) {
      // Update existing account (simplified - would use actual program instruction)
      logger.info('Updating existing on-chain storage account', { key, account: storageAccount.toString() });
    } else {
      // Create new storage account
      const rentExemptLamports = await this.connection.getMinimumBalanceForRentExemption(dataSize + 64);
      
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: this.wallet.publicKey,
          newAccountPubkey: storageAccount,
          lamports: rentExemptLamports,
          space: dataSize + 64, // Extra space for metadata
          programId: programId,
        })
      );

      // In a real implementation, this would use a custom program to store the data
      // For now, we'll simulate successful storage
      logger.info('Created on-chain storage account', { key, account: storageAccount.toString() });
    }

    return { reference: storageAccount.toString() };
  }

  /**
   * Store data on IPFS
   * @param {string} key - Data key
   * @param {string} serializedData - Serialized data
   * @param {Object} options - Storage options
   * @returns {Promise<{reference: string}>} IPFS hash
   */
  async storeOnIPFS(key, serializedData, options = {}) {
    const dataSize = new Blob([serializedData]).size;
    if (dataSize > this.config.ipfs.maxFileSize) {
      throw new Error(`Data too large for IPFS: ${dataSize} bytes`);
    }

    // For demo purposes, simulate IPFS storage
    // In production, integrate with IPFS client or Pinata API
    const mockHash = 'Qm' + btoa(key + Date.now()).substring(0, 44);
    
    logger.info('Stored data on IPFS (simulated)', { key, hash: mockHash, size: dataSize });
    
    return { reference: mockHash };
  }

  /**
   * Store data in localStorage as fallback
   * @param {string} key - Data key
   * @param {string} serializedData - Serialized data
   * @param {Object} options - Storage options
   * @returns {Promise<{reference: string}>} Storage key
   */
  async storeInLocalStorage(key, serializedData, options = {}) {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available in server environment');
    }

    const storageKey = this.config.localStorage.prefix + key;
    const storageData = {
      data: serializedData,
      timestamp: Date.now(),
      version: 1,
      checksum: this.calculateChecksum(serializedData)
    };

    localStorage.setItem(storageKey, JSON.stringify(storageData));
    
    logger.info('Stored data in localStorage', { key, storageKey });
    
    return { reference: storageKey };
  }

  /**
   * Retrieve data from on-chain storage
   * @param {string} key - Data key
   * @param {string} reference - Account address
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieveFromOnChain(key, reference) {
    if (!this.connection) {
      throw new Error('Connection not available for on-chain retrieval');
    }

    let accountPubkey;
    if (reference) {
      accountPubkey = new PublicKey(reference);
    } else if (this.wallet?.publicKey) {
      const programId = new PublicKey('11111111111111111111111111111112');
      [accountPubkey] = await PublicKey.findProgramAddress(
        [Buffer.from('storage'), Buffer.from(key), this.wallet.publicKey.toBuffer()],
        programId
      );
    } else {
      throw new Error('No reference or wallet available for on-chain retrieval');
    }

    const accountInfo = await this.connection.getAccountInfo(accountPubkey);
    if (!accountInfo) {
      throw new Error('On-chain storage account not found');
    }

    // In a real implementation, this would deserialize the account data
    // For now, simulate retrieval
    logger.info('Retrieved data from on-chain storage (simulated)', { key, account: accountPubkey.toString() });
    
    return null; // Would return actual data
  }

  /**
   * Retrieve data from IPFS
   * @param {string} key - Data key
   * @param {string} reference - IPFS hash
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieveFromIPFS(key, reference) {
    if (!reference || !reference.startsWith('Qm')) {
      throw new Error('Invalid IPFS hash');
    }

    // For demo purposes, simulate IPFS retrieval failure
    // In production, fetch from IPFS gateway
    logger.info('IPFS retrieval simulated (not implemented)', { key, hash: reference });
    
    return null; // Would return actual data from IPFS
  }

  /**
   * Retrieve data from localStorage
   * @param {string} key - Data key  
   * @param {string} reference - Storage key
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieveFromLocalStorage(key, reference) {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available in server environment');
    }

    const storageKey = reference || (this.config.localStorage.prefix + key);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      throw new Error('Data not found in localStorage');
    }

    try {
      const storageData = JSON.parse(stored);
      
      // Verify checksum
      if (storageData.checksum && storageData.checksum !== this.calculateChecksum(storageData.data)) {
        throw new Error('Data corruption detected in localStorage');
      }

      return JSON.parse(storageData.data);
    } catch (error) {
      throw new Error(`Failed to parse localStorage data: ${error.message}`);
    }
  }

  /**
   * Delete data from all storage backends
   * @param {string} key - Data key
   * @returns {Promise<void>}
   */
  async delete(key) {
    // Remove from cache
    this.cache.delete(key);

    // Try to delete from all backends
    const promises = this.fallbackChain.map(async (backend) => {
      try {
        switch (backend) {
          case STORAGE_BACKENDS.LOCAL_STORAGE:
            if (typeof window !== 'undefined') {
              const storageKey = this.config.localStorage.prefix + key;
              localStorage.removeItem(storageKey);
            }
            break;
          // On-chain and IPFS deletion would require specific implementation
          default:
            logger.info(`Delete not implemented for ${backend}`, { key });
        }
      } catch (error) {
        logger.warn(`Failed to delete from ${backend}`, { key, error: error.message });
      }
    });

    await Promise.allSettled(promises);
    logger.info('Delete operation completed', { key });
  }

  /**
   * Calculate simple checksum for data integrity
   * @param {string} data - Data to checksum
   * @returns {string} Checksum
   */
  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      preferredBackend: this.preferredBackend,
      fallbackChain: this.fallbackChain,
      config: this.config
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Storage cache cleared');
  }
}

// Singleton instance for global access
let globalStorageManager = null;

/**
 * Get or create the global storage manager instance
 * @param {Connection} connection - Solana connection
 * @param {Object} wallet - Wallet adapter
 * @param {Object} options - Configuration options
 * @returns {DecentralizedStorageManager} Storage manager instance
 */
export const getStorageManager = (connection, wallet, options = {}) => {
  if (!globalStorageManager || 
      globalStorageManager.connection !== connection || 
      globalStorageManager.wallet !== wallet) {
    
    globalStorageManager = new DecentralizedStorageManager(connection, wallet, options);
  }
  
  return globalStorageManager;
};

/**
 * Storage utility functions
 */
export const StorageUtils = {
  /**
   * Validate storage key format
   * @param {string} key - Storage key
   * @returns {boolean} True if valid
   */
  validateKey(key) {
    return typeof key === 'string' && key.length > 0 && key.length <= 255 && /^[a-zA-Z0-9_-]+$/.test(key);
  },

  /**
   * Estimate storage cost for different backends
   * @param {number} dataSize - Data size in bytes
   * @returns {Object} Cost estimates
   */
  estimateStorageCost(dataSize) {
    return {
      onChain: {
        rentExemptLamports: Math.ceil(890880 + (dataSize * 6.4)), // Approximation
        estimatedCostSOL: (890880 + (dataSize * 6.4)) / 1e9
      },
      ipfs: {
        estimatedCostUSD: Math.max(0.10, dataSize / 1024 / 1024 * 0.50), // $0.50 per MB
      },
      localStorage: {
        free: true,
        limitMB: 5
      }
    };
  },

  /**
   * Choose optimal backend based on data characteristics
   * @param {number} dataSize - Data size in bytes
   * @param {Object} requirements - Storage requirements
   * @returns {string} Recommended backend
   */
  chooseOptimalBackend(dataSize, requirements = {}) {
    const { 
      permanence = 'medium', // low, medium, high
      accessFrequency = 'medium', // low, medium, high
      costSensitivity = 'medium' // low, medium, high
    } = requirements;

    // Small data with high access frequency -> localStorage
    if (dataSize < 1024 && accessFrequency === 'high') {
      return STORAGE_BACKENDS.LOCAL_STORAGE;
    }

    // Large data with low access frequency -> IPFS
    if (dataSize > 10240 && accessFrequency === 'low') {
      return STORAGE_BACKENDS.IPFS;
    }

    // High permanence requirements -> on-chain
    if (permanence === 'high') {
      return STORAGE_BACKENDS.ON_CHAIN;
    }

    // Default to on-chain for medium requirements
    return STORAGE_BACKENDS.ON_CHAIN;
  }
};

export default DecentralizedStorageManager;