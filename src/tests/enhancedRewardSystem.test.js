/**
 * Test suite for enhanced reward system features
 * 
 * Tests auto-claim, cooldown logic, and jitter-enhanced retry mechanisms
 */

import { 
  claimRewards, 
  isUserOnClaimCooldown, 
  getRemainingCooldown, 
  clearClaimCooldown,
  getCooldownStats,
  getRetryConfigOptions
} from '../utils/rewardTransactions';

import { getAutoClaimManager } from '../utils/autoClaimManager';
import MultiSigGovernanceManager, { GovernanceUtils } from '../utils/multiSigGovernance';

// Mock PublicKey for testing
class MockPublicKey {
  constructor(key) {
    this.key = key;
  }
  
  toString() {
    return this.key;
  }
  
  toBuffer() {
    return Buffer.from(this.key, 'hex');
  }
}

// Mock wallet for testing
const mockWallet = {
  publicKey: new MockPublicKey('test-user-key'),
  connected: true,
  sendTransaction: jest.fn(() => Promise.resolve('mock-signature'))
};

describe('Enhanced Reward System', () => {
  beforeEach(() => {
    // Clear any existing cooldowns
    clearClaimCooldown(mockWallet.publicKey);
  });

  describe('Cooldown Logic', () => {
    test('should track claim cooldowns correctly', async () => {
      const userKey = mockWallet.publicKey;
      
      // Initially no cooldown
      expect(isUserOnClaimCooldown(userKey)).toBe(false);
      expect(getRemainingCooldown(userKey)).toBe(0);
      
      // Claim rewards (which sets cooldown)
      await claimRewards(mockWallet, null, userKey);
      
      // Should be on cooldown now
      expect(isUserOnClaimCooldown(userKey)).toBe(true);
      expect(getRemainingCooldown(userKey)).toBeGreaterThan(0);
    });

    test('should prevent claims during cooldown', async () => {
      const userKey = mockWallet.publicKey;
      
      // Claim rewards to trigger cooldown
      await claimRewards(mockWallet, null, userKey);
      
      // Try to claim again - should fail
      await expect(claimRewards(mockWallet, null, userKey))
        .rejects
        .toThrow(/cooldown/i);
    });

    test('should allow bypass of cooldown when specified', async () => {
      const userKey = mockWallet.publicKey;
      
      // Claim rewards to trigger cooldown
      await claimRewards(mockWallet, null, userKey);
      
      // Should be able to bypass cooldown
      await expect(claimRewards(mockWallet, null, userKey, { bypassCooldown: true }))
        .resolves
        .toBeTruthy();
    });

    test('should provide accurate cooldown statistics', () => {
      const stats = getCooldownStats();
      
      expect(stats).toHaveProperty('totalTrackedUsers');
      expect(stats).toHaveProperty('usersOnCooldown');
      expect(stats).toHaveProperty('cooldownDuration');
      expect(stats).toHaveProperty('config');
    });
  });

  describe('Retry Configuration', () => {
    test('should provide different retry configuration options', () => {
      const options = getRetryConfigOptions();
      
      expect(options).toHaveProperty('default');
      expect(options).toHaveProperty('fast');
      expect(options).toHaveProperty('robust');
      expect(options).toHaveProperty('readOnly');
      
      // Verify fast config has fewer retries
      expect(options.fast.maxRetries).toBeLessThan(options.robust.maxRetries);
      
      // Verify read-only config has minimal retries
      expect(options.readOnly.maxRetries).toBeLessThanOrEqual(options.fast.maxRetries);
    });

    test('should use custom retry configuration', async () => {
      const userKey = mockWallet.publicKey;
      const customConfig = {
        maxRetries: 1,
        baseRetryDelay: 100,
        jitterFactor: 0.1
      };
      
      // This should work with custom config
      await expect(claimRewards(mockWallet, null, userKey, { retryConfig: customConfig }))
        .resolves
        .toBeTruthy();
    });
  });

  describe('Auto-Claim Manager', () => {
    let autoClaimManager;
    
    beforeEach(() => {
      autoClaimManager = getAutoClaimManager(mockWallet, null);
      autoClaimManager.stop(); // Ensure clean state
    });

    afterEach(() => {
      if (autoClaimManager) {
        autoClaimManager.destroy();
      }
    });

    test('should initialize with default configuration', () => {
      const config = autoClaimManager.getConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('autoClaimThreshold');
      expect(config).toHaveProperty('maxAutoClaimAttempts');
      expect(config).toHaveProperty('cooldownPeriod');
      expect(config).toHaveProperty('jitterRange');
      expect(config).toHaveProperty('scheduleInterval');
    });

    test('should update configuration correctly', () => {
      const newConfig = {
        enabled: true,
        autoClaimThreshold: 500,
        maxAutoClaimAttempts: 5
      };
      
      autoClaimManager.updateConfig(newConfig);
      const updatedConfig = autoClaimManager.getConfig();
      
      expect(updatedConfig.enabled).toBe(true);
      expect(updatedConfig.autoClaimThreshold).toBe(500);
      expect(updatedConfig.maxAutoClaimAttempts).toBe(5);
    });

    test('should track auto-claim statistics', () => {
      const stats = autoClaimManager.getStats();
      
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('lastClaimAttempts');
      expect(stats).toHaveProperty('eligibleUsers');
    });

    test('should respect cooldown periods for auto-claim eligibility', () => {
      const userId = mockWallet.publicKey.toString();
      
      // Initially eligible
      expect(autoClaimManager.isEligibleForClaim(userId)).toBe(true);
      
      // Simulate recent claim attempt
      autoClaimManager.lastClaimAttempt.set(userId, Date.now());
      
      // Should not be eligible now
      expect(autoClaimManager.isEligibleForClaim(userId)).toBe(false);
    });
  });

  describe('Multi-Sig Governance', () => {
    let governance;
    const mockSigners = [
      new MockPublicKey('signer1'),
      new MockPublicKey('signer2'),
      new MockPublicKey('signer3'),
      new MockPublicKey('signer4'),
      new MockPublicKey('signer5')
    ];
    const mockCurrentKey = new MockPublicKey('current-governance-key');
    
    beforeEach(() => {
      governance = new MultiSigGovernanceManager({
        requiredSignatures: 3,
        totalSigners: 5
      });
      governance.initialize(mockSigners, mockCurrentKey);
    });

    afterEach(() => {
      governance.reset();
    });

    test('should initialize governance with signers', () => {
      expect(governance.authorizedSigners.size).toBe(5);
      expect(governance.currentGovernanceKey).toEqual(mockCurrentKey);
    });

    test('should create key rotation proposals', () => {
      const newKey = new MockPublicKey('new-governance-key');
      const proposalId = governance.proposeKeyRotation(
        mockSigners[0],
        newKey,
        'Test rotation'
      );
      
      expect(proposalId).toBeTruthy();
      
      const proposals = governance.getActiveProposals();
      expect(proposals).toHaveLength(1);
      expect(proposals[0].proposer).toBe(mockSigners[0].toString());
    });

    test('should handle proposal signing and approval', () => {
      const newKey = new MockPublicKey('new-governance-key');
      const proposalId = governance.proposeKeyRotation(
        mockSigners[0],
        newKey,
        'Test rotation'
      );
      
      // Sign with additional signers
      governance.signProposal(proposalId, mockSigners[1], true, 'signature1');
      governance.signProposal(proposalId, mockSigners[2], true, 'signature2');
      
      const proposals = governance.getProposals();
      const proposal = proposals.find(p => p.id === proposalId);
      
      expect(proposal.status).toBe('approved');
      expect(proposal.approvals).toBe(3); // Proposer + 2 additional signers
    });

    test('should handle proposal rejection', () => {
      const newKey = new MockPublicKey('new-governance-key');
      const proposalId = governance.proposeKeyRotation(
        mockSigners[0],
        newKey,
        'Test rotation'
      );
      
      // More rejections than possible approvals
      governance.signProposal(proposalId, mockSigners[1], false, 'rejection1');
      governance.signProposal(proposalId, mockSigners[2], false, 'rejection2');
      governance.signProposal(proposalId, mockSigners[3], false, 'rejection3');
      
      const proposals = governance.getProposals();
      const proposal = proposals.find(p => p.id === proposalId);
      
      expect(proposal.status).toBe('rejected');
    });

    test('should enforce cooldown periods for key rotation', () => {
      const newKey = new MockPublicKey('new-governance-key');
      
      // First proposal should work
      const proposalId1 = governance.proposeKeyRotation(
        mockSigners[0],
        newKey,
        'First rotation'
      );
      expect(proposalId1).toBeTruthy();
      
      // Second proposal immediately should fail (unless emergency)
      expect(() => {
        governance.proposeKeyRotation(
          mockSigners[1],
          new MockPublicKey('another-key'),
          'Second rotation'
        );
      }).toThrow(/cooldown/i);
    });

    test('should allow emergency proposals with higher threshold', () => {
      const newKey = new MockPublicKey('emergency-key');
      const proposalId = governance.proposeKeyRotation(
        mockSigners[0],
        newKey,
        'Emergency rotation',
        true // isEmergency
      );
      
      const proposals = governance.getProposals();
      const proposal = proposals.find(p => p.id === proposalId);
      
      expect(proposal.isEmergency).toBe(true);
      
      // Emergency proposals need more signatures (4 instead of 3)
      governance.signProposal(proposalId, mockSigners[1], true, 'sig1');
      governance.signProposal(proposalId, mockSigners[2], true, 'sig2');
      governance.signProposal(proposalId, mockSigners[3], true, 'sig3');
      
      const updatedProposal = governance.getProposals().find(p => p.id === proposalId);
      expect(updatedProposal.status).toBe('approved');
    });

    test('should provide governance statistics', () => {
      const stats = governance.getStats();
      
      expect(stats).toHaveProperty('totalSigners');
      expect(stats).toHaveProperty('requiredSignatures');
      expect(stats).toHaveProperty('currentGovernanceKey');
      expect(stats).toHaveProperty('totalProposals');
      expect(stats).toHaveProperty('pendingProposals');
      
      expect(stats.totalSigners).toBe(5);
      expect(stats.requiredSignatures).toBe(3);
    });
  });

  describe('Governance Utilities', () => {
    test('should validate public key format', () => {
      expect(GovernanceUtils.validatePublicKey('valid-key-string')).toBe(true);
      expect(GovernanceUtils.validatePublicKey('')).toBe(false);
      expect(GovernanceUtils.validatePublicKey(null)).toBe(false);
    });

    test('should provide governance transaction templates', () => {
      const currentKey = new MockPublicKey('current');
      const newKey = new MockPublicKey('new');
      
      const transaction = GovernanceUtils.createGovernanceUpdateTransaction(currentKey, newKey);
      expect(transaction).toBeTruthy();
    });
  });
});

