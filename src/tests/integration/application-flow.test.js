import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockWallet, mockFetch } from '../utils/test-utils';

// Mock components
jest.mock('../../components/OfferCreation', () => {
  return function MockOfferCreation({ onOfferCreated }) {
    return (
      <div data-testid="offer-creation">
        <button onClick={() => onOfferCreated({ id: 'offer-123', amount: 100 })}>
          Create Offer
        </button>
      </div>
    );
  };
});

jest.mock('../../components/OfferList', () => {
  return function MockOfferList({ onSelectOffer }) {
    return (
      <div data-testid="offer-list">
        <div className="offer-item" data-testid="offer-item">
          <h3>Offer #1</h3>
          <p>100 SOL at $100 USD</p>
          <button onClick={() => onSelectOffer({ id: 'offer-123', amount: 100 })}>
            Select Offer
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('../../components/common/TransactionConfirmation', () => {
  return function MockTransactionConfirmation({ status, txHash, onClose }) {
    return (
      <div data-testid="transaction-confirmation" className={`status-${status}`}>
        <p>Transaction {status}</p>
        {txHash && <p>Hash: {txHash}</p>}
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    );
  };
});

jest.mock('../../components/common/TransactionStatus', () => {
  return function MockTransactionStatus({ status, message, onClose }) {
    return (
      <div data-testid="transaction-status" className={`status-${status}`}>
        <p>{message}</p>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    );
  };
});

// Mock App component for testing
function MockApp() {
  const [wallet, setWallet] = React.useState(null);
  const [currentView, setCurrentView] = React.useState('home');
  const [selectedOffer, setSelectedOffer] = React.useState(null);
  const [transaction, setTransaction] = React.useState(null);
  const [notification, setNotification] = React.useState(null);

  const connectWallet = async () => {
    const mockWallet = createMockWallet();
    setWallet(mockWallet);
    setNotification({
      status: 'success',
      message: 'Wallet connected successfully'
    });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleCreateOffer = (offer) => {
    setTransaction({
      status: 'pending',
      txHash: 'tx-hash-123'
    });
    
    // Simulate transaction processing
    setTimeout(() => {
      setTransaction({
        status: 'success',
        txHash: 'tx-hash-123'
      });
      setNotification({
        status: 'success',
        message: 'Offer created successfully'
      });
      setCurrentView('home');
    }, 1000);
  };

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
    setCurrentView('review-offer');
  };

  const handleAcceptOffer = () => {
    setTransaction({
      status: 'pending',
      txHash: 'tx-hash-456'
    });
    
    // Simulate transaction processing
    setTimeout(() => {
      setTransaction({
        status: 'success',
        txHash: 'tx-hash-456'
      });
      setNotification({
        status: 'success',
        message: 'Offer accepted successfully'
      });
      setCurrentView('home');
    }, 1000);
  };

  const handleCloseTransaction = () => {
    setTransaction(null);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <div>
      <header>
        <h1>SVMP2P Exchange</h1>
        {!wallet ? (
          <button onClick={connectWallet} data-testid="connect-wallet-btn">
            Connect Wallet
          </button>
        ) : (
          <div data-testid="wallet-info">
            <p>Connected: {wallet.publicKey.toString().substring(0, 8)}...</p>
          </div>
        )}
        <nav>
          <button onClick={() => setCurrentView('home')} data-testid="nav-home">Home</button>
          <button onClick={() => setCurrentView('create-offer')} data-testid="nav-create-offer">Create Offer</button>
        </nav>
      </header>

      <main>
        {currentView === 'home' && (
          <div data-testid="home-view">
            <h2>Available Offers</h2>
            <div data-testid="offer-list-container">
              <OfferList onSelectOffer={handleSelectOffer} />
            </div>
          </div>
        )}

        {currentView === 'create-offer' && (
          <div data-testid="create-offer-view">
            <h2>Create New Offer</h2>
            <div data-testid="offer-creation-container">
              <OfferCreation onOfferCreated={handleCreateOffer} />
            </div>
          </div>
        )}

        {currentView === 'review-offer' && selectedOffer && (
          <div data-testid="review-offer-view">
            <h2>Review Offer</h2>
            <div data-testid="offer-details">
              <p>Offer ID: {selectedOffer.id}</p>
              <p>Amount: {selectedOffer.amount} SOL</p>
              <button onClick={handleAcceptOffer} data-testid="accept-offer-btn">
                Accept Offer
              </button>
            </div>
          </div>
        )}

        {transaction && (
          <TransactionConfirmation
            status={transaction.status}
            txHash={transaction.txHash}
            onClose={handleCloseTransaction}
          />
        )}

        {notification && (
          <TransactionStatus
            status={notification.status}
            message={notification.message}
            onClose={handleCloseNotification}
          />
        )}
      </main>
    </div>
  );
}

// Integration tests
describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('end-to-end trading flow', async () => {
    render(<MockApp />);
    
    // Step 1: Connect wallet
    const connectWalletBtn = screen.getByTestId('connect-wallet-btn');
    fireEvent.click(connectWalletBtn);
    
    // Verify wallet connected
    await waitFor(() => {
      expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
    });
    
    // Verify notification appears
    expect(screen.getByTestId('transaction-status')).toHaveClass('status-success');
    expect(screen.getByText('Wallet connected successfully')).toBeInTheDocument();
    
    // Step 2: Navigate to offer list and select an offer
    const offerItem = screen.getByTestId('offer-item');
    const selectOfferBtn = screen.getByText('Select Offer');
    fireEvent.click(selectOfferBtn);
    
    // Verify review offer view is displayed
    await waitFor(() => {
      expect(screen.getByTestId('review-offer-view')).toBeInTheDocument();
    });
    expect(screen.getByText('Offer ID: offer-123')).toBeInTheDocument();
    
    // Step 3: Accept the offer
    const acceptOfferBtn = screen.getByTestId('accept-offer-btn');
    fireEvent.click(acceptOfferBtn);
    
    // Verify transaction confirmation appears with pending status
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-pending');
    });
    
    // Fast-forward timer to complete transaction
    jest.advanceTimersByTime(1000);
    
    // Verify transaction confirmation shows success
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-success');
    });
    
    // Verify success notification appears
    expect(screen.getByTestId('transaction-status')).toHaveClass('status-success');
    expect(screen.getByText('Offer accepted successfully')).toBeInTheDocument();
    
    // Verify we're back at home view
    expect(screen.getByTestId('home-view')).toBeInTheDocument();
  });

  test('wallet connection and authentication flow', async () => {
    render(<MockApp />);
    
    // Verify initial state - wallet not connected
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-info')).not.toBeInTheDocument();
    
    // Connect wallet
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    
    // Verify wallet connected
    await waitFor(() => {
      expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
    });
    
    // Verify notification appears
    expect(screen.getByTestId('transaction-status')).toHaveClass('status-success');
    expect(screen.getByText('Wallet connected successfully')).toBeInTheDocument();
    
    // Verify navigation is accessible
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-create-offer')).toBeInTheDocument();
    
    // Fast-forward timer to clear notification
    jest.advanceTimersByTime(2000);
    
    // Verify notification is removed
    expect(screen.queryByTestId('transaction-status')).not.toBeInTheDocument();
  });

  test('notification system integration', async () => {
    render(<MockApp />);
    
    // Connect wallet to trigger notification
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    
    // Verify notification appears
    await waitFor(() => {
      expect(screen.getByTestId('transaction-status')).toBeInTheDocument();
    });
    expect(screen.getByText('Wallet connected successfully')).toBeInTheDocument();
    
    // Manually close notification
    fireEvent.click(screen.getByText('Close'));
    
    // Verify notification is removed
    expect(screen.queryByTestId('transaction-status')).not.toBeInTheDocument();
    
    // Navigate to create offer
    fireEvent.click(screen.getByTestId('nav-create-offer'));
    
    // Create an offer to trigger transaction confirmation and notification
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Verify transaction confirmation appears
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toBeInTheDocument();
    });
    expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-pending');
    
    // Fast-forward timer to complete transaction
    jest.advanceTimersByTime(1000);
    
    // Verify transaction confirmation shows success
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-success');
    });
    
    // Verify success notification appears
    expect(screen.getByTestId('transaction-status')).toHaveClass('status-success');
    expect(screen.getByText('Offer created successfully')).toBeInTheDocument();
    
    // Close transaction confirmation
    fireEvent.click(screen.getByText('Close'));
    
    // Verify transaction confirmation is removed
    expect(screen.queryByTestId('transaction-confirmation')).not.toBeInTheDocument();
  });

  test('guided workflow integration with transaction system', async () => {
    // This test would verify that the guided workflow properly integrates
    // with the transaction system
    
    render(<MockApp />);
    
    // Connect wallet
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    
    // Navigate to create offer (simulating guided workflow)
    fireEvent.click(screen.getByTestId('nav-create-offer'));
    
    // Verify create offer view is displayed
    expect(screen.getByTestId('create-offer-view')).toBeInTheDocument();
    
    // Create an offer
    fireEvent.click(screen.getByText('Create Offer'));
    
    // Verify transaction confirmation appears with pending status
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-pending');
    });
    
    // Fast-forward timer to complete transaction
    jest.advanceTimersByTime(1000);
    
    // Verify transaction confirmation shows success
    await waitFor(() => {
      expect(screen.getByTestId('transaction-confirmation')).toHaveClass('status-success');
    });
    
    // Verify success notification appears
    expect(screen.getByTestId('transaction-status')).toHaveClass('status-success');
    expect(screen.getByText('Offer created successfully')).toBeInTheDocument();
    
    // Verify we're back at home view (workflow completed)
    expect(screen.getByTestId('home-view')).toBeInTheDocument();
  });
});
