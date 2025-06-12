import React, { useState, useContext } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
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

import { useSafeWallet } from '../contexts/WalletContextProvider';
import { useActionDebounce, useInputValidation } from '../hooks/useActionDebounce';
import { validateSolAmount, validateFiatAmount, validateMarketRate } from '../utils/validation';
import { createLogger } from '../utils/logger';
import { 
  MOCK_SOL_PRICES, 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_PAYMENT_METHODS,
  VALIDATION_CONSTRAINTS,
  DEMO_MODE 
} from '../constants/tradingConstants';
import ConnectWalletPrompt from './ConnectWalletPrompt';
import DemoIndicator from './DemoIndicator';

const logger = createLogger('OfferCreation');

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
        solAmountLamports: solAmountLamports.toString(),
        fiatAmount: parseFloat(fiatAmount),
        currency: selectedCurrency,
        paymentMethod: selectedPaymentMethod
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
      
      logger.info('Listing offer', { offerPubkey: offerKeypair.publicKey.toString() });
      
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
        currency: selectedCurrency,
        paymentMethod: selectedPaymentMethod
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
  
  // Calculate fiat amount based on SOL amount (simple conversion for demo)
  const handleSolAmountChange = (e) => {
    const sol = e.target.value;
    setSolAmount(sol);
    
    if (sol && !isNaN(sol)) {
      const calculatedFiat = (parseFloat(sol) * MOCK_SOL_PRICES[fiatCurrency]).toFixed(2);
      setFiatAmount(calculatedFiat);
    }
  };
  
  // Update fiat amount when currency changes
  const handleCurrencyChange = (e) => {
    setFiatCurrency(e.target.value);
    if (solAmount && !isNaN(solAmount)) {
      // Recalculate fiat amount with new currency
      const calculatedFiat = (parseFloat(solAmount) * MOCK_SOL_PRICES[e.target.value]).toFixed(2);
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
      {!wallet.connected && DEMO_MODE.enabled && (
        <DemoIndicator
          type="banner"
          message="Connect Wallet to Create Real Offers"
          tooltip={DEMO_MODE.educationalMessages.createOffer}
          className="demo-banner-main"
        />
      )}
      
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
            min={VALIDATION_CONSTRAINTS.SOL_AMOUNT.min}
            max={VALIDATION_CONSTRAINTS.SOL_AMOUNT.max}
            step={VALIDATION_CONSTRAINTS.SOL_AMOUNT.step}
            required
            className={!solValidation.isValid ? 'input-error' : ''}
          />
          {!solValidation.isValid && (
            <div className="validation-error">{solValidation.error}</div>
          )}
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
            {SUPPORTED_CURRENCIES.map(currency => (
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
            min={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.min}
            max={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.max}
            step={VALIDATION_CONSTRAINTS.FIAT_AMOUNT.step}
            required
            className={!fiatValidation.isValid ? 'input-error' : ''}
          />
          {!fiatValidation.isValid && (
            <div className="validation-error">{fiatValidation.error}</div>
          )}
          {rateValidation.error && (
            <div className="validation-warning">{rateValidation.error}</div>
          )}
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
            {SUPPORTED_PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        
        {/* Submit button or connect wallet prompt */}
        {!wallet.connected ? (
          <ConnectWalletPrompt
            action="create sell offers"
            className="create-offer-button connect-wallet-button"
          />
        ) : (
          <ButtonLoader
            type="submit"
            isLoading={isCreating}
            disabled={!wallet.connected || !wallet.publicKey || isActionDisabled || !solValidation.isValid || !fiatValidation.isValid}
            loadingText="Creating Offer..."
            variant="primary"
            size="medium"
            className="create-offer-button"
          >
            Create Offer
          </ButtonLoader>
        )}
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
          background-color: var(--color-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 0;
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
          border-radius: 0;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .guided-workflow-button:hover {
          background-color: var(--color-primary-dark);
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
      `}</style>
    </div>
  );
};
export { OfferCreation };
export default OfferCreation;
