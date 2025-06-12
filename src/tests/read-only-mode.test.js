import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DemoIndicator from '../components/DemoIndicator';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';
import { DEMO_MODE, DEMO_OFFERS } from '../constants/tradingConstants';

// Mock the Tooltip component since it's imported from common
jest.mock('../components/common', () => ({
  Tooltip: ({ children, content }) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  )
}));

// Mock the WalletMultiButton component
jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <button>Connect Wallet</button>
}));

describe('Read-Only Mode Components', () => {
  describe('DemoIndicator Component', () => {
    it('renders badge type demo indicator with tooltip', () => {
      render(
        <DemoIndicator 
          type="badge" 
          message="Demo" 
          tooltip="This is sample data" 
        />
      );

      expect(screen.getByText('Demo')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('title', 'This is sample data');
    });

    it('renders banner type demo indicator', () => {
      render(
        <DemoIndicator 
          type="banner" 
          message="Demo Data" 
          tooltip="Sample data for demonstration" 
        />
      );

      expect(screen.getByText('Demo Data')).toBeInTheDocument();
      expect(screen.getByText('Sample data for demonstration')).toBeInTheDocument();
    });

    it('renders inline type demo indicator', () => {
      render(
        <DemoIndicator 
          type="inline" 
          message="Demo" 
          tooltip="This is sample data" 
        />
      );

      expect(screen.getByText('Demo')).toBeInTheDocument();
    });

    it('applies correct CSS classes for different types', () => {
      const { rerender } = render(
        <DemoIndicator type="badge" message="Demo" />
      );
      expect(document.querySelector('.demo-badge')).toBeInTheDocument();

      rerender(<DemoIndicator type="banner" message="Demo" />);
      expect(document.querySelector('.demo-banner')).toBeInTheDocument();

      rerender(<DemoIndicator type="inline" message="Demo" />);
      expect(document.querySelector('.demo-inline')).toBeInTheDocument();
    });
  });

  describe('ConnectWalletPrompt Component', () => {
    it('renders CTA button with default message', () => {
      render(<ConnectWalletPrompt />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('renders CTA button with custom action message', () => {
      render(<ConnectWalletPrompt action="buy SOL" />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      // The action should be in the tooltip
      expect(screen.getByTestId('tooltip')).toHaveAttribute('title', 'Connect your wallet to buy SOL');
    });

    it('opens modal when showAsModal is true', () => {
      const mockOnClose = jest.fn();
      render(
        <ConnectWalletPrompt 
          showAsModal={true}
          onClose={mockOnClose}
          action="perform this action"
        />
      );

      expect(screen.getByText('Wallet Connection Required')).toBeInTheDocument();
      expect(screen.getByText(/connect your wallet to perform this action/i)).toBeInTheDocument();
      
      // Test close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when clicking overlay', () => {
      const mockOnClose = jest.fn();
      render(
        <ConnectWalletPrompt 
          showAsModal={true}
          onClose={mockOnClose}
        />
      );

      // Click on the overlay (the outer div)
      const overlay = document.querySelector('.connect-wallet-modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close modal when clicking modal content', () => {
      const mockOnClose = jest.fn();
      render(
        <ConnectWalletPrompt 
          showAsModal={true}
          onClose={mockOnClose}
        />
      );

      const modalContent = document.querySelector('.connect-wallet-modal');
      fireEvent.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('renders help link in modal', () => {
      render(
        <ConnectWalletPrompt 
          showAsModal={true}
          onClose={() => {}}
        />
      );

      const helpLink = screen.getByText('Get a Phantom Wallet');
      expect(helpLink).toBeInTheDocument();
      expect(helpLink.closest('a')).toHaveAttribute('href', 'https://phantom.app/');
      expect(helpLink.closest('a')).toHaveAttribute('target', '_blank');
    });
  });

  describe('Demo Mode Constants', () => {
    it('includes demo mode configuration', () => {
      expect(DEMO_MODE.enabled).toBe(true);
      expect(DEMO_MODE.sampleDataLabel).toBe('Demo Data');
      expect(DEMO_MODE.educationalMessages).toBeDefined();
      expect(DEMO_MODE.educationalMessages.walletRequired).toBeDefined();
      expect(DEMO_MODE.educationalMessages.browseOnly).toBeDefined();
      expect(DEMO_MODE.educationalMessages.createOffer).toBeDefined();
      expect(DEMO_MODE.educationalMessages.myOffers).toBeDefined();
    });

    it('includes demo offers with correct structure', () => {
      expect(Array.isArray(DEMO_OFFERS)).toBe(true);
      expect(DEMO_OFFERS.length).toBeGreaterThan(0);
      
      DEMO_OFFERS.forEach(offer => {
        expect(offer.isDemo).toBe(true);
        expect(offer.id).toBeDefined();
        expect(offer.seller).toBeDefined();
        expect(offer.solAmount).toBeGreaterThan(0);
        expect(offer.fiatAmount).toBeGreaterThan(0);
        expect(offer.fiatCurrency).toBeDefined();
        expect(offer.paymentMethod).toBeDefined();
        expect(offer.status).toBeDefined();
        expect(offer.createdAt).toBeDefined();
        expect(offer.rate).toBeDefined();
      });
    });

    it('demo offers have reasonable data', () => {
      DEMO_OFFERS.forEach(offer => {
        // Check that the rate makes sense (between 50-300)
        expect(offer.rate).toBeGreaterThan(50);
        expect(offer.rate).toBeLessThan(300);
        
        // Check that seller names start with "Demo"
        expect(offer.seller).toMatch(/^Demo/);
        
        // Check that created timestamps are in the past
        expect(offer.createdAt).toBeLessThan(Date.now());
      });
    });
  });

  describe('Educational Messages', () => {
    it('has appropriate educational content', () => {
      const messages = DEMO_MODE.educationalMessages;
      
      expect(messages.walletRequired.toLowerCase()).toContain('connect');
      expect(messages.walletRequired.toLowerCase()).toContain('wallet');
      
      expect(messages.browseOnly.toLowerCase()).toContain('demo');
      expect(messages.browseOnly.toLowerCase()).toContain('connect');
      
      expect(messages.createOffer.toLowerCase()).toContain('connect');
      expect(messages.createOffer.toLowerCase()).toContain('wallet');
      
      expect(messages.myOffers.toLowerCase()).toContain('connect');
      expect(messages.myOffers.toLowerCase()).toContain('wallet');
    });
  });
});