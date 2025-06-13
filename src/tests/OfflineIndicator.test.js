/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineIndicator from '../components/OfflineIndicator';
import { useOfflineState } from '../hooks/useOfflineState';

// Mock the offline state hook
jest.mock('../hooks/useOfflineState');

describe('OfflineIndicator Component', () => {
  let mockUseOfflineState;

  beforeEach(() => {
    mockUseOfflineState = useOfflineState;
    jest.clearAllMocks();
  });

  test('should not render when online and idle', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: false,
      syncStatus: 'idle',
      getQueueSize: () => 0
    });

    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  test('should render offline indicator when offline', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: true,
      syncStatus: 'idle',
      getQueueSize: () => 0
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByLabelText("You're offline")).toHaveAttribute('aria-live', 'polite');
  });

  test('should show queue count when offline with pending items', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: true,
      syncStatus: 'idle',
      getQueueSize: () => 3
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByText('3', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('pending', { exact: false })).toBeInTheDocument();
  });

  test('should render syncing indicator when syncing', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: false,
      syncStatus: 'syncing',
      getQueueSize: () => 0
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.getByLabelText('Syncing...')).toHaveAttribute('aria-live', 'polite');
  });

  test('should render success indicator when sync completes', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: false,
      syncStatus: 'success',
      getQueueSize: () => 0
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByLabelText('Synced')).toHaveAttribute('aria-live', 'polite');
  });

  test('should apply custom className', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: true,
      syncStatus: 'idle',
      getQueueSize: () => 0
    });

    const { container } = render(<OfflineIndicator className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('should have proper accessibility attributes', () => {
    mockUseOfflineState.mockReturnValue({
      isOffline: true,
      syncStatus: 'idle',
      getQueueSize: () => 2
    });

    render(<OfflineIndicator />);
    
    const indicator = screen.getByLabelText("You're offline");
    expect(indicator).toHaveAttribute('aria-live', 'polite');
  });

  test('should handle different sync statuses correctly', () => {
    // Test error status (if implemented)
    mockUseOfflineState.mockReturnValue({
      isOffline: false,
      syncStatus: 'error',
      getQueueSize: () => 0
    });

    const { container } = render(<OfflineIndicator />);
    
    // Should not render anything for error status in current implementation
    expect(container.firstChild).toBeNull();
  });
});