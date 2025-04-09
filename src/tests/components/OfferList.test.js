import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import OfferList from '../../components/OfferList';

// Mock components
jest.mock('../../components/common/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('../../components/common/TransactionStatus', () => ({
  __esModule: true,
  default: ({ status, message }) => (
    <div data-testid="transaction-status" data-status={status}>
      {message}
    </div>
  )
}));

// Mock data
const mockOffers = [
  {
    id: '1',
    amount: '100',
    price: '50',
    paymentMethod: 'bank_transfer',
    seller: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
    status: 'active'
  },
  {
    id: '2',
    amount: '200',
    price: '75',
    paymentMethod: 'paypal',
    seller: '8FnkznYpHvfX3FC5HqVWyVmhwwmKQNxFhWP9wZQC2uJU',
    status: 'active'
  }
];

describe('OfferList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for offers
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ offers: mockOffers }),
        ok: true,
      })
    );
  });

  test('renders loading state initially', () => {
    renderWithProviders(<OfferList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders offers after loading', async () => {
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check if offers are rendered
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('bank_transfer')).toBeInTheDocument();
    
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('paypal')).toBeInTheDocument();
  });

  test('filters offers by payment method', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Select payment method filter
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['paypal']);
    
    // Check if only matching offers are displayed
    expect(screen.queryByText('bank_transfer')).not.toBeInTheDocument();
    expect(screen.getByText('paypal')).toBeInTheDocument();
  });

  test('sorts offers by price', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Click sort by price button
    await user.click(screen.getByText(/Sort by Price/i));
    
    // Check if offers are sorted
    const priceElements = screen.getAllByText(/\d+/, { selector: '.price' });
    expect(priceElements[0].textContent).toBe('50');
    expect(priceElements[1].textContent).toBe('75');
    
    // Click again to reverse sort
    await user.click(screen.getByText(/Sort by Price/i));
    
    // Check if offers are sorted in reverse
    const reversedPriceElements = screen.getAllByText(/\d+/, { selector: '.price' });
    expect(reversedPriceElements[0].textContent).toBe('75');
    expect(reversedPriceElements[1].textContent).toBe('50');
  });

  test('handles offer selection', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();
    
    renderWithProviders(<OfferList onSelectOffer={handleSelect} />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Click on an offer
    await user.click(screen.getAllByRole('button', { name: /View Offer/i })[0]);
    
    // Check if selection handler was called with correct offer
    expect(handleSelect).toHaveBeenCalledWith(mockOffers[0]);
  });

  test('handles fetch error', async () => {
    // Mock fetch error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.reject(new Error('Failed to fetch offers')),
        ok: false,
      })
    );
    
    renderWithProviders(<OfferList />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch offers/i)).toBeInTheDocument();
    });
  });

  test('handles empty offers list', async () => {
    // Mock empty offers list
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ offers: [] }),
        ok: true,
      })
    );
    
    renderWithProviders(<OfferList />);
    
    // Wait for no offers message
    await waitFor(() => {
      expect(screen.getByText(/No offers available/i)).toBeInTheDocument();
    });
  });
});
