import React, { useState, useContext } from 'react';
import { SystemProgram, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
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

import { usePhantomWallet } from '../contexts/PhantomWalletProvider';
import { useActionDebounce, useInputValidation } from '../hooks/useActionDebounce';
import { validateSolAmount, validateFiatAmount, validateMarketRate } from '../utils/validation';
import { createLogger } from '../utils/logger';
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_PAYMENT_METHODS,
  VALIDATION_CONSTRAINTS
} from '../constants/tradingConstants';
import { useRealPriceData, useCalculateFiatAmount } from '../hooks/usePriceData';
import ConnectWalletPrompt from './ConnectWalletPrompt';

const logger = createLogger('OfferCreation');

const OfferCreation = ({ onStartGuidedWorkflow }) => {
  const wallet = usePhantomWallet();
  const { program, network, connection } = useContext(AppContext);
  
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
  
  // Get real price data
  const { prices, loading: pricesLoading, error: pricesError, lastUpdated } = useRealPriceData();
  const { fiatAmount: calculatedFiatAmount, isValid: priceCalculationValid } = useCalculateFiatAmount(solAmount, fiatCurrency);
  
  // Validation states
  const solValidation = useInputValidation(solAmount, validateSolAmount);
  const fiatValidation = useInputValidation(fiatAmount, (value) => validateFiatAmount(value, fiatCurrency));
  const rateValidation = useInputValidation(
    `${solAmount}-${fiatAmount}-${fiatCurrency}`, 
    () => validateMarketRate(parseFloat(solAmount), parseFloat(fiatAmount), fiatCurrency)
  );
  
  // Debounced action handler
  const { debouncedCallback: debouncedCreateOffer, isDisabled: isActionDisabled } = useActionDebounce(
    processCreateOffer,
    1000
  );
  
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!wallet.publicKey || !wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!program) {
      setError('Program not initialized. Please ensure your wallet is connected and try again.');
      return;
    }
    
    // Validate inputs before proceeding
    if (!solValidation.isValid) {
      setError(solValidation.error);
      return;
    }
    
    if (!fiatValidation.isValid) {
      setError(fiatValidation.error);
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  // Actual offer creation after confirmation
  async function processCreateOffer() {
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
      
      // Calculate PDA for escrow account
      const [escrowAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          offer.publicKey.toBuffer()
        ],
        program.programId
      );
      
      // Current timestamp
      const now = new BN(Math.floor(Date.now() / 1000));
      
      logger.info('Creating offer', { 
        solAmountLamports: lamports.toString(),
        fiatAmount: parseFloat(fiatAmount),
        currency: fiatCurrency,
        paymentMethod: paymentMethod
      });
      
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
          escrowAccount: escrowAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([offer])
        .rpc();
      
      setTxHash(createTx);
      setTxStatus({
        status: 'success',
        message: 'Offer created successfully! Now listing your offer...'
      });
      
      logger.info('Listing offer', { offerPubkey: offer.publicKey.toString() });
      
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
      logger.error('Error creating offer', { 
        error: err.message, 
        solAmount, 
        fiatAmount, 
        currency: fiatCurrency,
        paymentMethod: paymentMethod
      });
      setError(`Failed to create offer: ${err.message}`);
      setTxStatus({
        status: 'error',
        message: `Transaction failed: ${err.message}`
      });
    } finally {
      setIsCreating(false);
    }
  }
  
  // Calculate fiat amount based on SOL amount using real prices
  const handleSolAmountChange = (e) => {
    const sol = e.target.value;
    setSolAmount(sol);
    
    if (sol && !isNaN(sol) && prices && prices[fiatCurrency]) {
      const calculatedFiat = (parseFloat(sol) * prices[fiatCurrency]).toFixed(2);
      setFiatAmount(calculatedFiat);
    } else if (!sol) {
      setFiatAmount('');
    }
  };
  
  // Calculate SOL amount based on fiat amount using real prices
  const handleFiatAmountChange = (e) => {
    const fiat = e.target.value;
    setFiatAmount(fiat);
    
    if (fiat && !isNaN(fiat) && prices && prices[fiatCurrency] && prices[fiatCurrency] > 0) {
      const calculatedSol = (parseFloat(fiat) / prices[fiatCurrency]).toFixed(6);
      setSolAmount(calculatedSol);
    } else if (!fiat) {
      setSolAmount('');
    }
  };
  
  // Update fiat amount when currency changes using real prices
  const handleCurrencyChange = (e) => {
    setFiatCurrency(e.target.value);
    if (solAmount && !isNaN(solAmount) && prices && prices[e.target.value]) {
      // Recalculate fiat amount with new currency
      const calculatedFiat = (parseFloat(solAmount) * prices[e.target.value]).toFixed(2);
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
      
      {/* Demo mode banner for non-connected users */}
      {!wallet.connected && (
        <div className="wallet-connection-prompt">
          <ConnectWalletPrompt
            action="create real offers and trade on the blockchain"
            showAsMessage={true}
          />
        </div>
      )}
      
      <p>Create an offer to sell SOL for fiat currency</p>
      
      {/* Price data status */}
      {pricesError && (
        <div className="warning-message">
          Warning: Unable to fetch current market prices. Please verify amounts manually.
        </div>
      )}
      
      {prices && lastUpdated && (
        <div className="price-info">
          Current SOL price: {prices[fiatCurrency]?.toFixed(2)} {fiatCurrency}
          <span className="price-updated">
            (Updated: {lastUpdated.toLocaleTimeString()})
          </span>
        </div>
      )}
      
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
      
      <div className="ascii-form">
        <div className="ascii-form-header">CREATE SELL OFFER</div>
        
        <form onSubmit={handleCreateOffer}>
          {/* Primary amount fields in one row */}
          <div className="ascii-form-row-2">
            <div className="ascii-field">
              <label htmlFor="solAmount">
                <Tooltip content="Enter the amount of SOL you want to sell">
                  <span>SOL AMOUNT</span>
                </Tooltip>
              </label>
              <input
                id="solAmount"
                type="number"
                value={solAmount}
                onChange={handleSolAmountChange}
                placeholder="0.00 SOL"
                min={VALIDATION_CONSTRAINTS.SOL_AMOUNT.min}
                max={VALIDATION_CONSTRAINTS.SOL_AMOUNT.max}
                step={VALIDATION_CONSTRAINTS.SOL_AMOUNT.step}
                required
                className={!solValidation.isValid ? 'input-error' : ''}
              />
              {!solValidation.isValid && (
                <div className="ascii-field-error-message">{solValidation.error}</div>
              )}
            </div>
            
            <div className="ascii-field">
              <label htmlFor="fiatAmount">
                <Tooltip content="The amount in fiat currency you will receive">
                  <span>FIAT AMOUNT</span>
                </Tooltip>
              </label>
              <input
                id="fiatAmount"
                type="number"
                value={fiatAmount}
                onChange={handleFiatAmountChange}
                placeholder="0.00"
                min={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.min}
                max={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.max}
                step={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.step}
                required
                className={!fiatValidation.isValid ? 'input-error' : ''}
              />
              {!fiatValidation.isValid && (
                <div className="ascii-field-error-message">{fiatValidation.error}</div>
              )}
              {rateValidation.error && (
                <div className="ascii-field-help">{rateValidation.error}</div>
              )}
            </div>
          </div>
          
          {/* Currency and payment method in one row */}
          <div className="ascii-form-row-2">
            <div className="ascii-field">
              <label htmlFor="fiatCurrency">
                <Tooltip content="Select the currency you want to receive">
                  <span>CURRENCY</span>
                </Tooltip>
              </label>
              <select
                id="fiatCurrency"
                value={fiatCurrency}
                onChange={handleCurrencyChange}
                required
              >
                {SUPPORTED_CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            
            <div className="ascii-field">
              <label htmlFor="paymentMethod">
                <Tooltip content="Select how you want to receive payment">
                  <span>PAYMENT METHOD</span>
                </Tooltip>
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                {SUPPORTED_PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="ascii-form-actions">
            {!wallet.connected ? (
              <ConnectWalletPrompt
                action="create sell offers"
                className="create-offer-button connect-wallet-button"
              />
            ) : !program ? (
              <button 
                type="button"
                disabled={true}
                className="create-offer-button disabled"
                title="Initializing smart contract connection..."
              >
                Connecting to Smart Contract...
              </button>
            ) : (
              <ButtonLoader
                type="submit"
                isLoading={isCreating}
                disabled={!wallet.connected || !wallet.publicKey || isActionDisabled || !solValidation.isValid || !fiatValidation.isValid || !program}
                loadingText="Creating Offer..."
                variant="primary"
                size="medium"
                className="create-offer-button"
              >
                Create Offer
              </ButtonLoader>
            )}
          </div>
        </form>
      </div>
      
      <div className="network-info">
        <p>Network: {network.name}</p>
        <p>Prices are fetched from live market data sources.</p>
        <p>Your SOL will be held in escrow until the trade is completed.</p>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={debouncedCreateOffer}
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
          background-color: var(--ascii-neutral-700);
          color: var(--ascii-white);
          border: 1px solid var(--ascii-neutral-800);
          padding: 8px 16px;
          border-radius: 0;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', Courier, monospace;
          text-transform: uppercase;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }

        .guided-workflow-button::before {
          content: "?";
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background-color: var(--ascii-neutral-500);
          border: 1px solid var(--ascii-neutral-600);
          border-radius: 0;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .guided-workflow-button:hover {
          background-color: var(--ascii-neutral-600);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 1px #ef4444;
        }

        .validation-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .validation-warning {
          color: #f59e0b;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .price-info {
          background: var(--color-background-alt);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 12px;
          margin: 1rem 0;
          font-size: 0.9rem;
          color: var(--color-foreground-muted);
        }

        .price-updated {
          margin-left: 10px;
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .warning-message {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 12px;
          border-radius: 4px;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .wallet-connection-prompt {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};
export { OfferCreation };
export default OfferCreation;
