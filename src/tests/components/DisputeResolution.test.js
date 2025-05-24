import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import DisputeResolution from '../../components/DisputeResolution';

// Mock components
jest.mock('../../components/common/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('../../components/common/ButtonLoader', () => ({
  __esModule: true,
  default: ({ children, loading }) => (
    <button disabled={loading} data-testid="button-loader">
      {loading ? 'Loading...' : children}
    </button>
  )
}));

// Mock data
const mockDisputes = [
  {
    id: '1',
    transactionId: 'tx123',
    reason: 'Payment not received',
    status: 'open',
    createdAt: '2025-04-01T10:00:00Z',
    evidence: [],
    buyer: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
    seller: '8FnkznYpHvfX3FC5HqVWyVmhwwmKQNxFhWP9wZQC2uJU'
  },
  {
    id: '2',
    transactionId: 'tx456',
    reason: 'Item not as described',
    status: 'under_review',
    createdAt: '2025-04-02T15:30:00Z',
    evidence: ['evidence1.jpg', 'evidence2.jpg'],
    buyer: '8FnkznYpHvfX3FC5HqVWyVmhwwmKQNxFhWP9wZQC2uJU',
    seller: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3'
  }
];

describe('DisputeResolution Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for disputes
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ disputes: mockDisputes }),
        ok: true,
      })
    );
  });

  test('renders loading state initially', () => {
    renderWithProviders(<DisputeResolution />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders disputes after loading', async () => {
    renderWithProviders(<DisputeResolution />);
    
    // Wait for disputes to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check if disputes are rendered
    expect(screen.getByText('Payment not received')).toBeInTheDocument();
    expect(screen.getByText('Item not as described')).toBeInTheDocument();
    expect(screen.getByText('tx123')).toBeInTheDocument();
    expect(screen.getByText('tx456')).toBeInTheDocument();
  });

  test('filters disputes by status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DisputeResolution />);
    
    // Wait for disputes to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Select status filter
    await user.selectOptions(screen.getByLabelText(/Status/i), ['open']);
    
    // Check if only matching disputes are displayed
    expect(screen.getByText('Payment not received')).toBeInTheDocument();
    expect(screen.queryByText('Item not as described')).not.toBeInTheDocument();
  });

  test('opens dispute details when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DisputeResolution />);
    
    // Wait for disputes to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Click on a dispute
    await user.click(screen.getByText('Payment not received'));
    
    // Check if dispute details are displayed
    expect(screen.getByText(/Dispute Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction ID: tx123/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: open/i)).toBeInTheDocument();
  });

  test('allows submitting evidence', async () => {
    const user = userEvent.setup();
    const handleSubmitEvidence = jest.fn();
    
    renderWithProviders(<DisputeResolution onSubmitEvidence={handleSubmitEvidence} />);
    
    // Wait for disputes to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Click on a dispute
    await user.click(screen.getByText('Payment not received'));
    
    // Fill evidence form
    await user.type(screen.getByLabelText(/Evidence Description/i), 'Payment receipt');
    
    // Mock file input
    const file = new File(['file content'], 'receipt.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/Upload Evidence/i), file);
    
    // Submit evidence
    await user.click(screen.getByRole('button', { name: /Submit Evidence/i }));
    
    // Check if evidence submission handler was called with correct data
    expect(handleSubmitEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        disputeId: '1',
        description: 'Payment receipt',
        file
      })
    );
  });

  test('handles fetch error', async () => {
    // Mock fetch error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.reject(new Error('Failed to fetch disputes')),
        ok: false,
      })
    );
    
    renderWithProviders(<DisputeResolution />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch disputes/i)).toBeInTheDocument();
    });
  });

  test('handles empty disputes list', async () => {
    // Mock empty disputes list
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ disputes: [] }),
        ok: true,
      })
    );
    
    renderWithProviders(<DisputeResolution />);
    
    // Wait for no disputes message
    await waitFor(() => {
      expect(screen.getByText(/No disputes found/i)).toBeInTheDocument();
    });
  });
});
