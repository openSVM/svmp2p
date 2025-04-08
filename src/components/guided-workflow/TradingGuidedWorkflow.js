import React, { useState } from 'react';
import GuidedWorkflow from './GuidedWorkflowStep';
import TradingWorkflowIntro from './TradingWorkflowIntro';
import BuyWorkflowSelectOffer from './BuyWorkflowSelectOffer';
import BuyWorkflowReviewOffer from './BuyWorkflowReviewOffer';
import BuyWorkflowPayment from './BuyWorkflowPayment';
import BuyWorkflowComplete from './BuyWorkflowComplete';
import SellWorkflowCreateOffer from './SellWorkflowCreateOffer';
import SellWorkflowReviewEscrow from './SellWorkflowReviewEscrow';
import SellWorkflowComplete from './SellWorkflowComplete';

/**
 * TradingGuidedWorkflow component - Main entry point for the trading guided workflow
 */
const TradingGuidedWorkflow = ({ tradingType = 'buy', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [createdOffer, setCreatedOffer] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [transactionInfo, setTransactionInfo] = useState(null);
  
  // Mock data for demo purposes
  const mockOffers = [
    {
      id: 'offer1',
      seller: '0x1234567890abcdef1234567890abcdef12345678',
      solAmount: 5.0,
      fiatAmount: 750.0,
      fiatCurrency: 'USD',
      paymentMethod: 'Bank Transfer',
      status: 'Active',
      timestamp: Date.now()
    },
    {
      id: 'offer2',
      seller: '0xabcdef1234567890abcdef1234567890abcdef12',
      solAmount: 2.5,
      fiatAmount: 375.0,
      fiatCurrency: 'USD',
      paymentMethod: 'PayPal',
      status: 'Active',
      timestamp: Date.now()
    },
    {
      id: 'offer3',
      seller: '0x7890abcdef1234567890abcdef1234567890abcd',
      solAmount: 1.0,
      fiatAmount: 140.0,
      fiatCurrency: 'EUR',
      paymentMethod: 'Venmo',
      status: 'Active',
      timestamp: Date.now()
    }
  ];
  
  // Define workflow steps based on trading type
  const getBuyWorkflowSteps = () => [
    {
      title: 'Introduction',
      description: 'Learn about the buying process',
      component: (
        <TradingWorkflowIntro 
          tradingType="buy" 
          onContinue={() => setCurrentStep(1)}
        />
      )
    },
    {
      title: 'Select Offer',
      description: 'Choose a sell offer that meets your requirements',
      component: (
        <BuyWorkflowSelectOffer 
          availableOffers={mockOffers}
          selectedCurrency="USD"
          selectedPaymentMethod="All"
          onSelectOffer={(offer) => {
            setSelectedOffer(offer);
            setCurrentStep(2);
          }}
        />
      )
    },
    {
      title: 'Review Offer',
      description: 'Review the offer details before proceeding',
      component: (
        <BuyWorkflowReviewOffer 
          selectedOffer={selectedOffer}
          onConfirm={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )
    },
    {
      title: 'Make Payment',
      description: 'Send payment to the seller',
      component: (
        <BuyWorkflowPayment 
          selectedOffer={selectedOffer}
          onPaymentComplete={(reference, proof) => {
            setPaymentInfo({ reference, proof });
            
            // Mock transaction info
            setTransactionInfo({
              txHash: '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
              solAmount: selectedOffer.solAmount,
              seller: selectedOffer.seller,
              timestamp: Date.now(),
              status: 'Complete'
            });
            
            setCurrentStep(4);
          }}
          onBack={() => setCurrentStep(2)}
        />
      )
    },
    {
      title: 'Complete',
      description: 'Transaction complete',
      component: (
        <BuyWorkflowComplete 
          transaction={transactionInfo}
          onFinish={() => {
            if (onComplete) {
              onComplete();
            }
          }}
        />
      )
    }
  ];
  
  const getSellWorkflowSteps = () => [
    {
      title: 'Introduction',
      description: 'Learn about the selling process',
      component: (
        <TradingWorkflowIntro 
          tradingType="sell" 
          onContinue={() => setCurrentStep(1)}
        />
      )
    },
    {
      title: 'Create Offer',
      description: 'Specify the details of your sell offer',
      component: (
        <SellWorkflowCreateOffer 
          onOfferCreated={(offer) => {
            setCreatedOffer(offer);
            setCurrentStep(2);
          }}
          onBack={() => setCurrentStep(0)}
        />
      )
    },
    {
      title: 'Review Escrow',
      description: 'Review the escrow details before proceeding',
      component: (
        <SellWorkflowReviewEscrow 
          offerDetails={createdOffer}
          onConfirm={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )
    },
    {
      title: 'Complete',
      description: 'Offer created successfully',
      component: (
        <SellWorkflowComplete 
          offerDetails={createdOffer}
          onFinish={() => {
            if (onComplete) {
              onComplete();
            }
          }}
        />
      )
    }
  ];
  
  const workflowSteps = tradingType === 'buy' ? getBuyWorkflowSteps() : getSellWorkflowSteps();
  
  return (
    <div className="trading-guided-workflow">
      <GuidedWorkflow
        steps={workflowSteps}
        initialStep={currentStep}
        onComplete={onComplete}
      />
    </div>
  );
};

export default TradingGuidedWorkflow;
