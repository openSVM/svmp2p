import React, { useState } from 'react';

/**
 * TradingWorkflowIntro component - Introduction step for the trading workflow
 */
const TradingWorkflowIntro = ({ onContinue, tradingType }) => {
  return (
    <div className="trading-workflow-intro">
      <h3>Welcome to the {tradingType === 'buy' ? 'Buy' : 'Sell'} SOL Guided Process</h3>
      
      <div className="intro-content">
        <p>
          This guided workflow will help you {tradingType === 'buy' ? 'purchase' : 'sell'} SOL safely and efficiently.
          We'll walk you through each step of the process with clear instructions.
        </p>
        
        <div className="process-overview">
          <h4>Here's what to expect:</h4>
          
          {tradingType === 'buy' ? (
            <ol>
              <li>Select an offer that meets your requirements</li>
              <li>Review the offer details and payment method</li>
              <li>Confirm your purchase and initiate the transaction</li>
              <li>Make the payment using the specified method</li>
              <li>Confirm payment completion</li>
              <li>Receive your SOL once the seller confirms payment</li>
            </ol>
          ) : (
            <ol>
              <li>Set your offer details (amount, price, payment method)</li>
              <li>Review the offer terms and escrow details</li>
              <li>Create your offer and deposit SOL into escrow</li>
              <li>Wait for a buyer to accept your offer</li>
              <li>Confirm receipt of payment when notified</li>
              <li>Complete the transaction and release SOL from escrow</li>
            </ol>
          )}
        </div>
        
        <div className="safety-tips">
          <h4>Safety Tips:</h4>
          <ul>
            <li>Always check the buyer/seller reputation before proceeding</li>
            <li>Never share sensitive information outside the platform</li>
            <li>Use the built-in dispute resolution if any issues arise</li>
            <li>Transactions are secured by smart contracts on the Solana blockchain</li>
          </ul>
        </div>
      </div>
      
      <div className="intro-actions">
        <button className="primary-button" onClick={onContinue}>
          Let's Get Started
        </button>
      </div>
    </div>
  );
};

export default TradingWorkflowIntro;
