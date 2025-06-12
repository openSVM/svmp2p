/**
 * Multi-Signature Governance Key Rotation Helper Template
 * 
 * Provides utilities for secure governance key rotation using multi-signature schemes.
 * This template can be customized for different governance models and security requirements.
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getStorageManager, STORAGE_BACKENDS } from './decentralizedStorage';

// Default configuration for multi-sig governance
const DEFAULT_GOVERNANCE_CONFIG = {
  requiredSignatures: 3, // Minimum signatures required for key rotation
  totalSigners: 5, // Total number of signers in the multi-sig
  rotationCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  proposalTimeout: 3 * 24 * 60 * 60 * 1000, // 3 days for proposals to expire
  emergencyThreshold: 4, // Higher threshold for emergency rotations
};

/**
 * Governance Key Rotation Proposal
 */
class KeyRotationProposal {
  constructor(id, proposer, currentKey, newKey, reason, timestamp) {
    this.id = id;
    this.proposer = proposer;
    this.currentKey = currentKey;
    this.newKey = newKey;
    this.reason = reason;
    this.timestamp = timestamp;
    this.signatures = new Map(); // signerPublicKey -> { signature, timestamp }
    this.status = 'pending'; // pending, approved, rejected, executed, expired
    this.isEmergency = false;
  }

  /**
   * Add a signature to the proposal
   * @param {PublicKey} signerKey - Signer's public key
   * @param {string} signature - Signature data
   * @param {boolean} approve - Whether this is an approval or rejection
   */
  addSignature(signerKey, signature, approve = true) {
    this.signatures.set(signerKey.toString(), {
      signature,
      timestamp: Date.now(),
      approve
    });
  }

  /**
   * Get current approval count
   */
  getApprovalCount() {
    return Array.from(this.signatures.values()).filter(sig => sig.approve).length;
  }

  /**
   * Get current rejection count
   */
  getRejectionCount() {
    return Array.from(this.signatures.values()).filter(sig => !sig.approve).length;
  }

  /**
   * Check if proposal has enough approvals
   * @param {number} requiredSignatures - Required number of signatures
   */
  hasEnoughApprovals(requiredSignatures) {
    return this.getApprovalCount() >= requiredSignatures;
  }

  /**
   * Check if proposal is expired
   * @param {number} timeoutMs - Timeout in milliseconds
   */
  isExpired(timeoutMs) {
    return Date.now() - this.timestamp > timeoutMs;
  }

  /**
   * Get proposal summary
   */
  getSummary() {
    return {
      id: this.id,
      proposer: this.proposer.toString(),
      currentKey: this.currentKey.toString(),
      newKey: this.newKey.toString(),
      reason: this.reason,
      timestamp: this.timestamp,
      status: this.status,
      isEmergency: this.isEmergency,
      approvals: this.getApprovalCount(),
      rejections: this.getRejectionCount(),
      signatures: Object.fromEntries(this.signatures)
    };
  }
}

/**
 * Multi-Signature Governance Manager
 */
class MultiSigGovernanceManager {
  constructor(connection, wallet, config = {}) {
    this.connection = connection;
    this.wallet = wallet;
    this.config = { ...DEFAULT_GOVERNANCE_CONFIG, ...config };
    this.proposals = new Map(); // proposalId -> KeyRotationProposal
    this.authorizedSigners = new Set(); // Set of authorized signer public keys
    this.currentGovernanceKey = null;
    this.lastRotation = null;
    
    // Initialize decentralized storage
    this.storageManager = getStorageManager(connection, wallet, {
      preferredBackend: config.storageBackend || STORAGE_BACKENDS.ON_CHAIN,
      fallbackChain: [STORAGE_BACKENDS.ON_CHAIN, STORAGE_BACKENDS.LOCAL_STORAGE]
    });
    
    // Load persisted state
    this.loadState();
  }

  /**
   * Initialize the governance system with signers and current key
   * @param {PublicKey[]} signers - Array of authorized signer public keys
   * @param {PublicKey} currentKey - Current governance key
   */
  async initialize(signers, currentKey) {
    this.authorizedSigners = new Set(signers.map(s => s.toString()));
    this.currentGovernanceKey = currentKey;
    await this.saveState();
    
    console.log(`Governance initialized with ${signers.length} signers and key: ${currentKey.toString()}`);
  }

  /**
   * Add an authorized signer (requires multi-sig approval)
   * @param {PublicKey} newSigner - New signer to add
   * @param {string} reason - Reason for adding signer
   */
  addSigner(newSigner, reason = 'Adding new authorized signer') {
    if (this.authorizedSigners.has(newSigner.toString())) {
      throw new Error('Signer already authorized');
    }

    // This would typically create a proposal for adding a signer
    // Implementation depends on specific governance requirements
    console.log(`Proposal to add signer ${newSigner.toString()}: ${reason}`);
  }

