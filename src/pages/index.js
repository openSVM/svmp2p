import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import ErrorBoundary
const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), { ssr: false });

// Dynamically import components that need client-side only rendering
const OfferCreation = dynamic(() => import('@/components/OfferCreation'), { ssr: false });
const OfferList = dynamic(() => import('@/components/OfferList'), { ssr: false });
const DisputeResolution = dynamic(() => import('@/components/DisputeResolution'), { ssr: false });
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });

export default function Home() {
  const { activeTab, network } = useContext(AppContext);
  const wallet = useWallet();

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
      case 'profile':
        // Ensure wallet is always an object with expected properties to prevent errors
        const safeWallet = wallet || {};
        const safeNetwork = network || {};
        
        console.log('Rendering UserProfile with wallet:', 
          safeWallet ? 'wallet object exists' : 'wallet is null/undefined',
          safeWallet && safeWallet.publicKey ? 'publicKey exists' : 'publicKey is null/undefined'
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
              wallet={safeWallet} 
              network={safeNetwork} 
            />
          </ErrorBoundary>
        );
      default:
        return <OfferList type="buy" />;
    }
  };

  return <>{content()}</>;
}
