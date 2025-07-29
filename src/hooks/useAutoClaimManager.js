/**
 * React Hook for Auto-Claim Manager
 * 
 * Provides React hook interface for the AutoClaimManager class
 */

import { useEffect } from 'react';
import { getAutoClaimManager } from '../utils/autoClaimManager';

/**
 * React hook for using auto-claim manager
 */
export const useAutoClaimManager = (wallet, connection) => {
  const manager = getAutoClaimManager(wallet, connection);
  
  // Auto-start if enabled
  useEffect(() => {
    if (manager.getConfig().enabled && !manager.isRunning && wallet?.connected) {
      manager.start();
    }
    
    return () => {
      if (manager.isRunning) {
        manager.stop();
      }
    };
  }, [manager, wallet?.connected]);
  
  return manager;
};

export default useAutoClaimManager;