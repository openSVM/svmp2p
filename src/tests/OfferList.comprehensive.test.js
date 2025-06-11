/**
 * Comprehensive tests for OfferList component
 * 
 * Tests for:
 * - Filtering functionality
 * - Sorting capabilities
 * - Offer actions (accept, view details)
 * - Error states and edge cases
 * - Performance with large datasets
 * - Accessibility features
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfferList from '../components/OfferList';

// Mock data for testing
const mockOffers = [
  {
    id: 'offer1',
    seller: '0x1234567890abcdef1234567890abcdef12345678',
    solAmount: 5.0,
    fiatAmount: 750.0,
    fiatCurrency: 'USD',
    paymentMethod: 'Bank Transfer',
    status: 'Active',
    timestamp: Date.now() - 3600000, // 1 hour ago
    rate: 150.0,
    minAmount: 100,
    maxAmount: 1000
  },
  {
    id: 'offer2',
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    solAmount: 2.5,
    fiatAmount: 375.0,
    fiatCurrency: 'USD',
    paymentMethod: 'PayPal',
    status: 'Active',
    timestamp: Date.now() - 7200000, // 2 hours ago
    rate: 150.0,
    minAmount: 50,
    maxAmount: 500
  },
  {
    id: 'offer3',
    seller: '0x7890abcdef1234567890abcdef1234567890abcd',
    solAmount: 1.0,
    fiatAmount: 140.0,
    fiatCurrency: 'EUR',
    paymentMethod: 'Venmo',
    status: 'Completed',
    timestamp: Date.now() - 10800000, // 3 hours ago
    rate: 140.0,
    minAmount: 25,
    maxAmount: 200
  },
  {
    id: 'offer4',
    seller: '0xdef1234567890abcdef1234567890abcdef1234',
    solAmount: 10.0,
    fiatAmount: 1500.0,
    fiatCurrency: 'USD',
    paymentMethod: 'Wire Transfer',
    status: 'Pending',
    timestamp: Date.now() - 14400000, // 4 hours ago
    rate: 150.0,
    minAmount: 200,
    maxAmount: 2000
  }
];

// Mock wallet context
const mockWalletContext = {
  connected: true,
  publicKey: { toString: () => '0x9876543210abcdef9876543210abcdef98765432' },
  connect: jest.fn(),
  disconnect: jest.fn()
};

jest.mock('../contexts/WalletContextProvider', () => ({
  useSafeWallet: () => mockWalletContext
}));

// Mock confirmation dialog
jest.mock('../components/common/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onCancel, title, message }) => 
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-btn">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
      </div>
    ) : null
}));

// Mock tooltip component
jest.mock('../components/common/Tooltip', () => ({
  __esModule: true,
  default: ({ children, content }) => (
    <div data-tooltip={content}>
      {children}
    </div>
  )
}));

describe('OfferList Component', () => {
  const defaultProps = {
    offers: mockOffers,
    onAcceptOffer: jest.fn(),
    onViewOfferDetails: jest.fn(),
    onRefresh: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render offer list with offers', () => {
      render(<OfferList {...defaultProps} />);
      
      expect(screen.getByText('Available Offers')).toBeInTheDocument();
      expect(screen.getAllByTestId(/offer-item-/)).toHaveLength(4);
    });

    test('should display empty state when no offers', () => {
      render(<OfferList {...defaultProps} offers={[]} />);
      
      expect(screen.getByText('No offers available')).toBeInTheDocument();
    });

    test('should show loading state', () => {
      render(<OfferList {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading offers...')).toBeInTheDocument();
    });

    test('should display error state', () => {
      const error = 'Failed to load offers';
      render(<OfferList {...defaultProps} error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    test('should filter by currency', async () => {
      render(<OfferList {...defaultProps} />);
      
      const currencyFilter = screen.getByLabelText('Currency');
      fireEvent.change(currencyFilter, { target: { value: 'EUR' } });
      
      await waitFor(() => {
        const visibleOffers = screen.getAllByTestId(/offer-item-/);
        expect(visibleOffers).toHaveLength(1);
        expect(screen.getByText('EUR')).toBeInTheDocument();
      });
    });

    test('should filter by payment method', async () => {
      render(<OfferList {...defaultProps} />);
      
      const paymentFilter = screen.getByLabelText('Payment Method');
      fireEvent.change(paymentFilter, { target: { value: 'PayPal' } });
      
      await waitFor(() => {
        const visibleOffers = screen.getAllByTestId(/offer-item-/);
        expect(visibleOffers).toHaveLength(1);
        expect(screen.getByText('PayPal')).toBeInTheDocument();
      });
    });

    test('should filter by status', async () => {
      render(<OfferList {...defaultProps} />);
      
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'Active' } });
      
      await waitFor(() => {
        const visibleOffers = screen.getAllByTestId(/offer-item-/);
        expect(visibleOffers).toHaveLength(2); // offer1 and offer2
      });
    });

    test('should filter by amount range', async () => {
      render(<OfferList {...defaultProps} />);
      
      const minAmountFilter = screen.getByLabelText('Min Amount');
      const maxAmountFilter = screen.getByLabelText('Max Amount');
      
      fireEvent.change(minAmountFilter, { target: { value: '200' } });
      fireEvent.change(maxAmountFilter, { target: { value: '800' } });
      
      await waitFor(() => {
        const visibleOffers = screen.getAllByTestId(/offer-item-/);
        expect(visibleOffers).toHaveLength(1); // Only offer1 (750 USD)
      });
    });

    test('should combine multiple filters', async () => {
      render(<OfferList {...defaultProps} />);
      
      const currencyFilter = screen.getByLabelText('Currency');
      const statusFilter = screen.getByLabelText('Status');
      
      fireEvent.change(currencyFilter, { target: { value: 'USD' } });
      fireEvent.change(statusFilter, { target: { value: 'Active' } });
      
      await waitFor(() => {
        const visibleOffers = screen.getAllByTestId(/offer-item-/);
        expect(visibleOffers).toHaveLength(2); // offer1 and offer2
      });
    });

    test('should clear filters', async () => {
      render(<OfferList {...defaultProps} />);
      
      // Apply filter
      const currencyFilter = screen.getByLabelText('Currency');
      fireEvent.change(currencyFilter, { target: { value: 'EUR' } });
      
      await waitFor(() => {
        expect(screen.getAllByTestId(/offer-item-/)).toHaveLength(1);
      });
      
      // Clear filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getAllByTestId(/offer-item-/)).toHaveLength(4);
      });
    });
  });

  describe('Sorting Functionality', () => {
    test('should sort by amount ascending', async () => {
      render(<OfferList {...defaultProps} />);
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'amount_asc' } });
      
      await waitFor(() => {
        const offers = screen.getAllByTestId(/offer-item-/);
        const firstOfferAmount = offers[0].textContent;
        expect(firstOfferAmount).toContain('1.0'); // offer3 has smallest amount
      });
    });

    test('should sort by amount descending', async () => {
      render(<OfferList {...defaultProps} />);
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'amount_desc' } });
      
      await waitFor(() => {
        const offers = screen.getAllByTestId(/offer-item-/);
        const firstOfferAmount = offers[0].textContent;
        expect(firstOfferAmount).toContain('10.0'); // offer4 has largest amount
      });
    });

    test('should sort by rate', async () => {
      render(<OfferList {...defaultProps} />);
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'rate_asc' } });
      
      await waitFor(() => {
        const offers = screen.getAllByTestId(/offer-item-/);
        const firstOfferRate = offers[0].textContent;
        expect(firstOfferRate).toContain('140'); // offer3 has lowest rate
      });
    });

    test('should sort by timestamp', async () => {
      render(<OfferList {...defaultProps} />);
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'timestamp_desc' } });
      
      await waitFor(() => {
        const offers = screen.getAllByTestId(/offer-item-/);
        // First offer should be the most recent (offer1)
        expect(offers[0]).toHaveAttribute('data-testid', 'offer-item-offer1');
      });
    });
  });

  describe('Offer Actions', () => {
    test('should accept offer with confirmation', async () => {
      render(<OfferList {...defaultProps} />);
      
      const acceptButton = screen.getAllByText('Accept')[0];
      fireEvent.click(acceptButton);
      
      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      // Confirm the action
      fireEvent.click(screen.getByTestId('confirm-btn'));
      
      expect(defaultProps.onAcceptOffer).toHaveBeenCalledWith(mockOffers[0]);
    });

    test('should cancel offer acceptance', async () => {
      render(<OfferList {...defaultProps} />);
      
      const acceptButton = screen.getAllByText('Accept')[0];
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      // Cancel the action
      fireEvent.click(screen.getByTestId('cancel-btn'));
      
      expect(defaultProps.onAcceptOffer).not.toHaveBeenCalled();
    });

    test('should view offer details', async () => {
      render(<OfferList {...defaultProps} />);
      
      const viewButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewButton);
      
      expect(defaultProps.onViewOfferDetails).toHaveBeenCalledWith(mockOffers[0]);
    });

    test('should disable accept button for own offers', () => {
      const offersWithOwnOffer = [
        {
          ...mockOffers[0],
          seller: mockWalletContext.publicKey.toString()
        }
      ];
      
      render(<OfferList {...defaultProps} offers={offersWithOwnOffer} />);
      
      const acceptButton = screen.getByText('Accept');
      expect(acceptButton).toBeDisabled();
    });

    test('should disable accept button when not connected', () => {
      const disconnectedWalletContext = {
        ...mockWalletContext,
        connected: false,
        publicKey: null
      };
      
      jest.doMock('../contexts/WalletContextProvider', () => ({
        useSafeWallet: () => disconnectedWalletContext
      }));
      
      render(<OfferList {...defaultProps} />);
      
      const acceptButtons = screen.getAllByText('Accept');
      acceptButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<OfferList {...defaultProps} />);
      
      expect(screen.getByLabelText('Currency')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Method')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(<OfferList {...defaultProps} />);
      
      const acceptButton = screen.getAllByText('Accept')[0];
      acceptButton.focus();
      
      expect(document.activeElement).toBe(acceptButton);
      
      // Tab to next focusable element
      fireEvent.keyDown(acceptButton, { key: 'Tab' });
    });

    test('should have tooltips for help information', () => {
      render(<OfferList {...defaultProps} />);
      
      const tooltipElements = screen.getAllByText('?');
      expect(tooltipElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', () => {
      const largeOfferSet = Array.from({ length: 1000 }, (_, index) => ({
        ...mockOffers[0],
        id: `offer${index}`,
        fiatAmount: 100 + index,
        timestamp: Date.now() - index * 1000
      }));
      
      const renderStart = performance.now();
      render(<OfferList {...defaultProps} offers={largeOfferSet} />);
      const renderEnd = performance.now();
      
      // Should render within reasonable time (less than 1 second)
      expect(renderEnd - renderStart).toBeLessThan(1000);
    });

    test('should virtualize long lists', () => {
      const largeOfferSet = Array.from({ length: 100 }, (_, index) => ({
        ...mockOffers[0],
        id: `offer${index}`
      }));
      
      render(<OfferList {...defaultProps} offers={largeOfferSet} />);
      
      // Should not render all items at once (virtual scrolling)
      const renderedItems = screen.getAllByTestId(/offer-item-/);
      expect(renderedItems.length).toBeLessThan(largeOfferSet.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid offer data gracefully', () => {
      const invalidOffers = [
        { id: 'invalid1' }, // Missing required fields
        { id: 'invalid2', seller: null }, // Null seller
        { id: 'invalid3', fiatAmount: 'invalid' } // Invalid amount
      ];
      
      expect(() => {
        render(<OfferList {...defaultProps} offers={invalidOffers} />);
      }).not.toThrow();
    });

    test('should handle network errors during actions', async () => {
      const failingOnAccept = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(<OfferList {...defaultProps} onAcceptOffer={failingOnAccept} />);
      
      const acceptButton = screen.getAllByText('Accept')[0];
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('confirm-btn'));
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText(/Error accepting offer/)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('should refresh offers when refresh button clicked', () => {
      render(<OfferList {...defaultProps} />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    test('should show refresh loading state', () => {
      render(<OfferList {...defaultProps} loading={true} />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<OfferList {...defaultProps} />);
      
      // Should show mobile-optimized layout
      const container = screen.getByTestId('offer-list-container');
      expect(container).toHaveClass('mobile-layout');
    });

    test('should show/hide filters on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<OfferList {...defaultProps} />);
      
      const filterToggle = screen.getByText('Filters');
      fireEvent.click(filterToggle);
      
      expect(screen.getByTestId('filter-panel')).toBeVisible();
    });
  });
});