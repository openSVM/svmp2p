import React from 'react';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load components
const DisputeResolution = createLazyComponent(
  () => import('@/components/DisputeResolution'),
  {
    fallback: <div className="loading-disputes">Loading disputes...</div>
  }
);

export default function DisputesPage() {
  return <DisputeResolution />;
}