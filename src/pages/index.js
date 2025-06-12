import React, { useContext, Suspense } from 'react';
import { useSafeWallet } from '@/contexts/WalletContextProvider';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import ErrorBoundary directly since it's already loaded in _app.js
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load components with standard React lazy
const OfferCreation = React.lazy(() => import('@/components/OfferCreation'));
const OfferList = React.lazy(() => import('@/components/OfferList'));
const DisputeResolution = React.lazy(() => import('@/components/DisputeResolution'));
const UserProfile = React.lazy(() => import('@/components/UserProfile'));

export default function Home() {
  const { activeTab, network } = useContext(AppContext);
  const wallet = useSafeWallet();

  // Used to render components conditionally
  const content = () => {
    switch(activeTab) {
      case 'buy':
        return (
          <Suspense fallback={<div className="loading-offer-list">Loading offers...</div>}>
            <OfferList type="buy" />
          </Suspense>
        );
      case 'sell':
        return (
          <>
            <Suspense fallback={<div className="loading-offer-creation">Loading offer creation...</div>}>
              <OfferCreation />
            </Suspense>
            <Suspense fallback={<div className="loading-offer-list">Loading offers...</div>}>
              <OfferList type="sell" />
            </Suspense>
          </>
        );
      case 'myoffers':
        return (
          <Suspense fallback={<div className="loading-offer-list">Loading offers...</div>}>
            <OfferList type="my" />
          </Suspense>
        );
      case 'disputes':
        return (
          <Suspense fallback={<div className="loading-disputes">Loading disputes...</div>}>
            <DisputeResolution />
          </Suspense>
        );
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
            <Suspense fallback={<div className="loading-user-profile">Loading profile...</div>}>
              <UserProfile 
                wallet={wallet} 
                network={network} 
              />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <Suspense fallback={<div className="loading-offer-list">Loading offers...</div>}>
            <OfferList type="buy" />
          </Suspense>
        );
    }
  };

  return <>{content()}</>;
}
