import React, { useState, useContext, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AppContext } from '../AppContext';
import idl from '../idl/p2p_exchange.json'; // This will be the IDL for your program

export const UserProfile = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useContext(AppContext);
  
  // State
  const [reputation, setReputation] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError('');
      
      if (!wallet.publicKey) {
        setLoading(false);
        return;
      }
      
      try {
        const program = getProgram();
        if (!program) {
          throw new Error('Failed to initialize program');
        }
        
        // Fetch reputation
        try {
          const reputationAccount = await program.account.reputation.fetch(wallet.publicKey);
          setReputation({
            successfulTrades: reputationAccount.successfulTrades,
            disputedTrades: reputationAccount.disputedTrades,
            disputesWon: reputationAccount.disputesWon,
            disputesLost: reputationAccount.disputesLost,
            rating: reputationAccount.rating,
            lastUpdated: new Date(reputationAccount.lastUpdated.toNumber() * 1000).toLocaleString(),
          });
        } catch (err) {
          console.log('No reputation account found, using mock data');
          setReputation(generateMockReputation());
        }
        
        // Fetch transactions (offers where user is seller or buyer)
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
        
        const allOffers = [...asSellerOffers, ...asBuyerOffers];
        
        // Process and set transactions
        setTransactions(allOffers.map(item => ({
          id: item.publicKey.toString(),
          type: item.account.seller.toString() === wallet.publicKey.toString() ? 'Sell' : 'Buy',
          solAmount: item.account.amount.toNumber() / LAMPORTS_PER_SOL,
          fiatAmount: item.account.fiatAmount ? item.account.fiatAmount.toNumber() / 100 : 0,
          fiatCurrency: item.account.fiatCurrency || 'USD',
          status: getStatusText(item.account.status),
          createdAt: new Date(item.account.createdAt.toNumber() * 1000).toLocaleString(),
          updatedAt: new Date(item.account.updatedAt.toNumber() * 1000).toLocaleString(),
        })));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data. Using mock data instead.');
        setReputation(generateMockReputation());
        setTransactions(generateMockTransactions());
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [wallet.publicKey, network]);
  
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
  
  // Generate mock reputation for display when wallet is not connected or no reputation found
  const generateMockReputation = () => {
    return {
      successfulTrades: Math.floor(Math.random() * 20),
      disputedTrades: Math.floor(Math.random() * 5),
      disputesWon: Math.floor(Math.random() * 3),
      disputesLost: Math.floor(Math.random() * 2),
      rating: Math.floor(Math.random() * 20) + 80, // 80-100 rating
      lastUpdated: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
    };
  };
  
  // Generate mock transactions for display when wallet is not connected
  const generateMockTransactions = () => {
    const mockTransactions = [];
    const statuses = ['Listed', 'Accepted', 'Awaiting Fiat Payment', 'Completed'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    
    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.5 ? 'Buy' : 'Sell';
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
      
      mockTransactions.push({
        id: `mock-transaction-${i}`,
        type,
        solAmount: parseFloat(solAmount),
        fiatAmount: parseFloat(fiatAmount),
        fiatCurrency,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
        updatedAt: new Date(Date.now() - Math.random() * 1000000000).toLocaleString(),
      });
    }
    
    return mockTransactions;
  };
  
  // Calculate reputation score
  const calculateReputationScore = (rep) => {
    if (!rep) return 0;
    
    // Simple calculation: base score + successful trades - disputes lost
    const baseScore = 50;
    const successBonus = rep.successfulTrades * 2;
    const disputePenalty = rep.disputesLost * 5;
    
    return Math.min(100, Math.max(0, baseScore + successBonus - disputePenalty));
  };
  
  // Get reputation level based on score
  const getReputationLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Neutral';
    return 'Poor';
  };
  
  // Get star rating based on score
  const getStarRating = (score) => {
    const fullStars = Math.floor(score / 20);
    const halfStar = score % 20 >= 10 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return (
      <div className="star-rating">
        {Array(fullStars).fill().map((_, i) => <span key={`full-${i}`} className="star full">★</span>)}
        {halfStar ? <span className="star half">★</span> : null}
        {Array(emptyStars).fill().map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
      </div>
    );
  };
  
  return (
    <div className="user-profile-container">
      <h2>User Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!wallet.publicKey ? (
        <div className="connect-wallet-message">
          <p>Please connect your wallet to view your profile.</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading profile data...</div>
      ) : (
        <div className="profile-content">
          <div className="profile-header">
            <div className="wallet-info">
              <h3>Wallet Address</h3>
              <p className="wallet-address">{wallet.publicKey.toString()}</p>
              <p className="network-info">Network: {network.name}</p>
            </div>
            
            <div className="reputation-summary">
              <h3>Reputation</h3>
              <div className="reputation-score">
                <div className="score-value">{calculateReputationScore(reputation)}</div>
                <div className="score-label">{getReputationLevel(calculateReputationScore(reputation))}</div>
                {getStarRating(calculateReputationScore(reputation))}
              </div>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="reputation-details">
              <h3>Trading History</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{reputation?.successfulTrades || 0}</div>
                  <div className="stat-label">Successful Trades</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{reputation?.disputedTrades || 0}</div>
                  <div className="stat-label">Disputed Trades</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{reputation?.disputesWon || 0}</div>
                  <div className="stat-label">Disputes Won</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{reputation?.disputesLost || 0}</div>
                  <div className="stat-label">Disputes Lost</div>
                </div>
              </div>
              <div className="last-updated">
                Last updated: {reputation?.lastUpdated || 'Never'}
              </div>
            </div>
            
            <div className="transaction-history">
              <h3>Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="no-transactions">No transactions found.</div>
              ) : (
                <div className="transactions-table">
                  <div className="table-header">
                    <div className="col type">Type</div>
                    <div className="col amount">Amount</div>
                    <div className="col fiat">Fiat</div>
                    <div className="col status">Status</div>
                    <div className="col date">Date</div>
                  </div>
                  
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="table-row">
                      <div className={`col type ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </div>
                      <div className="col amount">
                        {transaction.solAmount.toFixed(2)} SOL
                      </div>
                      <div className="col fiat">
                        {transaction.fiatAmount.toFixed(2)} {transaction.fiatCurrency}
                      </div>
                      <div className={`col status status-${transaction.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {transaction.status}
                      </div>
                      <div className="col date">
                        {transaction.createdAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            <h3>Account Actions</h3>
            <div className="actions-grid">
              <button className="action-button" onClick={() => alert('Feature coming soon!')}>
                Export Transaction History
              </button>
              <button className="action-button" onClick={() => alert('Feature coming soon!')}>
                Become a Juror
              </button>
              <button className="action-button" onClick={() => alert('Feature coming soon!')}>
                Stake Reputation
              </button>
              <button className="action-button" onClick={() => alert('Feature coming soon!')}>
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
