import React, { useState, useEffect, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AppContext } from '../contexts/AppContext';
import { LoadingSpinner, ButtonLoader, TransactionStatus } from './common';

const OfferList = ({ type = 'buy' }) => {
  const { wallet } = useWallet();
  const { program, network } = useContext(AppContext);
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [txStatus, setTxStatus] = useState(null);
  
  // Filter states
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  
  // Action states
  const [processingAction, setProcessingAction] = useState({
    offerId: null,
    action: null
  });
  
  const currencies = ['', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  const paymentMethods = ['', 'Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
  
  // Generate unique IDs for form inputs
  const inputIds = {
    minAmount: `min-amount-${type}`,
    maxAmount: `max-amount-${type}`,
    currency: `currency-${type}`,
    paymentMethod: `payment-method-${type}`
  };
  
  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, [type, network]);
  
  // Fetch offers from the blockchain
  const fetchOffers = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockOffers = [
        {
          id: '58JrMFgW3NHLtYnU2vEv9rGBZGNpJhRVQQnKvYVZZdmG',
          seller: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
          buyer: null,
          solAmount: 1.5,
          fiatAmount: 225,
          fiatCurrency: 'USD',
          paymentMethod: 'Bank Transfer',
          status: 'Listed',
          createdAt: Date.now() - 3600000
        },
        {
          id: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          seller: '2xRW7Ld9XwHegUMeqsS8VxEYbsZYPxnaVdqTSLLNBjAT',
          buyer: null,
          solAmount: 0.5,
          fiatAmount: 75,
          fiatCurrency: 'USD',
          paymentMethod: 'PayPal',
          status: 'Listed',
          createdAt: Date.now() - 7200000
        },
        {
          id: '3pRNuDKxwVMgTJAHUZ6SgxMm9iSfaAzKtdKxVbVKsw2U',
          seller: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          buyer: null,
          solAmount: 2.0,
          fiatAmount: 300,
          fiatCurrency: 'USD',
          paymentMethod: 'Zelle',
          status: 'Listed',
          createdAt: Date.now() - 10800000
        }
      ];
      
      setOffers(mockOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(`Failed to fetch offers: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to fetch offers: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter offers based on user criteria
  const filteredOffers = offers.filter(offer => {
    // Filter by min amount
    if (minAmount && offer.solAmount < parseFloat(minAmount)) {
      return false;
    }
    
    // Filter by max amount
    if (maxAmount && offer.solAmount > parseFloat(maxAmount)) {
      return false;
    }
    
    // Filter by currency
    if (selectedCurrency && offer.fiatCurrency !== selectedCurrency) {
      return false;
    }
    
    // Filter by payment method
    if (selectedPaymentMethod && offer.paymentMethod !== selectedPaymentMethod) {
      return false;
    }
    
    return true;
  });
  
  // Handle offer actions (accept, cancel, etc.)
  const handleOfferAction = async (offerId, action) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      setTxStatus({
        status: 'error',
        message: 'Please connect your wallet first'
      });
      return;
    }
    
    setProcessingAction({
      offerId,
      action
    });
    
    setTxStatus({
      status: 'pending',
      message: `Processing ${action}...`
    });
    
    try {
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful transaction
      setStatusMessage(`Successfully ${action === 'accept' ? 'accepted' : action + 'ed'} offer`);
      setTxStatus({
        status: 'success',
        message: `Successfully ${action === 'accept' ? 'accepted' : action + 'ed'} offer`
      });
      
      // Refresh offers after action
      fetchOffers();
    } catch (err) {
      console.error(`Error ${action}ing offer:`, err);
      setError(`Failed to ${action} offer: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Failed to ${action} offer: ${err.message}`
      });
    } finally {
      setProcessingAction({
        offerId: null,
        action: null
      });
    }
  };
  
  // Render action buttons based on offer status and user role
  const renderActionButtons = (offer) => {
    const isProcessing = processingAction.offerId === offer.id;
    const currentAction = processingAction.action;
    
    if (type === 'buy' && offer.status === 'Listed') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'accept')}
          isLoading={isProcessing && currentAction === 'accept'}
          loadingText="Accepting..."
          variant="primary"
          size="small"
        >
          Accept Offer
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Listed') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'cancel')}
          isLoading={isProcessing && currentAction === 'cancel'}
          loadingText="Cancelling..."
          variant="danger"
          size="small"
        >
          Cancel Offer
        </ButtonLoader>
      );
    }
    
    if (type === 'my' && offer.status === 'Accepted') {
      return (
        <ButtonLoader
          onClick={() => handleOfferAction(offer.id, 'confirm')}
          isLoading={isProcessing && currentAction === 'confirm'}
          loadingText="Confirming..."
          variant="success"
          size="small"
        >
          Confirm Payment
        </ButtonLoader>
      );
    }
    
    return null;
  };
  
  // Clear transaction status
  const handleClearTxStatus = () => {
    setTxStatus(null);
  };
  
  return (
    <div className="offer-list-container">
      <h2>
        {type === 'buy' ? 'Buy SOL Offers' : 
         type === 'sell' ? 'Sell SOL Offers' : 
         'My Offers'}
      </h2>
      
      {error && <div className="error-message">{error}</div>}
      {statusMessage && <div className="status-message">{statusMessage}</div>}
      
      {txStatus && (
        <TransactionStatus
          status={txStatus.status}
          message={txStatus.message}
          onClose={handleClearTxStatus}
        />
      )}
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor={inputIds.minAmount}>SOL Amount:</label>
          <input
            id={inputIds.minAmount}
            type="number"
            placeholder="Min"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            min="0"
            step="0.01"
            aria-label="Minimum SOL amount"
          />
          <span>to</span>
          <input
            id={inputIds.maxAmount}
            type="number"
            placeholder="Max"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            min="0"
            step="0.01"
            aria-label="Maximum SOL amount"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor={inputIds.currency}>Currency:</label>
          <select
            id={inputIds.currency}
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            aria-label="Select currency"
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency || 'All Currencies'}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor={inputIds.paymentMethod}>Payment Method:</label>
          <select
            id={inputIds.paymentMethod}
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            aria-label="Select payment method"
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method || 'All Payment Methods'}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading offers..." />
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="no-offers">No offers found matching your criteria.</div>
      ) : (
        <div className="offers-table">
          <div className="table-header">
            <div className="col seller">Seller</div>
            <div className="col amount">Amount</div>
            <div className="col price">Price</div>
            <div className="col payment">Payment Method</div>
            <div className="col status">Status</div>
            <div className="col actions">Actions</div>
          </div>
          
          {filteredOffers.map(offer => (
            <div key={offer.id} className="table-row">
              <div className="col seller">
                <div className="seller-info">
                  <span className="seller-name">
                    {offer.seller.substring(0, 4)}...{offer.seller.substring(offer.seller.length - 4)}
                  </span>
                  <span className="seller-rating">★★★★☆</span>
                </div>
              </div>
              
              <div className="col amount">
                <div className="amount-info">
                  <span className="sol-amount">{offer.solAmount.toFixed(2)} SOL</span>
                  <span className="network-badge" style={{backgroundColor: network.color}}>
                    {network.name}
                  </span>
                </div>
              </div>
              
              <div className="col price">
                <div className="price-info">
                  <span className="fiat-amount">
                    {offer.fiatAmount.toFixed(2)} {offer.fiatCurrency}
                  </span>
                  <span className="price-per-sol">
                    ({(offer.fiatAmount / offer.solAmount).toFixed(2)} {offer.fiatCurrency}/SOL)
                  </span>
                </div>
              </div>
              
              <div className="col payment">
                <div className="payment-method">
                  {offer.paymentMethod}
                </div>
              </div>
              
              <div className="col status">
                <div className={`status-badge status-${offer.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {offer.status}
                </div>
              </div>
              
              <div className="col actions">
                {renderActionButtons(offer)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="network-info">
        <p>Network: {network.name}</p>
        <p>All trades are secured by smart contracts on the {network.name} network.</p>
        <p>Disputes are resolved through a decentralized juror system.</p>
      </div>
    </div>
  );
};
export { OfferList };
export default OfferList;
