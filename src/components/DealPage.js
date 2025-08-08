import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AppContext } from '../contexts/AppContext';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';
import { useProgram } from '../hooks/useProgram';
import { useOffers } from '../hooks/useOnChainData';
import { useRealPriceData } from '../hooks/usePriceData';
import ConnectWalletPrompt from './ConnectWalletPrompt';

export default function DealPage() {
  const router = useRouter();
  const { id } = router.query;
  const { network } = useContext(AppContext);
  const { connected, publicKey, connection } = usePhantomWallet();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    bankDetails: '',
    paypalEmail: '',
    notes: ''
  });
  
  // Initialize program
  const program = useProgram(connection, { publicKey, signTransaction: () => {} });
  
  // Get real prices
  const { prices } = useRealPriceData();

  // Fetch the specific offer
  useEffect(() => {
    const fetchOffer = async () => {
      if (!program || !id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Convert string ID to PublicKey
        const offerPublicKey = new PublicKey(id);
        
        // Fetch the specific offer account
        const offerAccount = await program.account.offer.fetch(offerPublicKey);
        
        // Process the offer data
        const processedOffer = {
          id: id,
          seller: offerAccount.seller.toString(),
          buyer: offerAccount.buyer ? offerAccount.buyer.toString() : null,
          solAmount: parseFloat(offerAccount.amount.toString()) / 1e9,
          fiatAmount: parseFloat(offerAccount.fiatAmount.toString()) / 100,
          fiatCurrency: offerAccount.fiatCurrency,
          paymentMethod: offerAccount.paymentMethod,
          status: getOfferStatusString(offerAccount.status),
          createdAt: offerAccount.createdAt.toNumber() * 1000,
          updatedAt: offerAccount.updatedAt.toNumber() * 1000,
          escrowAccount: offerAccount.escrowAccount.toString(),
          disputeId: offerAccount.disputeId ? offerAccount.disputeId.toString() : null
        };
        
        setOffer(processedOffer);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Failed to load offer details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOffer();
  }, [program, id]);

  // Helper function to get offer status string
  const getOfferStatusString = (status) => {
    const statusMap = {
      0: 'Created',
      1: 'Listed', 
      2: 'Accepted',
      3: 'AwaitingFiatPayment',
      4: 'FiatSent',
      5: 'SolReleased',
      6: 'DisputeOpened',
      7: 'Completed',
      8: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
  };

  // Handle offer acceptance (buyer)
  const handleAcceptOffer = async () => {
    if (!connected || !offer || !program) return;
    
    setActionLoading(true);
    
    try {
      // Create accept transaction
      const tx = await program.methods
        .acceptOffer(new anchor.BN(1000000)) // Security bond in lamports
        .accounts({
          offer: new PublicKey(offer.id),
          buyer: publicKey,
          escrowAccount: new PublicKey(offer.escrowAccount),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
        
      console.log('Accept offer transaction:', tx);
      
      // Refresh offer data
      router.reload();
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      setError('Failed to accept offer');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle fiat payment sent (buyer)
  const handleMarkFiatSent = async () => {
    if (!connected || !offer || !program) return;
    
    setActionLoading(true);
    
    try {
      const tx = await program.methods
        .markFiatSent()
        .accounts({
          offer: new PublicKey(offer.id),
          buyer: publicKey,
        })
        .rpc();
        
      console.log('Mark fiat sent transaction:', tx);
      router.reload();
      
    } catch (err) {
      console.error('Error marking fiat sent:', err);
      setError('Failed to mark payment as sent');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle fiat receipt confirmation (seller)
  const handleConfirmFiatReceipt = async () => {
    if (!connected || !offer || !program) return;
    
    setActionLoading(true);
    
    try {
      const tx = await program.methods
        .confirmFiatReceipt()
        .accounts({
          offer: new PublicKey(offer.id),
          seller: publicKey,
        })
        .rpc();
        
      console.log('Confirm fiat receipt transaction:', tx);
      router.reload();
      
    } catch (err) {
      console.error('Error confirming fiat receipt:', err);
      setError('Failed to confirm payment receipt');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle SOL release (automatic after confirmation)
  const handleClaimSol = async () => {
    if (!connected || !offer || !program) return;
    
    setActionLoading(true);
    
    try {
      const tx = await program.methods
        .releaseSol()
        .accounts({
          offer: new PublicKey(offer.id),
          seller: new PublicKey(offer.seller),
          buyer: new PublicKey(offer.buyer),
          escrowAccount: new PublicKey(offer.escrowAccount),
        })
        .rpc();
        
      console.log('Claim SOL transaction:', tx);
      router.reload();
      
    } catch (err) {
      console.error('Error claiming SOL:', err);
      setError('Failed to claim SOL');
    } finally {
      setActionLoading(false);
    }
  };

  if (!connected) {
    return <ConnectWalletPrompt />;
  }

  if (loading) {
    return (
      <div className="deal-loading">
        <div className="loading-spinner"></div>
        <p>Loading deal details...</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="deal-error">
        <h2>Deal Not Found</h2>
        <p>{error || 'The requested deal could not be found.'}</p>
        <button onClick={() => router.back()} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  const isUserSeller = publicKey && offer.seller === publicKey.toString();
  const isUserBuyer = publicKey && offer.buyer === publicKey.toString();
  const isUserInvolved = isUserSeller || isUserBuyer;
  const canAccept = !offer.buyer && !isUserSeller;
  const canMarkFiatSent = isUserBuyer && offer.status === 'Accepted';
  const canConfirmReceipt = isUserSeller && offer.status === 'FiatSent';
  const canClaimSol = isUserBuyer && offer.status === 'SolReleased';
  
  const currentPrice = prices?.USD || 150;
  const rate = (offer.fiatAmount / offer.solAmount).toFixed(2);

  return (
    <div className="deal-page">
      <div className="deal-header">
        <div className="deal-title">
          <h1>Deal #{offer.id.slice(0, 8)}...</h1>
          <div className={`deal-status status-${offer.status.toLowerCase()}`}>
            {offer.status}
          </div>
        </div>
        <button onClick={() => router.back()} className="back-button">
          ← Back to Offers
        </button>
      </div>

      <div className="deal-content">
        <div className="deal-details">
          <div className="offer-info">
            <h2>Offer Details</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>SOL Amount:</label>
                <span>{offer.solAmount.toFixed(4)} SOL</span>
              </div>
              <div className="info-item">
                <label>Fiat Amount:</label>
                <span>{offer.fiatAmount.toFixed(2)} {offer.fiatCurrency}</span>
              </div>
              <div className="info-item">
                <label>Rate:</label>
                <span>{rate} {offer.fiatCurrency}/SOL</span>
              </div>
              <div className="info-item">
                <label>Payment Method:</label>
                <span>{offer.paymentMethod}</span>
              </div>
              <div className="info-item">
                <label>Seller:</label>
                <span>{offer.seller.slice(0, 8)}...{offer.seller.slice(-4)}</span>
              </div>
              {offer.buyer && (
                <div className="info-item">
                  <label>Buyer:</label>
                  <span>{offer.buyer.slice(0, 8)}...{offer.buyer.slice(-4)}</span>
                </div>
              )}
              <div className="info-item">
                <label>Created:</label>
                <span>{new Date(offer.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="trading-flow">
            <h2>Trading Process</h2>
            <div className="flow-steps">
              <div className={`step ${offer.status === 'Listed' ? 'current' : offer.status !== 'Created' ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Offer Listed</h3>
                  <p>Seller has posted the offer</p>
                </div>
              </div>
              
              <div className={`step ${offer.status === 'Accepted' ? 'current' : ['AwaitingFiatPayment', 'FiatSent', 'SolReleased', 'Completed'].includes(offer.status) ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Offer Accepted</h3>
                  <p>Buyer accepts and provides payment details</p>
                </div>
              </div>
              
              <div className={`step ${offer.status === 'FiatSent' ? 'current' : ['SolReleased', 'Completed'].includes(offer.status) ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Payment Sent</h3>
                  <p>Buyer sends fiat payment</p>
                </div>
              </div>
              
              <div className={`step ${offer.status === 'SolReleased' ? 'current' : offer.status === 'Completed' ? 'completed' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Payment Confirmed</h3>
                  <p>Seller confirms receipt</p>
                </div>
              </div>
              
              <div className={`step ${offer.status === 'Completed' ? 'completed current' : ''}`}>
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>SOL Released</h3>
                  <p>Transaction completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="deal-actions">
          <div className="action-panel">
            <h2>Available Actions</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {canAccept && (
              <div className="action-section">
                <h3>Accept This Offer</h3>
                <p>To accept this offer, you'll need to provide your payment details so the seller knows where to receive payment.</p>
                
                {!showPaymentDetails ? (
                  <button 
                    onClick={() => setShowPaymentDetails(true)}
                    className="action-button primary"
                  >
                    Accept Offer & Add Payment Details
                  </button>
                ) : (
                  <div className="payment-details-form">
                    <h4>Payment Details for {offer.paymentMethod}</h4>
                    
                    {offer.paymentMethod.toLowerCase().includes('bank') && (
                      <div className="form-group">
                        <label>Bank Account Details:</label>
                        <textarea
                          value={paymentDetails.bankDetails}
                          onChange={(e) => setPaymentDetails({...paymentDetails, bankDetails: e.target.value})}
                          placeholder="Account number, routing number, bank name..."
                          rows={3}
                        />
                      </div>
                    )}
                    
                    {offer.paymentMethod.toLowerCase().includes('card') && (
                      <div className="form-group">
                        <label>Card Number:</label>
                        <input
                          type="text"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                          placeholder="Card number for receiving payment"
                        />
                      </div>
                    )}
                    
                    {offer.paymentMethod.toLowerCase().includes('paypal') && (
                      <div className="form-group">
                        <label>PayPal Email:</label>
                        <input
                          type="email"
                          value={paymentDetails.paypalEmail}
                          onChange={(e) => setPaymentDetails({...paymentDetails, paypalEmail: e.target.value})}
                          placeholder="your.email@example.com"
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Additional Notes:</label>
                      <textarea
                        value={paymentDetails.notes}
                        onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})}
                        placeholder="Any additional instructions for the seller..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        onClick={handleAcceptOffer}
                        disabled={actionLoading}
                        className="action-button primary"
                      >
                        {actionLoading ? 'Processing...' : 'Confirm & Accept Offer'}
                      </button>
                      <button 
                        onClick={() => setShowPaymentDetails(false)}
                        className="action-button secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {canMarkFiatSent && (
              <div className="action-section">
                <h3>Mark Payment as Sent</h3>
                <p>Click here after you have sent the fiat payment to the seller using the agreed payment method.</p>
                <button 
                  onClick={handleMarkFiatSent}
                  disabled={actionLoading}
                  className="action-button primary"
                >
                  {actionLoading ? 'Processing...' : 'I Have Sent Payment'}
                </button>
              </div>
            )}

            {canConfirmReceipt && (
              <div className="action-section">
                <h3>Confirm Payment Receipt</h3>
                <p>Click here once you have received and verified the fiat payment from the buyer.</p>
                <button 
                  onClick={handleConfirmFiatReceipt}
                  disabled={actionLoading}
                  className="action-button primary"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Payment Received'}
                </button>
              </div>
            )}

            {canClaimSol && (
              <div className="action-section">
                <h3>Claim Your SOL</h3>
                <p>The seller has confirmed receipt of payment. You can now claim your SOL.</p>
                <button 
                  onClick={handleClaimSol}
                  disabled={actionLoading}
                  className="action-button primary"
                >
                  {actionLoading ? 'Processing...' : `Claim ${offer.solAmount.toFixed(4)} SOL`}
                </button>
              </div>
            )}

            {!isUserInvolved && !canAccept && (
              <div className="info-message">
                <p>This deal is between other users. You can only view the details.</p>
              </div>
            )}

            {isUserInvolved && offer.status === 'Completed' && (
              <div className="success-message">
                <h3>✅ Trade Completed Successfully!</h3>
                <p>This trade has been completed successfully. Thank you for using OpenSVM P2P Exchange!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .deal-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .deal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        
        .deal-title h1 {
          margin: 0;
          font-family: var(--font-family-mono);
          color: var(--color-foreground);
        }
        
        .deal-status {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: bold;
          margin-top: 0.5rem;
        }
        
        .status-listed { background: var(--color-info); color: white; }
        .status-accepted { background: var(--color-warning); color: white; }
        .status-fiatsent { background: var(--color-primary); color: white; }
        .status-solreleased { background: var(--color-success); color: white; }
        .status-completed { background: var(--color-success); color: white; }
        
        .back-button {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          color: var(--color-foreground);
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--font-family-mono);
        }
        
        .back-button:hover {
          background: var(--color-background-alt);
        }
        
        .deal-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
        }
        
        .offer-info, .trading-flow, .action-panel {
          background: var(--color-background-alt);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }
        
        .offer-info h2, .trading-flow h2, .action-panel h2 {
          margin-top: 0;
          font-family: var(--font-family-mono);
          color: var(--color-foreground);
        }
        
        .info-grid {
          display: grid;
          gap: 1rem;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        
        .info-item label {
          font-weight: bold;
          color: var(--color-foreground-muted);
        }
        
        .info-item span {
          font-family: var(--font-family-mono);
          color: var(--color-foreground);
        }
        
        .flow-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .step {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 6px;
          background: var(--color-background);
          border: 1px solid var(--color-border);
        }
        
        .step.completed {
          background: rgba(34, 197, 94, 0.1);
          border-color: var(--color-success);
        }
        
        .step.current {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--color-primary);
        }
        
        .step-number {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--color-border);
          color: var(--color-foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .step.completed .step-number {
          background: var(--color-success);
          color: white;
        }
        
        .step.current .step-number {
          background: var(--color-primary);
          color: white;
        }
        
        .step-content h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }
        
        .step-content p {
          margin: 0;
          color: var(--color-foreground-muted);
          font-size: 0.9rem;
        }
        
        .action-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--color-border);
        }
        
        .action-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .action-section h3 {
          margin-top: 0;
          color: var(--color-foreground);
        }
        
        .action-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-family: var(--font-family-mono);
          text-transform: uppercase;
          border: none;
          transition: all 0.2s;
        }
        
        .action-button.primary {
          background: var(--color-primary);
          color: white;
        }
        
        .action-button.primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }
        
        .action-button.secondary {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .payment-details-form {
          margin-top: 1rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: var(--color-foreground);
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-background);
          color: var(--color-foreground);
          font-family: var(--font-family-mono);
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--color-error);
          color: var(--color-error);
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        
        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid var(--color-success);
          color: var(--color-success);
          padding: 1.5rem;
          border-radius: 6px;
          text-align: center;
        }
        
        .success-message h3 {
          margin-top: 0;
          color: var(--color-success);
        }
        
        .info-message {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
        }
        
        .deal-loading, .deal-error {
          text-align: center;
          padding: 3rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--color-border);
          border-top: 4px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .deal-content {
            grid-template-columns: 1fr;
          }
          
          .deal-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}