  /**
   * Remove an authorized signer (requires multi-sig approval)
   * @param {PublicKey} signerToRemove - Signer to remove
   * @param {string} reason - Reason for removal
   */
  removeSigner(signerToRemove, reason = 'Removing authorized signer') {
    if (!this.authorizedSigners.has(signerToRemove.toString())) {
      throw new Error('Signer not found');
    }

    if (this.authorizedSigners.size <= this.config.requiredSignatures) {
      throw new Error('Cannot remove signer: would drop below minimum required signatures');
    }

    console.log(`Proposal to remove signer ${signerToRemove.toString()}: ${reason}`);
  }

  /**
   * Propose a governance key rotation
   * @param {PublicKey} proposer - Public key of proposer
   * @param {PublicKey} newKey - New governance key
   * @param {string} reason - Reason for rotation
   * @param {boolean} isEmergency - Whether this is an emergency rotation
   */
  async proposeKeyRotation(proposer, newKey, reason, isEmergency = false) {
    // Validate proposer is authorized
    if (!this.authorizedSigners.has(proposer.toString())) {
      throw new Error('Proposer is not an authorized signer');
    }

    // Check cooldown period (unless emergency)
    if (!isEmergency && this.lastRotation) {
      const timeSinceLastRotation = Date.now() - this.lastRotation;
      if (timeSinceLastRotation < this.config.rotationCooldown) {
        const remainingTime = this.config.rotationCooldown - timeSinceLastRotation;
        throw new Error(`Key rotation cooldown active. ${Math.ceil(remainingTime / (24 * 60 * 60 * 1000))} days remaining.`);
      }
    }

    // Generate unique proposal ID
    const proposalId = this.generateProposalId();
    
    const proposal = new KeyRotationProposal(
      proposalId,
      proposer,
      this.currentGovernanceKey,
      newKey,
      reason,
      Date.now()
    );
    
    proposal.isEmergency = isEmergency;
    
    // Auto-approve by proposer
    proposal.addSignature(proposer, 'auto-approved-by-proposer', true);
    
    this.proposals.set(proposalId, proposal);
    await this.saveState();
    
    console.log(`Key rotation proposal created: ${proposalId}`);
    
    return proposalId;
  }

  /**
   * Sign a key rotation proposal
   * @param {string} proposalId - Proposal ID
   * @param {PublicKey} signer - Signer's public key
   * @param {boolean} approve - Whether to approve or reject
   * @param {string} signature - Cryptographic signature
   */
  async signProposal(proposalId, signer, approve, signature) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Validate signer is authorized
    if (!this.authorizedSigners.has(signer.toString())) {
      throw new Error('Signer is not authorized');
    }

    // Check if proposal is still active
    if (proposal.status !== 'pending') {
      throw new Error('Proposal is not in pending status');
    }

    // Check if proposal is expired
    if (proposal.isExpired(this.config.proposalTimeout)) {
      proposal.status = 'expired';
      await this.saveState();
      throw new Error('Proposal has expired');
    }

    // Add signature
    proposal.addSignature(signer, signature, approve);

    // Check if we have enough signatures to proceed
    const requiredSigs = proposal.isEmergency ? 
      this.config.emergencyThreshold : 
      this.config.requiredSignatures;

    if (proposal.hasEnoughApprovals(requiredSigs)) {
      proposal.status = 'approved';
      console.log(`Proposal ${proposalId} approved with ${proposal.getApprovalCount()} signatures`);
    } else if (proposal.getRejectionCount() > (this.authorizedSigners.size - requiredSigs)) {
      proposal.status = 'rejected';
      console.log(`Proposal ${proposalId} rejected`);
    }

