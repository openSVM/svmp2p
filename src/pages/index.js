import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { useSafeWallet } from '@/contexts/WalletContextProvider';
import { createLazyComponent, useIdlePreloader } from '@/utils/lazyLoading';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Create optimized lazy components with enhanced loading
const ErrorBoundary = createLazyComponent(
  () => import('@/components/ErrorBoundary'),
  { 
    fallback: <div className="loading-error-boundary">Loading...</div>,
    preload: true 
  }
);

// Lazy load components with intersection observer for better performance
const OfferCreation = createLazyComponent(
  () => import('@/components/OfferCreation'),
  {
    fallback: <div className="loading-offer-creation">Loading offer creation...</div>,
    retryDelay: 1000,
    maxRetries: 3
  }
);

const OfferList = createLazyComponent(
  () => import('@/components/OfferList'),
  {
    fallback: <div className="loading-offer-list">Loading offers...</div>,
    retryDelay: 1000,
    maxRetries: 3
  }
);

const DisputeResolution = createLazyComponent(
  () => import('@/components/DisputeResolution'),
  {
    fallback: <div className="loading-disputes">Loading disputes...</div>
  }
);

const UserProfile = createLazyComponent(
  () => import('@/components/UserProfile'),
  {
    fallback: <div className="loading-profile">Loading profile...</div>
  }
);

const RewardDashboard = createLazyComponent(
  () => import('@/components/RewardDashboard'),
  {
    fallback: <div className="loading-rewards">Loading rewards...</div>
  }
);

export default function Home() {
  const { activeTab, network } = useContext(AppContext);
  const wallet = useSafeWallet();

  // Preload components during idle time
  useIdlePreloader([
    () => import('@/components/OfferCreation'),
    () => import('@/components/DisputeResolution'),
    () => import('@/components/UserProfile'),
    () => import('@/components/RewardDashboard'),
  ]);

  // Used to render components conditionally
  const content = () => {
    switch(activeTab) {
      case 'buy':
        return <OfferList type="buy" />;
      case 'sell':
        return (
          <>
            <OfferCreation />
            <OfferList type="sell" />
          </>
        );
      case 'myoffers':
        return <OfferList type="my" />;
      case 'disputes':
        return <DisputeResolution />;
      case 'rewards':
        return <RewardDashboard />;
      case 'profile':
        // Ensure wallet object is properly checked and handled
        console.log('Rendering UserProfile with wallet:', 
          wallet !== null && wallet !== undefined ? 'wallet object exists' : 'wallet is null/undefined',
          wallet?.publicKey ? 'publicKey exists' : 'publicKey is null/undefined'
        );
        
        // Wrap UserProfile in ErrorBoundary to catch and handle any rendering errors
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
            />
          </ErrorBoundary>
        );
      default:
        return <OfferList type="buy" />;
    }
  };

  return <>{content()}</>;
}
