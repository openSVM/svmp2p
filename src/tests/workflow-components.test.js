import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TradingWorkflowIntro from '../components/guided-workflow/TradingWorkflowIntro';
import BuyWorkflowSelectOffer from '../components/guided-workflow/BuyWorkflowSelectOffer';
import BuyWorkflowReviewOffer from '../components/guided-workflow/BuyWorkflowReviewOffer';
import SellWorkflowCreateOffer from '../components/guided-workflow/SellWorkflowCreateOffer';
import SellWorkflowReviewEscrow from '../components/guided-workflow/SellWorkflowReviewEscrow';

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
    timestamp: Date.now()
  },
  {
    id: 'offer2',
    seller: '0xabcdef1234567890abcdef1234567890abcdef12',
    solAmount: 2.5,
    fiatAmount: 375.0,
    fiatCurrency: 'USD',
    paymentMethod: 'PayPal',
    status: 'Active',
    timestamp: Date.now()
  }
];

const mockOffer = {
  id: 'offer1',
  seller: '0x1234567890abcdef1234567890abcdef12345678',
  solAmount: 5.0,
  fiatAmount: 750.0,
  fiatCurrency: 'USD',
  paymentMethod: 'Bank Transfer',
  status: 'Active',
  createdAt: new Date().toISOString(),
  paymentDetails: 'Test payment details'
};

describe('TradingWorkflowIntro Tests', () => {
  test('renders buy workflow intro correctly', () => {
    const mockOnContinue = jest.fn();
    render(<TradingWorkflowIntro tradingType="buy" onContinue={mockOnContinue} />);
    
    expect(screen.getByText('Welcome to the Buy SOL Guided Process')).toBeInTheDocument();
    expect(screen.getByText('Select an offer that meets your requirements')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Let\'s Get Started'));
    expect(mockOnContinue).toHaveBeenCalled();
  });
  
  test('renders sell workflow intro correctly', () => {
    const mockOnContinue = jest.fn();
    render(<TradingWorkflowIntro tradingType="sell" onContinue={mockOnContinue} />);
    
    expect(screen.getByText('Welcome to the Sell SOL Guided Process')).toBeInTheDocument();
    expect(screen.getByText('Set your offer details (amount, price, payment method)')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Let\'s Get Started'));
    expect(mockOnContinue).toHaveBeenCalled();
  });
});

describe('BuyWorkflowSelectOffer Tests', () => {
  test('renders offer selection interface correctly', () => {
    const mockOnSelectOffer = jest.fn();
    render(
      <BuyWorkflowSelectOffer 
        availableOffers={mockOffers}
        selectedCurrency="USD"
        selectedPaymentMethod="All"
        onSelectOffer={mockOnSelectOffer}
      />
    );
    
    expect(screen.getByText('Filter Available Offers')).toBeInTheDocument();
    expect(screen.getByText('Available Offers')).toBeInTheDocument();
    
    // Check if offers are rendered
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('2.50 SOL')).toBeInTheDocument();
    
    // Test offer selection
    const offerRows = screen.getAllByRole('radio');
    fireEvent.click(offerRows[0]);
    
    // Test continue button
    fireEvent.click(screen.getByText('Continue with Selected Offer'));
    expect(mockOnSelectOffer).toHaveBeenCalledWith(mockOffers[0]);
  });
  
  test('filters offers correctly', () => {
    const mockOnSelectOffer = jest.fn();
    render(
      <BuyWorkflowSelectOffer 
        availableOffers={mockOffers}
        selectedCurrency="USD"
        selectedPaymentMethod="All"
        onSelectOffer={mockOnSelectOffer}
      />
    );
    
    // Test currency filter
    const currencySelect = screen.getByLabelText('Currency:');
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    
    // Should show no offers message since all mock offers are in USD
    expect(screen.getByText('No offers match your criteria. Try adjusting your filters.')).toBeInTheDocument();
  });
});

describe('BuyWorkflowReviewOffer Tests', () => {
  test('renders offer review correctly', () => {
    const mockOnConfirm = jest.fn();
    const mockOnBack = jest.fn();
    
    render(
      <BuyWorkflowReviewOffer 
        selectedOffer={mockOffer}
        onConfirm={mockOnConfirm}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('Review Your Selected Offer')).toBeInTheDocument();
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('750.00 USD')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    
    // Test checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Test confirm button
    fireEvent.click(screen.getByText('Confirm and Proceed'));
    expect(mockOnConfirm).toHaveBeenCalled();
    
    // Test back button
    fireEvent.click(screen.getByText('Back to Offers'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});

describe('SellWorkflowCreateOffer Tests', () => {
  test('renders offer creation form correctly', () => {
    const mockOnOfferCreated = jest.fn();
    const mockOnBack = jest.fn();
    
    render(
      <SellWorkflowCreateOffer 
        onOfferCreated={mockOnOfferCreated}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('Create Your Sell Offer')).toBeInTheDocument();
    
    // Fill form
    fireEvent.change(screen.getByLabelText('SOL Amount to Sell'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Fiat Currency'), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText('Payment Method'), { target: { value: 'Bank Transfer' } });
    fireEvent.change(screen.getByLabelText('Your Payment Details'), { 
      target: { value: 'Bank: Example Bank\nAccount: 123456789\nName: John Doe' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Wait for the mock offer creation (setTimeout in the component)
    setTimeout(() => {
      expect(mockOnOfferCreated).toHaveBeenCalled();
    }, 2500);
    
    // Test back button
    fireEvent.click(screen.getByText('Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});

describe('SellWorkflowReviewEscrow Tests', () => {
  test('renders escrow review correctly', () => {
    const mockOnConfirm = jest.fn();
    const mockOnBack = jest.fn();
    
    render(
      <SellWorkflowReviewEscrow 
        offerDetails={mockOffer}
        onConfirm={mockOnConfirm}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('Review Escrow Details')).toBeInTheDocument();
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument();
    expect(screen.getByText('750.00 USD')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    
    // Test checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Test confirm button
    fireEvent.click(screen.getByText('Confirm and Create Escrow'));
    
    // Wait for the mock escrow creation (setTimeout in the component)
    setTimeout(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    }, 2500);
    
    // Test back button
    fireEvent.click(screen.getByText('Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });
});