    await this.saveState();
    return proposal.status;
  }

  /**
   * Execute an approved key rotation proposal
   * @param {string} proposalId - Proposal ID
   * @param {Function} executionCallback - Callback to execute the actual key rotation
   */
  async executeProposal(proposalId, executionCallback) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'approved') {
      throw new Error('Proposal is not approved');
    }

    try {
      // Execute the key rotation through the callback
      await executionCallback(proposal.currentKey, proposal.newKey);
      
      // Update governance state
      this.currentGovernanceKey = proposal.newKey;
      this.lastRotation = Date.now();
      proposal.status = 'executed';
      
      await this.saveState();
      
      console.log(`Key rotation executed: ${proposal.currentKey.toString()} -> ${proposal.newKey.toString()}`);
      
      return true;
    } catch (error) {
      console.error('Failed to execute key rotation:', error);
      throw error;
    }
  }

  /**
   * Get all proposals with optional filtering
   * @param {string} status - Filter by status (optional)
   */
  getProposals(status = null) {
    const proposals = Array.from(this.proposals.values())
      .map(p => p.getSummary());
    
    if (status) {
      return proposals.filter(p => p.status === status);
    }
    
    return proposals;
  }

  /**
   * Get active (pending) proposals
   */
  getActiveProposals() {
    return this.getProposals('pending');
  }

  /**
   * Clean up expired proposals
   */
  async cleanupExpiredProposals() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, proposal] of this.proposals) {
      if (proposal.status === 'pending' && proposal.isExpired(this.config.proposalTimeout)) {
        proposal.status = 'expired';
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      await this.saveState();
      console.log(`Cleaned up ${cleanedCount} expired proposals`);
    }
    
    return cleanedCount;
  }

  /**
   * Get governance statistics
   */
  getStats() {
    const proposals = Array.from(this.proposals.values());
    
    return {
      totalSigners: this.authorizedSigners.size,
      requiredSignatures: this.config.requiredSignatures,
      currentGovernanceKey: this.currentGovernanceKey?.toString(),
      lastRotation: this.lastRotation,
      totalProposals: proposals.length,
      pendingProposals: proposals.filter(p => p.status === 'pending').length,
      approvedProposals: proposals.filter(p => p.status === 'approved').length,
      executedProposals: proposals.filter(p => p.status === 'executed').length,
      rejectedProposals: proposals.filter(p => p.status === 'rejected').length,
      expiredProposals: proposals.filter(p => p.status === 'expired').length,
    };
  }

  /**
   * Generate a unique proposal ID
   */
  generateProposalId() {
    return `rotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state using decentralized storage with fallback to localStorage
   */
  async saveState() {
    try {
      const state = {
        config: this.config,
        authorizedSigners: Array.from(this.authorizedSigners),
        currentGovernanceKey: this.currentGovernanceKey?.toString(),
        lastRotation: this.lastRotation,
        proposals: Array.from(this.proposals.entries()).map(([id, proposal]) => [id, proposal.getSummary()]),
        version: 2, // Version for future migrations
        savedAt: Date.now()
      };
      
      const storageKey = `governance_state_${this.wallet?.publicKey?.toString() || 'default'}`;
      
      await this.storageManager.store(storageKey, state, {
        permanence: 'high',
        accessFrequency: 'medium'
      });
      
      console.log('Governance state saved to decentralized storage');
    } catch (error) {
      console.warn('Failed to save governance state to decentralized storage, falling back to localStorage:', error);
      
      // Fallback to original localStorage method
      try {
        const state = {
          config: this.config,
          authorizedSigners: Array.from(this.authorizedSigners),
          currentGovernanceKey: this.currentGovernanceKey?.toString(),
          lastRotation: this.lastRotation,
          proposals: Array.from(this.proposals.entries()).map(([id, proposal]) => [id, proposal.getSummary()])
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('multiSigGovernanceState', JSON.stringify(state));
        }
      } catch (fallbackError) {
        console.error('Failed to save governance state to localStorage:', fallbackError);
      }
    }
  }

  /**
   * Load state from decentralized storage with fallback to localStorage
   */
  async loadState() {
    try {
      const storageKey = `governance_state_${this.wallet?.publicKey?.toString() || 'default'}`;
      const state = await this.storageManager.retrieve(storageKey);
      
      if (state) {
        this.config = { ...DEFAULT_GOVERNANCE_CONFIG, ...state.config };
        this.authorizedSigners = new Set(state.authorizedSigners || []);
        this.currentGovernanceKey = state.currentGovernanceKey ? new PublicKey(state.currentGovernanceKey) : null;
        this.lastRotation = state.lastRotation;
        
        // Reconstruct proposals 
        this.proposals = new Map();
        if (state.proposals) {
          for (const [id, proposalData] of state.proposals) {
            const proposal = new KeyRotationProposal(
              proposalData.id,
              new PublicKey(proposalData.proposer),
              new PublicKey(proposalData.currentKey),
              new PublicKey(proposalData.newKey),
              proposalData.reason,
              proposalData.timestamp
            );
            proposal.status = proposalData.status;
            proposal.isEmergency = proposalData.isEmergency;
            
            // Reconstruct signatures
            for (const [signerKey, sigData] of Object.entries(proposalData.signatures)) {
              proposal.signatures.set(signerKey, sigData);
            }
            
            this.proposals.set(id, proposal);
          }
        }
        
        console.log('Governance state loaded from decentralized storage');
        return;
      }
    } catch (error) {
      console.warn('Failed to load from decentralized storage, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    try {
      if (typeof window === 'undefined') return;
      
      const saved = localStorage.getItem('multiSigGovernanceState');
      if (saved) {
        const state = JSON.parse(saved);
        
        this.config = { ...DEFAULT_GOVERNANCE_CONFIG, ...state.config };
        this.authorizedSigners = new Set(state.authorizedSigners || []);
        this.currentGovernanceKey = state.currentGovernanceKey ? new PublicKey(state.currentGovernanceKey) : null;
        this.lastRotation = state.lastRotation;
        
        // Reconstruct proposals (simplified version for demo)
        this.proposals = new Map();
        if (state.proposals) {
          for (const [id, proposalData] of state.proposals) {
            const proposal = new KeyRotationProposal(
              proposalData.id,
              new PublicKey(proposalData.proposer),
              new PublicKey(proposalData.currentKey),
              new PublicKey(proposalData.newKey),
              proposalData.reason,
              proposalData.timestamp
            );
            proposal.status = proposalData.status;
            proposal.isEmergency = proposalData.isEmergency;
            
            // Reconstruct signatures
            for (const [signerKey, sigData] of Object.entries(proposalData.signatures)) {
              proposal.signatures.set(signerKey, sigData);
            }
            
            this.proposals.set(id, proposal);
          }
        }
        
        console.log('Governance state loaded from localStorage fallback');
      }
    } catch (error) {
      console.warn('Failed to load governance state from localStorage:', error);
    }
  }

  /**
   * Reset governance state (admin function)
   */
  async reset() {
    this.proposals.clear();
    this.authorizedSigners.clear();
    this.currentGovernanceKey = null;
    this.lastRotation = null;
    await this.saveState();
    console.log('Governance state reset');
  }
}

/**
 * Utility functions for key rotation templates
 */
export const GovernanceUtils = {
  /**
   * Generate a new keypair for governance
   */
  generateNewGovernanceKey() {
    // This would integrate with your key generation system
    console.log('Generate new governance keypair - implement according to your security requirements');
    return null; // Return actual PublicKey in real implementation
  },

  /**
   * Validate a public key format
   * @param {string} keyString - Public key as string
   */
  validatePublicKey(keyString) {
    try {
      new PublicKey(keyString);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Create a governance transaction template
   * @param {PublicKey} currentKey - Current governance key
   * @param {PublicKey} newKey - New governance key
   */
  createGovernanceUpdateTransaction(currentKey, newKey) {
    // Template for creating governance update transactions
    // This should be customized based on your program's governance structure
    const transaction = new Transaction();
    
    // Add your program-specific governance update instruction here
    // Example placeholder:
    console.log(`Creating governance update transaction: ${currentKey.toString()} -> ${newKey.toString()}`);
    
    return transaction;
  },

  /**
   * Emergency governance recovery template
   * @param {PublicKey[]} emergencySigners - Emergency recovery signers
   * @param {PublicKey} newKey - New governance key
   */
  createEmergencyRecovery(emergencySigners, newKey) {
    console.log('Emergency governance recovery initiated');
    // Implement emergency recovery logic here
    return {
      emergencySigners: emergencySigners.map(s => s.toString()),
      newKey: newKey.toString(),
      timestamp: Date.now()
    };
  }
};

// Example usage and integration templates
export const GovernanceTemplates = {
  /**
   * Template for reward system governance integration
   */
  rewardSystemIntegration: {
    // Example: Update reward rates through governance
    updateRewardRates: async (manager, newRates) => {
      const proposalId = manager.proposeKeyRotation(
        /* proposer */ null,
        /* newKey */ null,
        `Update reward rates: trade=${newRates.trade}, vote=${newRates.vote}`
      );
      return proposalId;
    },

    // Example: Emergency pause of reward system
    emergencyPause: async (manager) => {
      const proposalId = manager.proposeKeyRotation(
        /* proposer */ null,
        /* newKey */ null,
        'Emergency pause of reward system',
        true // isEmergency
      );
      return proposalId;
    }
  },

  /**
   * Template for multi-sig wallet integration
   */
  walletIntegration: {
    // Integrate with Solana multi-sig wallets
    connectMultiSigWallet: (walletAddress) => {
      console.log(`Connecting to multi-sig wallet: ${walletAddress}`);
      // Implementation depends on your multi-sig wallet provider
    },

    // Create proposal for wallet-based governance
    createWalletProposal: (walletAdapter, proposalData) => {
      console.log('Creating wallet-based governance proposal');
      // Implementation for wallet integration
    }
  }
};

export default MultiSigGovernanceManager;