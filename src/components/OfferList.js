import React, { useState, useContext, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { AppContext } from '@/contexts/AppContext';
import idl from '@/idl/p2p_exchange.json'; // This will be the IDL for your program

const OfferList = ({ type }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useContext(AppContext);
  
  // State
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Filters
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  
  // Available currencies and payment methods
  const currencies = ['All', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  const paymentMethods = ['All', 'Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
  
  // Create Anchor provider and program
  const getProgram = () => {
    if (!wallet.publicKey) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: 'processed' }
    );
    
    return new Program(idl, new PublicKey(network.programId), provider);
  };
  
  // Fetch offers based on type
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const program = getProgram();
        if (!program) {
          // If wallet is not connected, simulate offers for display
          setOffers(generateMockOffers(type));
          setLoading(false);
          return;
        }
        
        let fetchedOffers = [];
        
        if (type === 'buy') {
          // Fetch offers where status is Listed
          fetchedOffers = await program.account.offer.all([
            {
              memcmp: {
                offset: 8 + 32 + 32 + 8 + 8, // Skip discriminator + seller + buyer + amount + security_bond
                bytes: Buffer.from([1]), // Listed status (index 1)
              },
            },
          ]);
        } else if (type === 'sell') {
          // Fetch offers where status is Listed
          fetchedOffers = await program.account.offer.all([
            {
              memcmp: {
                offset: 8 + 32 + 32 + 8 + 8, // Skip discriminator + seller + buyer + amount + security_bond
                bytes: Buffer.from([1]), // Listed status (index 1)
              },
            },
          ]);
        } else if (type === 'my') {
          // Fetch offers where seller or buyer is current wallet
          const asSellerOffers = await program.account.offer.all([
            {
              memcmp: {
                offset: 8, // Skip discriminator
                bytes: wallet.publicKey.toBase58(),
              },
            },
          ]);
          
          const asBuyerOffers = await program.account.offer.all([
            {
              memcmp: {
                offset: 8 + 32, // Skip discriminator + seller
                bytes: wallet.publicKey.toBase58(),
              },
            },
          ]);
          
          fetchedOffers = [...asSellerOffers, ...asBuyerOffers];
        }
        
        // Process and set offers
        setOffers(fetchedOffers.map(item => ({
          id: item.publicKey.toString(),
          seller: item.account.seller.toString(),
          buyer: item.account.buyer.toString(),
          solAmount: item.account.amount.toNumber() / LAMPORTS_PER_SOL,
          fiatAmount: item.account.fiatAmount.toNumber() / 100,
          fiatCurrency: item.account.fiatCurrency,
          paymentMethod: item.account.paymentMethod,
          status: getStatusText(item.account.status),
          statusCode: item.account.status,
          createdAt: new Date(item.account.createdAt.toNumber() * 1000).toLocaleString(),
          updatedAt: new Date(item.account.updatedAt.toNumber() * 1000).toLocaleString(),
        })));
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to fetch offers. Using mock data instead.');
        setOffers(generateMockOffers(type));
      } finally {
        setLoading(false);
      }
    };
    
    fetchOffers();
  }, [type, wallet.publicKey, network]);
  
  // Helper to get status text from status code
  const getStatusText = (statusCode) => {
    const statusMap = {
      0: 'Created',
      1: 'Listed',
      2: 'Accepted',
      3: 'Awaiting Fiat Payment',
      4: 'Fiat Sent',
      5: 'SOL Released',
      6: 'Dispute Opened',
      7: 'Completed',
      8: 'Cancelled'
    };
    return statusMap[statusCode] || 'Unknown';
  };
  
  // Generate mock offers for display when wallet is not connected
  const generateMockOffers = (type) => {
    const mockOffers = [];
    const statuses = ['Listed', 'Accepted', 'Awaiting Fiat Payment', 'Completed'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    const paymentMethods = ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
    
    for (let i = 0; i < 10; i++) {
      const solAmount = (Math.random() * 10 + 0.1).toFixed(2);
      const fiatCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const mockSolPrice = {
        'USD': 150,
        'EUR': 140,
        'GBP': 120,
        'JPY': 16500,
        'CAD': 200,
        'AUD': 220
      };
      const fiatAmount = (parseFloat(solAmount) * mockSolPrice[fiatCurrency]).toFixed(2);
      
      mockOffers.push({
        id: `mock-offer-${i}`,
        seller: 'Seller' + Math.floor(Math.random() * 1000),
        buyer: type === 'buy' ? '' : 'Buyer' + Math.floor(Math.random() * 1000),
        solAmount: parseFloat(solAmount),
        fiatAmount: parseFloat(fiatAmount),
        fiatCurrency,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        statusCode: Math.floor(Math.random() * 4) + 1,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
        updatedAt: new Date(Date.now() - Math.random() * 1000000000).toLocaleString(),
      });
    }
    
    return mockOffers;
  };
  
  // Filter offers based on user selections
  const filteredOffers = offers.filter(offer => {
    // Filter by amount
    if (minAmount && offer.solAmount < parseFloat(minAmount)) return false;
    if (maxAmount && offer.solAmount > parseFloat(maxAmount)) return false;
    
    // Filter by currency
    if (selectedCurrency !== 'All' && offer.fiatCurrency !== selectedCurrency) return false;
    
    // Filter by payment method
    if (selectedPaymentMethod !== 'All' && offer.paymentMethod !== selectedPaymentMethod) return false;
    
    return true;
  });
  
  // Handle accepting an offer
  const handleAcceptOffer = async (offerId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Accepting offer...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const offerPublicKey = new PublicKey(offerId);
      
      // Get offer details
      const offer = await program.account.offer.fetch(offerPublicKey);
      
      // Calculate security bond (e.g., 10% of transaction amount)
      const securityBond = offer.amount.toNumber() * 0.1;
      
      await program.methods
        .acceptOffer(new BN(securityBond))
        .accounts({
          offer: offerPublicKey,
          buyer: wallet.publicKey,
          escrowAccount: offer.escrowAccount,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      setStatusMessage('Offer accepted successfully!');
      
      // Refresh offers
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      setError(`Failed to accept offer: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle marking fiat as sent
  const handleMarkFiatSent = async (offerId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Marking fiat as sent...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const offerPublicKey = new PublicKey(offerId);
      
      await program.methods
        .markFiatSent()
        .accounts({
          offer: offerPublicKey,
          buyer: wallet.publicKey,
        })
        .rpc();
      
      setStatusMessage('Fiat marked as sent successfully!');
      
      // Refresh offers
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error marking fiat as sent:', err);
      setError(`Failed to mark fiat as sent: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle confirming fiat receipt
  const handleConfirmFiatReceipt = async (offerId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Confirming fiat receipt...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const offerPublicKey = new PublicKey(offerId);
      
      await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: offerPublicKey,
          seller: wallet.publicKey,
        })
        .rpc();
      
      setStatusMessage('Fiat receipt confirmed successfully!');
      
      // Refresh offers
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error confirming fiat receipt:', err);
      setError(`Failed to confirm fiat receipt: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle releasing SOL
  const handleReleaseSol = async (offerId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('Releasing SOL...');
    setError('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      const offerPublicKey = new PublicKey(offerId);
      
      // Get offer details
      const offer = await program.account.offer.fetch(offerPublicKey);
      
      await program.methods
        .releaseSol()
        .accounts({
          offer: offerPublicKey,
          seller: offer.seller,
          buyer: offer.buyer,
          escrowAccount: offer.escrowAccount,
        })
        .rpc();
      
      setStatusMessage('SOL released successfully!');
      
      // Refresh offers
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error releasing SOL:', err);
      setError(`Failed to release SOL: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle opening a dispute
  const handleOpenDispute = async (offerId) => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    // For now, just navigate to the disputes tab
    // In a real implementation, you would open a modal to collect dispute details
    setStatusMessage('Navigating to dispute creation...');
    
    // This would be replaced with actual navigation in a real app
    alert('Dispute functionality will be implemented in the next phase.');
  };
  
  // Render action buttons based on offer status and user role
  const renderActionButtons = (offer) => {
    if (!wallet.publicKey) {
      return (
        <button 
          className="action-button connect-wallet"
          disabled={actionInProgress}
        >
          Connect Wallet to Trade
        </button>
      );
    }
    
    const isSeller = wallet.publicKey.toString() === offer.seller;
    const isBuyer = wallet.publicKey.toString() === offer.buyer;
    
    switch (offer.status) {
      case 'Listed':
        return isSeller ? (
          <button 
            className="action-button cancel"
            disabled={actionInProgress}
            onClick={() => alert('Cancel functionality will be implemented in the next phase.')}
          >
            Cancel Offer
          </button>
        ) : (
          <button 
            className="action-button accept"
            disabled={actionInProgress}
            onClick={() => handleAcceptOffer(offer.id)}
          >
            Accept Offer
          </button>
        );
        
      case 'Accepted':
        return isBuyer ? (
          <button 
            className="action-button mark-sent"
            disabled={actionInProgress}
            onClick={() => handleMarkFiatSent(offer.id)}
          >
            Mark Fiat as Sent
          </button>
        ) : (
          <div className="status-message">Waiting for buyer to send fiat</div>
        );
        
      case 'Awaiting Fiat Payment':
        return isSeller ? (
          <div className="button-group">
            <button 
              className="action-button confirm"
              disabled={actionInProgress}
              onClick={() => handleConfirmFiatReceipt(offer.id)}
            >
              Confirm Fiat Receipt
            </button>
            <button 
              className="action-button dispute"
              disabled={actionInProgress}
              onClick={() => handleOpenDispute(offer.id)}
            >
              Open Dispute
            </button>
          </div>
        ) : (
          <div className="button-group">
            <div className="status-message">Waiting for seller to confirm</div>
            <button 
              className="action-button dispute"
              disabled={actionInProgress}
              onClick={() => handleOpenDispute(offer.id)}
            >
              Open Dispute
            </button>
          </div>
        );
        
      case 'Fiat Sent':
        return isSeller ? (
          <button 
            className="action-button release"
            disabled={actionInProgress}
            onClick={() => handleReleaseSol(offer.id)}
          >
            Release SOL
          </button>
        ) : (
          <div className="status-message">Waiting for seller to release SOL</div>
        );
        
      case 'SOL Released':
      case 'Completed':
        return (
          <div className="status-message success">Trade Completed</div>
        );
        
      case 'Dispute Opened':
        return (
          <button 
            className="action-button view-dispute"
            disabled={actionInProgress}
            onClick={() => alert('View dispute functionality will be implemented in the next phase.')}
          >
            View Dispute
          </button>
        );
        
      default:
        return null;
    }
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
      
      <div className="filters">
        <div className="filter-group">
          <label>SOL Amount:</label>
          <input
            type="number"
            placeholder="Min"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="filter-group">
          <label>Currency:</label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Payment Method:</label>
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading offers...</div>
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
