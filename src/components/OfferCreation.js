import React, { useState, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { AppContext } from '../contexts/AppContext';
import { ButtonLoader, TransactionConfirmation, TransactionStatus } from './common';

const OfferCreation = () => {
  const { wallet } = useWallet();
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
  
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  const paymentMethods = ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
  
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
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
      <h2>Create a Sell Offer</h2>
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
          <label htmlFor="solAmount">SOL Amount</label>
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
          <label htmlFor="fiatCurrency">Fiat Currency</label>
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
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method</label>
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
          disabled={!wallet.publicKey}
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
    </div>
  );
};
export { OfferCreation };
export default OfferCreation;
