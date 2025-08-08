import React from 'react';
import dynamic from 'next/dynamic';
import { createLazyComponent } from '@/utils/lazyLoading';

// Lazy load components
const AnalyticsDashboard = createLazyComponent(
  () => import('@/components/AnalyticsDashboard'),
  {
    fallback: <div className="loading-analytics">Loading analytics...</div>
  }
);

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}