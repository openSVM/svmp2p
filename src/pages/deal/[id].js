import React from 'react';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '../../utils/lazyLoading';

// Lazy load the deal component
const DealPage = createLazyComponent(
  () => import('../../components/DealPage'),
  {
    fallback: <div className="loading-deal">Loading deal...</div>,
    retryDelay: 1000,
    maxRetries: 3
  }
);

export default function Deal() {
  return <DealPage />;
}