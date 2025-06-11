import React, { useState, useContext } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// Import BN from @coral-xyz/anchor as a fallback for @project-serum/anchor
import { BN } from '@coral-xyz/anchor';
import { AppContext } from '../contexts/AppContext';
import { 
  ButtonLoader, 
  TransactionConfirmation, 
  TransactionStatus, 
  Tooltip, 
  ConfirmationDialog 
} from './common';


import { useSafeWallet } from '../contexts/WalletContextProvider';

const OfferCreation = ({ onStartGuidedWorkflow }) => {
  const wallet = useSafeWallet();
  const { connection } = useConnection();
  const { program, network } = useContext(AppContext);
  
  const [solAmount, setSolAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  const paymentMethods = ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
  
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!wallet.publicKey || !wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  // Actual offer creation after confirmation
  const processCreateOffer = async () => {
    setError('');
    setSuccess('');
    setIsCreating(true);
    setTxStatus({
      status: 'pending',
      message: 'Creating your offer...'
    });
    
    try {
      // Convert SOL to lamports
      const lamports = new BN(parseFloat(solAmount) * LAMPORTS_PER_SOL);
      
      // Convert fiat amount to integer (cents/pennies)
      const fiatAmountInt = new BN(Math.round(parseFloat(fiatAmount) * 100));
      
      // Generate a new account for the offer
      const offer = Keypair.generate();
      
      // Generate a new account for the escrow
      const escrow = Keypair.generate();
      
      // Current timestamp
      const now = new BN(Math.floor(Date.now() / 1000));
      
      console.log('Creating offer...');
      
      // Create offer
      const createTx = await program.methods
        .createOffer(
          lamports,
          fiatAmountInt,
          fiatCurrency,
          paymentMethod,
          now
        )
        .accounts({
          offer: offer.publicKey,
          seller: wallet.publicKey,
          escrowAccount: escrow.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([offer, escrow])
        .rpc();
      
      setTxHash(createTx);
      setTxStatus({
        status: 'success',
        message: 'Offer created successfully! Now listing your offer...'
      });
      
      console.log('Listing offer...');
      
      // List offer
      const listTx = await program.methods
        .listOffer()
        .accounts({
          offer: offer.publicKey,
          seller: wallet.publicKey,
        })
        .rpc();
      
      setTxHash(listTx);
      setTxStatus({
        status: 'success',
        message: 'Offer listed successfully!'
      });
      
      setSuccess(`Offer created and listed successfully! Offer ID: ${offer.publicKey.toString()}`);
      
      // Reset form
      setSolAmount('');
      setFiatAmount('');
      
    } catch (err) {
      console.error('Error creating offer:', err);
      setError(`Failed to create offer: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Transaction failed: ${err.message}`
      });
    } finally {
      setIsCreating(false);
    }
  };
  
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
  
  // Clear transaction status
  const handleClearTxStatus = () => {
    setTxStatus(null);
  };
  
  return (
    <div className="offer-creation-container">
      <div className="offer-creation-header">
        <h2>Create a Sell Offer</h2>
        
        {/* Guided workflow option */}
        {onStartGuidedWorkflow && (
          <Tooltip 
            content="Start a guided selling process with step-by-step instructions" 
            position="bottom"
          >
            <button 
              className="guided-workflow-button"
              onClick={() => onStartGuidedWorkflow('sell')}
            >
              Need help? Use guided workflow
            </button>
          </Tooltip>
        )}
      </div>
      
      <p>Create an offer to sell SOL for fiat currency</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {txHash && success && (
        <TransactionConfirmation
          status="success"
          txHash={txHash}
          message="Your offer has been created and listed successfully!"
          onClose={() => setTxHash('')}
          network={network.name.toLowerCase()}
        />
      )}
      
      {txStatus && (
        <TransactionStatus
          status={txStatus.status}
          message={txStatus.message}
          onClose={handleClearTxStatus}
        />
      )}
      
      <form onSubmit={handleCreateOffer}>
        <div className="form-group">
          <label htmlFor="solAmount">
            <Tooltip content="Enter the amount of SOL you want to sell">
              <span>SOL Amount</span>
            </Tooltip>
          </label>
          <input
            id="solAmount"
            type="number"
            value={solAmount}
            onChange={handleSolAmountChange}
            placeholder="Enter SOL amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fiatCurrency">
            <Tooltip content="Select the currency you want to receive">
              <span>Fiat Currency</span>
            </Tooltip>
          </label>
          <select
            id="fiatCurrency"
            value={fiatCurrency}
            onChange={handleCurrencyChange}
            required
          >
            {currencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="fiatAmount">
            <Tooltip content="The amount in fiat currency you will receive">
              <span>Fiat Amount</span>
            </Tooltip>
          </label>
          <input
            id="fiatAmount"
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            placeholder="Enter fiat amount"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="paymentMethod">
            <Tooltip content="Select how you want to receive payment">
              <span>Payment Method</span>
            </Tooltip>
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        
        <ButtonLoader
          type="submit"
          isLoading={isCreating}
          disabled={!wallet.connected || !wallet.publicKey}
          loadingText="Creating Offer..."
          variant="primary"
          size="medium"
          className="create-offer-button"
        >
          Create Offer
        </ButtonLoader>
      </form>
      
      <div className="network-info">
        <p>Network: {network.name}</p>
        <p>Current SOL price is estimated based on market rates.</p>
        <p>Your SOL will be held in escrow until the trade is completed.</p>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={processCreateOffer}
        title="Confirm Offer Creation"
        message={`Are you sure you want to create an offer to sell ${solAmount} SOL for ${fiatAmount} ${fiatCurrency}? This will lock your SOL in an escrow contract.`}
        variant="default"
      />
      
      <style jsx>{`
        .offer-creation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .guided-workflow-button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .guided-workflow-button::before {
          content: "?";
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .guided-workflow-button:hover {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
};
export { OfferCreation };
export default OfferCreation;
