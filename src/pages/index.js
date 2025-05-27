import React, { useContext } from 'react';
import dynamic from 'next/dynamic';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Dynamically import components that need client-side only rendering
const OfferCreation = dynamic(() => import('@/components/OfferCreation'), { ssr: false });
const OfferList = dynamic(() => import('@/components/OfferList'), { ssr: false });
const DisputeResolution = dynamic(() => import('@/components/DisputeResolution'), { ssr: false });
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });

export default function Home() {
  const { activeTab } = useContext(AppContext);

  return (
    <>
      {activeTab === 'buy' && <OfferList type="buy" />}
      {activeTab === 'sell' && (
        <>
          <OfferCreation />
          <OfferList type="sell" />
        </>
      )}
      {activeTab === 'myoffers' && <OfferList type="my" />}
      {activeTab === 'disputes' && <DisputeResolution />}
      {activeTab === 'profile' && <UserProfile />}
    </>
  );
}
