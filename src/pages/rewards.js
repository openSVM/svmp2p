import React from 'react';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load components
const RewardDashboard = createLazyComponent(
  () => import('@/components/RewardDashboard'),
  {
    fallback: <div className="loading-rewards">Loading rewards...</div>
  }
);

export default function RewardsPage() {
  return <RewardDashboard />;
}