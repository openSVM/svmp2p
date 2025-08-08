import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '@/utils/lazyLoading';
import { AppContext } from '@/contexts/AppContext';
import { useSafeWallet } from '@/contexts/WalletContextProvider';

// Lazy load components
const ErrorBoundary = createLazyComponent(
  () => import('@/components/ErrorBoundary'),
  { 
    fallback: <div className="loading-error-boundary">Loading...</div>,
    preload: true 
  }
);

const UserProfile = createLazyComponent(
  () => import('@/components/UserProfile'),
  {
    fallback: <div className="loading-profile">Loading profile...</div>
  }
);

export default function ProfilePage() {
  const router = useRouter();
  const { network } = useContext(AppContext);
  const wallet = useSafeWallet();
  
  // Get tab from query parameter, default to 'overview'
  const tab = router.query.tab || 'overview';

  // Update URL when tab changes (this will be handled by the UserProfile component)
  const handleTabChange = (newTab) => {
    // Update URL without causing a page reload
    router.push({
      pathname: '/profile',
      query: newTab !== 'overview' ? { tab: newTab } : {}
    }, undefined, { shallow: true });
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h3>There was an error loading the profile</h3>
          <p>Please make sure your wallet is connected and try again.</p>
          <button 
            className="button button-primary" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      }
      showReset={true}
    >
      <UserProfile 
        wallet={wallet} 
        network={network}
        initialTab={tab}
        onTabChange={handleTabChange}
      />
    </ErrorBoundary>
  );
}