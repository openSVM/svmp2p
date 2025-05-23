import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import OfferList from '../../components/OfferList';

// Mock performance utils
jest.mock('../../utils/performance', () => ({
  useDebounce: (value) => value,
  VirtualizedList: ({ items, renderItem }) => (
    <div data-testid="virtualized-list">
      {items.map((item, i) => (
        <div key={i}>{renderItem(item, i)}</div>
      ))}
    </div>
  )
}));

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

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock data
const mockOffers = [
  {
    id: '1',
    solAmount: 1.5,
    fiatAmount: 225,
    fiatCurrency: 'USD',
    paymentMethod: 'Bank Transfer',
    seller: '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3',
    status: 'Listed',
    createdAt: Date.now() - 3600000
  },
  {
    id: '2',
    solAmount: 2.0,
    fiatAmount: 300,
    fiatCurrency: 'USD',
    paymentMethod: 'PayPal',
    seller: '8FnkznYpHvfX3FC5HqVWyVmhwwmKQNxFhWP9wZQC2uJU',
    status: 'Listed',
    createdAt: Date.now() - 7200000
  }
];

describe('OfferList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
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
    expect(screen.getByText('1.50 SOL')).toBeInTheDocument();
    expect(screen.getByText('225.00 USD')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    
    expect(screen.getByText('2.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('300.00 USD')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  test('filters offers by payment method', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Show filters
    await user.click(screen.getByText('Show Filters'));
    
    // Select payment method filter
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['PayPal']);
    
    // Check if only matching offers are displayed
    expect(screen.queryByText('Bank Transfer')).not.toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  test('sorts offers', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Select sort by SOL Amount
    await user.selectOptions(screen.getByLabelText(/Sort by/i), ['solAmount']);
    
    // Check if offers are sorted (should be automatically in descending order first)
    const solAmounts = screen.getAllByText(/SOL/, { exact: false });
    expect(solAmounts[0].textContent).toContain('2.00 SOL');
    expect(solAmounts[1].textContent).toContain('1.50 SOL');
    
    // Click sort direction button to change to ascending
    await user.click(screen.getByLabelText('Toggle sort direction'));
    
    // Check if offers are sorted in reverse
    const reversedSolAmounts = screen.getAllByText(/SOL/, { exact: false });
    expect(reversedSolAmounts[0].textContent).toContain('1.50 SOL');
    expect(reversedSolAmounts[1].textContent).toContain('2.00 SOL');
  });

  test('saves and loads searches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Show filters
    await user.click(screen.getByText('Show Filters'));
    
    // Set a filter
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['PayPal']);
    
    // Save the search
    await user.type(screen.getByPlaceholderText('Name this search'), 'PayPal Only');
    await user.click(screen.getByText('Save'));
    
    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Reset filters
    await user.click(screen.getByText('Reset Filters'));
    
    // Check that both offers are visible again
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
    
    // Load the saved search
    await user.click(screen.getByText('PayPal Only'));
    
    // Verify filter is applied
    expect(screen.queryByText('Bank Transfer')).not.toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  test('handles pagination', async () => {
    // Mock many offers to test pagination
    const manyOffers = Array.from({ length: 8 }, (_, i) => ({
      id: `${i + 1}`,
      solAmount: i + 1,
      fiatAmount: (i + 1) * 150,
      fiatCurrency: 'USD',
      paymentMethod: i % 2 === 0 ? 'Bank Transfer' : 'PayPal',
      seller: `seller${i}`,
      status: 'Listed',
      createdAt: Date.now() - (i * 3600000)
    }));
    
    // Override the fetchOffers mock
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ offers: manyOffers }),
        ok: true,
      })
    );
    
    const user = userEvent.setup();
    renderWithProviders(<OfferList />);
    
    // Wait for offers to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Only first 5 offers should be visible (default items per page)
    expect(screen.getByText('1.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument();
    expect(screen.queryByText('6.00 SOL')).not.toBeInTheDocument();
    
    // Navigate to next page
    await user.click(screen.getByLabelText('Next page'));
    
    // Now offers 6-8 should be visible
    expect(screen.queryByText('1.00 SOL')).not.toBeInTheDocument();
    expect(screen.getByText('6.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('8.00 SOL')).toBeInTheDocument();
  });

  test('handles empty offers list', async () => {
    // Mock empty offers list
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ offers: [] }),
        ok: true,
      })
    );
    
    renderWithProviders(<OfferList />);
    
    // Wait for no offers message
    await waitFor(() => {
      expect(screen.getByText(/No offers found matching your criteria/i)).toBeInTheDocument();
    });
  });
});
