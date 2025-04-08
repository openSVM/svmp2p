import React, { useState, useContext } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { AppContext } from '@/contexts/AppContext';
import idl from '@/idl/p2p_exchange.json'; // This will be the IDL for your program

const { Keypair } = web3;

const OfferCreation = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useContext(AppContext);
  
  // Form state
  const [solAmount, setSolAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  
  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Available currencies and payment methods
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  const paymentMethods = ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Revolut'];
  
  // Create Anchor provider and program
  const getProgram = () => {
    if (!wallet.publicKey) return null;
    
    // Updated for @coral-xyz/anchor 0.31.0
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );
    
    return new Program(idl, new PublicKey(network.programId), provider);
  };
  
  // Create and list offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!solAmount || !fiatAmount) {
      setError('Please enter both SOL and fiat amounts');
      return;
    }
    
    setIsCreating(true);
    setError('');
    setSuccess('');
    
    try {
      const program = getProgram();
      if (!program) {
        throw new Error('Failed to initialize program');
      }
      
      // Convert SOL to lamports
      const lamports = new BN(parseFloat(solAmount) * LAMPORTS_PER_SOL);
      
      // Convert fiat amount to integer (e.g., cents)
      const fiatAmountInt = new BN(parseFloat(fiatAmount) * 100);
      
      // Generate a new account for the offer
      const offer = Keypair.generate();
      
      // Generate a new account for the escrow
      const escrow = Keypair.generate();
      
      // Current timestamp
      const now = new BN(Math.floor(Date.now() / 1000));
      
      console.log('Creating offer...');
      
      // Create offer
      await program.methods
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
      
      console.log('Listing offer...');
      
      // List offer
      await program.methods
        .listOffer()
        .accounts({
          offer: offer.publicKey,
          seller: wallet.publicKey,
        })
        .rpc();
      
      setSuccess(`Offer created and listed successfully! Offer ID: ${offer.publicKey.toString()}`);
      
      // Reset form
      setSolAmount('');
      setFiatAmount('');
      
    } catch (err) {
      console.error('Error creating offer:', err);
      setError(`Failed to create offer: ${err.message}`);
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
  
  return (
    <div className="offer-creation-container">
      <h2>Create a Sell Offer</h2>
      <p>Create an offer to sell SOL for fiat currency</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
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
        
        <button
          type="submit"
          className="create-offer-button"
          disabled={!wallet.publicKey || isCreating}
        >
          {isCreating ? 'Creating Offer...' : 'Create Offer'}
        </button>
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