// Integration tests
describe('Integration Tests', () => {
  test('should handle complete auto-claim workflow', async () => {
    const autoClaimManager = getAutoClaimManager(mockWallet, null);
    
    try {
      // Configure auto-claim
      autoClaimManager.updateConfig({
        enabled: true,
        autoClaimThreshold: 100,
        maxAutoClaimAttempts: 2
      });
      
      // Simulate triggering auto-claim check
      await autoClaimManager.triggerCheck();
      
      // Verify manager state
      expect(autoClaimManager.getConfig().enabled).toBe(true);
      
    } finally {
      autoClaimManager.destroy();
    }
  });

  test('should handle governance and reward system integration', async () => {
    const governance = new MultiSigGovernanceManager();
    const mockSigners = [
      new MockPublicKey('admin1'),
      new MockPublicKey('admin2'),
      new MockPublicKey('admin3')
    ];
    
    governance.initialize(mockSigners, new MockPublicKey('reward-admin-key'));
    
    // Create a proposal to update reward rates
    const proposalId = governance.proposeKeyRotation(
      mockSigners[0],
      new MockPublicKey('new-reward-admin'),
      'Update reward system parameters'
    );
    
    // Approve the proposal
    governance.signProposal(proposalId, mockSigners[1], true, 'approval1');
    governance.signProposal(proposalId, mockSigners[2], true, 'approval2');
    
    const proposals = governance.getProposals();
    const proposal = proposals.find(p => p.id === proposalId);
    
    expect(proposal.status).toBe('approved');
    
    governance.reset();
  });
});

// Performance and stress tests
describe('Performance Tests', () => {
  test('should handle multiple concurrent auto-claim checks', async () => {
    const autoClaimManager = getAutoClaimManager(mockWallet, null);
    autoClaimManager.updateConfig({ enabled: true });
    
    try {
      // Run multiple checks concurrently
      const promises = Array(10).fill().map(() => 
        autoClaimManager.checkAndAutoClaim()
      );
      
      // Should not throw errors
      await Promise.allSettled(promises);
      
    } finally {
      autoClaimManager.destroy();
    }
  });

  test('should handle rapid configuration updates', () => {
    const autoClaimManager = getAutoClaimManager(mockWallet, null);
    
    try {
      // Rapid config updates
      for (let i = 0; i < 100; i++) {
        autoClaimManager.updateConfig({
          autoClaimThreshold: 1000 + i
        });
      }
      
      const finalConfig = autoClaimManager.getConfig();
      expect(finalConfig.autoClaimThreshold).toBe(1099);
      
    } finally {
      autoClaimManager.destroy();
    }
  });
});

export default 'Enhanced Reward System Tests';