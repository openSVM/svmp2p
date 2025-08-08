import React from 'react';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load components
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

export default function SellPage() {
  return (
    <>
      <OfferCreation />
      <OfferList type="sell" />
    </>
  );
}