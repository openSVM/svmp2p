import React, { useState } from 'react';

/**
 * BuyWorkflowSelectOffer component - Step for selecting an offer in the buy workflow
 */
const BuyWorkflowSelectOffer = ({ onSelectOffer, availableOffers, selectedCurrency, selectedPaymentMethod }) => {
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [currencyFilter, setCurrencyFilter] = useState(selectedCurrency || 'USD');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(selectedPaymentMethod || 'All');
  
  // Filter offers based on user criteria
  const filteredOffers = availableOffers.filter(offer => {
    // Filter by amount
    const matchesAmount = (
      (!amountFilter.min || offer.solAmount >= parseFloat(amountFilter.min)) &&
      (!amountFilter.max || offer.solAmount <= parseFloat(amountFilter.max))
    );
    
    // Filter by currency
    const matchesCurrency = currencyFilter === 'All' || offer.fiatCurrency === currencyFilter;
    
    // Filter by payment method
    const matchesPaymentMethod = paymentMethodFilter === 'All' || offer.paymentMethod === paymentMethodFilter;
    
    return matchesAmount && matchesCurrency && matchesPaymentMethod;
  });
  
  const handleContinue = () => {
    if (selectedOfferId) {
      const selectedOffer = availableOffers.find(offer => offer.id === selectedOfferId);
      onSelectOffer(selectedOffer);
    }
  };
  
  return (
    <div className="buy-workflow-select-offer">
      <div className="filter-section">
        <h4>Filter Available Offers</h4>
        <div className="filter-controls">
          <div className="filter-group">
            <label>SOL Amount:</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={amountFilter.min}
                onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
                min="0"
                step="0.01"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={amountFilter.max}
                onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>Currency:</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              <option value="All">All Currencies</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Payment Method:</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="All">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayPal">PayPal</option>
              <option value="Venmo">Venmo</option>
              <option value="Cash App">Cash App</option>
              <option value="Zelle">Zelle</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="offers-list">
        <h4>Available Offers</h4>
        
        {filteredOffers.length === 0 ? (
          <div className="no-offers-message">
            <p>No offers match your criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="offers-table">
            <div className="table-header">
              <div className="col seller">Seller</div>
              <div className="col amount">Amount</div>
              <div className="col price">Price</div>
              <div className="col payment">Payment Method</div>
              <div className="col rating">Rating</div>
              <div className="col select">Select</div>
            </div>
            
            {filteredOffers.map(offer => (
              <div 
                key={offer.id} 
                className={`table-row ${selectedOfferId === offer.id ? 'selected' : ''}`}
                onClick={() => setSelectedOfferId(offer.id)}
              >
                <div className="col seller">
                  <div className="seller-info">
                    <span className="seller-name">
                      {offer.seller.substring(0, 4)}...{offer.seller.substring(offer.seller.length - 4)}
                    </span>
                  </div>
                </div>
                
                <div className="col amount">
                  <div className="amount-info">
                    <span className="sol-amount">{offer.solAmount.toFixed(2)} SOL</span>
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
                
                <div className="col rating">
                  <div className="seller-rating">
                    <span className="rating-stars">★★★★☆</span>
                    <span className="rating-count">(32)</span>
                  </div>
                </div>
                
                <div className="col select">
                  <input
                    type="radio"
                    name="selectedOffer"
                    checked={selectedOfferId === offer.id}
                    onChange={() => setSelectedOfferId(offer.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="selection-tips">
        <h4>Selection Tips:</h4>
        <ul>
          <li>Choose sellers with higher ratings for a smoother experience</li>
          <li>Check the payment method to ensure it works for you</li>
          <li>Compare prices to get the best deal</li>
          <li>Consider the seller's transaction history and completion rate</li>
        </ul>
      </div>
      
      <div className="step-actions">
        <button 
          className="primary-button" 
          onClick={handleContinue}
          disabled={!selectedOfferId}
        >
          Continue with Selected Offer
        </button>
      </div>
    </div>
  );
};

export default BuyWorkflowSelectOffer;
