import React, { useContext } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

// Import context
import { AppContext } from '@/contexts/AppContext';

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
        // Ensure we're passing a non-null wallet object to prevent errors
        return <UserProfile wallet={wallet || {}} network={network || {}} />;
      default:
        return <OfferList type="buy" />;
    }
  };

  return <>{content()}</>;
}
