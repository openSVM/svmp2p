import React, { useState } from 'react';

/**
 * SellWorkflowCreateOffer component - Step for creating a sell offer in the sell workflow
 */
const SellWorkflowCreateOffer = ({ onOfferCreated, onBack }) => {
  const [solAmount, setSolAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  // Available currencies
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  
  // Available payment methods
  const paymentMethods = ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle'];
  
  // Calculate fiat amount based on SOL amount (simple conversion for demo)
  const handleSolAmountChange = (e) => {
    const sol = e.target.value;
    setSolAmount(sol);
    
    // Mock price calculation - in a real app, you'd use an oracle or price feed
    const mockSolPrice = {
      'USD': 150,
      'EUR': 140,
      'GBP': 120,
      'JPY': 16500,
      'CAD': 200,
      'AUD': 220
    };
    
    if (sol && !isNaN(sol)) {
      const calculatedFiat = (parseFloat(sol) * mockSolPrice[fiatCurrency]).toFixed(2);
      setFiatAmount(calculatedFiat);
    }
  };
  
  // Update fiat amount when currency changes
  const handleCurrencyChange = (e) => {
    setFiatCurrency(e.target.value);
    if (solAmount && !isNaN(solAmount)) {
      // Recalculate fiat amount with new currency
      const mockSolPrice = {
        'USD': 150,
        'EUR': 140,
        'GBP': 120,
        'JPY': 16500,
        'CAD': 200,
        'AUD': 220
      };
      const calculatedFiat = (parseFloat(solAmount) * mockSolPrice[e.target.value]).toFixed(2);
      setFiatAmount(calculatedFiat);
    }
  };
  
  // Handle form submission
  const handleCreateOffer = (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    
    // Validate inputs
    if (!solAmount || isNaN(solAmount) || parseFloat(solAmount) <= 0) {
      setError('Please enter a valid SOL amount');
      setIsCreating(false);
      return;
    }
    
    if (!fiatAmount || isNaN(fiatAmount) || parseFloat(fiatAmount) <= 0) {
      setError('Please enter a valid fiat amount');
      setIsCreating(false);
      return;
    }
    
    if (!paymentDetails.trim()) {
      setError('Please provide your payment details');
      setIsCreating(false);
      return;
    }
    
    // Simulate offer creation (would call blockchain in real implementation)
    setTimeout(() => {
      try {
        // Create mock offer object
        const newOffer = {
          id: 'offer_' + Date.now().toString(36) + '_' + Math.floor(performance.now()).toString(36),
          seller: 'Your_Wallet_Address',
          solAmount: parseFloat(solAmount),
          fiatAmount: parseFloat(fiatAmount),
          fiatCurrency,
          paymentMethod,
          paymentDetails,
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        
        // Call the callback with the new offer
        onOfferCreated(newOffer);
      } catch (err) {
        setError(`Failed to create offer: ${err.message}`);
      } finally {
        setIsCreating(false);
      }
    }, 2000);
  };
  
  return (
    <div className="sell-workflow-create-offer">
      <div className="create-offer-header">
        <h3>Create Your Sell Offer</h3>
        <p>Specify the details of your offer to sell SOL for fiat currency.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleCreateOffer}>
        <div className="form-section">
          <h4>Offer Details</h4>
          
          <div className="form-group">
            <label htmlFor="solAmount">SOL Amount to Sell</label>
            <input
              id="solAmount"
              type="number"
              value={solAmount}
              onChange={handleSolAmountChange}
              placeholder="Enter SOL amount"
              min="0.01"
              step="0.01"
              required
              className="form-control"
            />
            <div className="input-help">
              Enter the amount of SOL you want to sell
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fiatCurrency">Fiat Currency</label>
              <select
                id="fiatCurrency"
                value={fiatCurrency}
                onChange={handleCurrencyChange}
                required
                className="form-control"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="fiatAmount">Fiat Amount</label>
              <input
                id="fiatAmount"
                type="number"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                placeholder="Enter fiat amount"
                min="0.01"
                step="0.01"
                required
                className="form-control"
              />
            </div>
          </div>
          
          <div className="price-summary">
            <div className="price-per-sol">
              Price per SOL: 
              <span className="price-value">
                {solAmount && fiatAmount ? 
                  `${(parseFloat(fiatAmount) / parseFloat(solAmount)).toFixed(2)} ${fiatCurrency}` : 
                  `0.00 ${fiatCurrency}`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Payment Information</h4>
          
          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="form-control"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
            <div className="input-help">
              Select how you want to receive payment
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="paymentDetails">Your Payment Details</label>
            <textarea
              id="paymentDetails"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder={`Enter your ${paymentMethod} details here...`}
              required
              className="form-control"
              rows={4}
            />
            <div className="input-help">
              {paymentMethod === 'Bank Transfer' ? 
                'Include your account name, account number, bank name, and routing number' : 
                `Include your ${paymentMethod} username, email, or ID where buyers can send payment`}
            </div>
          </div>
        </div>
        
        <div className="escrow-information">
          <h4>Escrow Information</h4>
          <p>
            When you create this offer, your SOL will be held in a secure escrow smart contract.
            The SOL will only be released to the buyer after you confirm receipt of their payment.
          </p>
          <p>
            <strong>Note:</strong> A small network fee will be charged for creating the escrow contract.
          </p>
        </div>
        
        <div className="step-actions">
          <button 
            type="button" 
            className="secondary-button" 
            onClick={onBack}
            disabled={isCreating}
          >
            Back
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={isCreating}
          >
            {isCreating ? 'Creating Offer...' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellWorkflowCreateOffer;
