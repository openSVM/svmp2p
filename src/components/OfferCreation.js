import React, { useState, useContext, useEffect } from 'react';
import { SystemProgram, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// Import BN from @coral-xyz/anchor as a fallback for @project-serum/anchor
import { BN } from '@coral-xyz/anchor';
import { AppContext, CONNECTION_STATUS } from '../contexts/AppContext';
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
  const { 
    program, 
    network, 
    connection, 
    connectionStatus, 
    connectionError, 
    retryConnection, 
    connectionAttempts 
  } = useContext(AppContext);
  
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
  const [devnetBypass, setDevnetBypass] = useState(false);
  
  // Connection status tracking
  const isWalletConnected = wallet.connected && wallet.publicKey;
  const isSmartContractReady = (isWalletConnected && program && connection && connectionStatus === CONNECTION_STATUS.CONNECTED) || devnetBypass;
  const isConnectionFailed = connectionStatus === CONNECTION_STATUS.FAILED;
  const isConnectionRetrying = connectionStatus === CONNECTION_STATUS.RETRYING;
  const isConnectionConnecting = connectionStatus === CONNECTION_STATUS.CONNECTING;
  
  // Debug info for development
  useEffect(() => {
    console.log('[OfferCreation] Debug info:', {
      isWalletConnected,
      hasWallet: !!wallet,
      walletConnected: wallet.connected,
      hasWalletPublicKey: !!(wallet && wallet.publicKey),
      hasProgram: !!program,
      hasConnection: !!connection,
      connectionStatus,
      isSmartContractReady,
      devnetBypass
    });
  }, [isWalletConnected, wallet, program, connection, connectionStatus, isSmartContractReady, devnetBypass]);
  
  // Track connection status for better UX
  useEffect(() => {
    // Clear errors when connection improves
    if (connectionStatus === CONNECTION_STATUS.CONNECTED && error && error.includes('Smart contract connection')) {
      setError('');
    }
  }, [connectionStatus, error]);

  // Determine connection status for better UX
  const getConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case CONNECTION_STATUS.CONNECTING:
        return 'Connecting to Solana devnet...';
      case CONNECTION_STATUS.RETRYING:
        return `Retrying devnet connection... (Attempt ${connectionAttempts}/${5})`;
      case CONNECTION_STATUS.FAILED:
        return connectionError || 'Failed to connect to Solana devnet';
      case CONNECTION_STATUS.CONNECTED:
        return 'Connected to Solana devnet';
      default:
        return 'Disconnected from Solana devnet';
    }
  };
  
  // Get real price data
  const { prices, loading: pricesLoading, error: pricesError, lastUpdated } = useRealPriceData();
  const { fiatAmount: calculatedFiatAmount, isValid: priceCalculationValid } = useCalculateFiatAmount(solAmount, fiatCurrency);
  
  // Validation states
  const solValidation = useInputValidation(solAmount, validateSolAmount);
  const fiatValidation = useInputValidation(fiatAmount, (value) => validateFiatAmount(value, fiatCurrency));
  const rateValidation = useInputValidation(
    `${solAmount}-${fiatAmount}-${fiatCurrency}`, 
    () => validateMarketRate(parseFloat(solAmount), parseFloat(fiatAmount), fiatCurrency, prices)
  );
  
  // Debounced action handler
  const { debouncedCallback: debouncedCreateOffer, isDisabled: isActionDisabled } = useActionDebounce(
    processCreateOffer,
    1000
  );
  
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isSmartContractReady && !devnetBypass) {
      setError('Smart contract connection is not ready. Please check your devnet connection and try again.');
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

  const handleRetryConnection = async () => {
    if (isConnectionRetrying) return;
    setError('');
    retryConnection();
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
      
      <div className="app-form">
        <div className="app-form-header">CREATE SELL OFFER</div>
        
        <form onSubmit={handleCreateOffer} className="app-form-content">
          {/* Primary amount fields in one row */}
          <div className="app-form-row-2">
            <div className="app-field">
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
                <div className="app-field-error-message">{solValidation.error}</div>
              )}
            </div>
            
            <div className="app-field">
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
                <div className="app-field-error-message">{fiatValidation.error}</div>
              )}
              {rateValidation.error && (
                <div className="app-field-help">{rateValidation.error}</div>
              )}
            </div>
          </div>
          
          {/* Currency and payment method in one row */}
          <div className="app-form-row-2">
            <div className="app-field">
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
            
            <div className="app-field">
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
          <div className="app-form-actions">
            {!isWalletConnected ? (
              <ConnectWalletPrompt
                action="create sell offers"
                className="create-offer-button connect-wallet-button"
              />
            ) : !isSmartContractReady ? (
              <div className="connection-issue-container">
                <button 
                  type="button"
                  disabled={true}
                  className="create-offer-button disabled connection-issue"
                  title={getConnectionStatusMessage()}
                >
                  {isConnectionConnecting && 'Connecting to Solana Devnet...'}
                  {isConnectionRetrying && `Retrying Devnet Connection (${connectionAttempts}/5)`}
                  {isConnectionFailed && 'Solana Devnet Connection Failed'}
                </button>
                
                {(isConnectionFailed || isConnectionRetrying) && (
                  <div className="connection-issue-details">
                    <p className="connection-status-message">
                      {getConnectionStatusMessage()}
                    </p>
                    
                    {isConnectionFailed && (
                      <>
                        <p>Unable to connect to the Solana devnet. This may be due to:</p>
                        <ul>
                          <li>Network connectivity issues</li>
                          <li>Solana devnet RPC endpoint problems</li>
                          <li>Browser security restrictions (CORS)</li>
                          <li>Temporary devnet network issues</li>
                          <li>Firewall or proxy blocking devnet endpoints</li>
                        </ul>
                        
                        <div className="devnet-notice">
                          <p><strong>Note:</strong> If devnet endpoints are temporarily unavailable, you can continue in simulation mode for interface testing. Smart contract features will be simulated.</p>
                        </div>
                      </>
                    )}
                    
                    {(isConnectionFailed || isConnectionRetrying) && (
                      <div className="connection-retry-options">
                        <ButtonLoader
                          type="button"
                          onClick={handleRetryConnection}
                          isLoading={isConnectionRetrying}
                          disabled={isConnectionRetrying}
                          loadingText="Retrying..."
                          variant="secondary"
                          size="small"
                          className="retry-connection-button"
                        >
                          {isConnectionRetrying ? 
                            `Retrying... (${connectionAttempts}/5)` : 
                            `Retry Connection${connectionAttempts > 0 ? ` (${connectionAttempts})` : ''}`
                          }
                        </ButtonLoader>
                        
                        {isConnectionFailed && (
                          <button
                            type="button"
                            onClick={() => {
                              // Enable devnet bypass for UI testing when endpoints are unavailable
                              setDevnetBypass(true);
                              setError('');
                              console.log('[OfferCreation] Devnet bypass enabled - simulating connection for UI testing');
                            }}
                            className="devnet-bypass-button"
                            title="Continue with simulation mode (devnet features simulated)"
                          >
                            Continue Without Devnet (Simulation Mode)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <ButtonLoader
                type="submit"
                isLoading={isCreating}
                disabled={!isSmartContractReady || isActionDisabled || !solValidation.isValid || !fiatValidation.isValid}
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

        .connection-issue-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .connection-issue {
          background-color: var(--ascii-neutral-600) !important;
          color: var(--ascii-red-400) !important;
          cursor: not-allowed !important;
        }

        .connection-issue-details {
          background: var(--color-background-alt);
          border: 1px solid var(--ascii-yellow-500);
          border-radius: 4px;
          padding: 16px;
          max-width: 400px;
          text-align: left;
          font-size: 0.9rem;
        }

        .connection-status-message {
          margin: 0 0 12px 0;
          color: var(--ascii-blue-600);
          font-weight: 500;
          font-size: 0.95rem;
        }

        .connection-issue-details p {
          margin: 0 0 12px 0;
          color: var(--ascii-yellow-600);
          font-weight: 500;
        }

        .connection-issue-details ul {
          margin: 0 0 16px 0;
          padding-left: 20px;
          color: var(--color-foreground-muted);
        }

        .connection-issue-details li {
          margin-bottom: 4px;
        }

        .retry-connection-button {
          width: 100%;
          background-color: var(--ascii-blue-600) !important;
        }

        .retry-connection-button:hover {
          background-color: var(--ascii-blue-500) !important;
        }
      `}</style>
    </div>
  );
};
export { OfferCreation };
export default OfferCreation;
