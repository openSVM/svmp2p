import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockLocalStorage } from '../utils/test-utils';
import OfferCreation from '../../components/OfferCreation';

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

describe('OfferCreation Component', () => {
  beforeEach(() => {
    mockLocalStorage();
    jest.clearAllMocks();
  });

  test('renders the offer creation form', () => {
    renderWithProviders(<OfferCreation />);
    
    expect(screen.getByText(/Create New Offer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Offer/i })).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OfferCreation />);
    
    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /Create Offer/i }));
    
    // Check for validation errors
    expect(screen.getByText(/Amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Price is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment method is required/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    
    renderWithProviders(<OfferCreation onSubmit={handleSubmit} />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/Amount/i), '100');
    await user.type(screen.getByLabelText(/Price/i), '50');
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['bank_transfer']);
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Create Offer/i }));
    
    // Check if form submission handler was called with correct data
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '100',
          price: '50',
          paymentMethod: 'bank_transfer'
        })
      );
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithProviders(<OfferCreation onSubmit={handleSubmit} />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/Amount/i), '100');
    await user.type(screen.getByLabelText(/Price/i), '50');
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['bank_transfer']);
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Create Offer/i }));
    
    // Check loading state
    expect(screen.getByTestId('button-loader')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('button-loader')).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  test('handles submission errors', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn(() => Promise.reject(new Error('Submission failed')));
    
    renderWithProviders(<OfferCreation onSubmit={handleSubmit} />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/Amount/i), '100');
    await user.type(screen.getByLabelText(/Price/i), '50');
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), ['bank_transfer']);
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Create Offer/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Submission failed/i)).toBeInTheDocument();
    });
  });
});
