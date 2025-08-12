import React, { useState, useEffect, useMemo } from 'react';
import { 
  TransactionProgressIndicator, 
  TransactionAnalytics, 
  RealTimeFeedback 
} from '../common';
import EnhancedNotification from '../notifications/EnhancedNotification';

/**
 * AdvancedFeedbackDemo component
 * Demonstrates the usage of all advanced UI feedback mechanisms
 */
const AdvancedFeedbackDemo = () => {
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mockTransactions] = useState([
    {
      id: '1',
      type: 'Buy Order',
      status: 'success',
      timestamp: '2024-01-01T12:00:00Z',
      duration: 30,
      value: 1000
    },
    {
      id: '2',
      type: 'Sell Order',
      status: 'success',
      timestamp: '2024-01-01T12:30:00Z',
      duration: 45,
      value: 1500
    },
    {
      id: '3',
      type: 'Transfer',
      status: 'error',
      timestamp: '2024-01-01T13:00:00Z',
      duration: 0,
      value: 0
    }
  ]);

  // Demo transaction steps using useMemo to prevent dependency issues
  const transactionSteps = useMemo(() => [
    {
      title: 'Validating Transaction',
      description: 'Checking transaction parameters and user balance',
      details: 'Validating signature and ensuring sufficient funds'
    },
    {
      title: 'Broadcasting to Network',
      description: 'Submitting transaction to blockchain network',
      details: 'Transaction sent to network nodes for processing'
    },
    {
      title: 'Network Confirmation',
      description: 'Waiting for network confirmation',
      details: 'Requires 3 network confirmations for completion'
    },
    {
      title: 'Transaction Complete',
      description: 'Transaction successfully processed',
      details: 'Funds transferred and transaction recorded'
    }
  ], []);

  const [progressData, setProgressData] = useState({
    currentStepIndex: 0,
    status: 'pending',
    estimatedTime: 120
  });

  // Simulate transaction progress
  useEffect(() => {
    if (currentTransaction) {
      const interval = setInterval(() => {
        setProgressData(prev => {
          if (prev.currentStepIndex < transactionSteps.length - 1) {
            const newStepIndex = prev.currentStepIndex + 1;
            const newStatus = newStepIndex === transactionSteps.length - 1 ? 'success' : 'pending';
            const newEstimatedTime = Math.max(0, prev.estimatedTime - 30);

            // Add notification for progress updates
            if (newStepIndex === transactionSteps.length - 1) {
              addNotification({
                type: 'success',
                title: 'Transaction Complete',
                message: 'Your transaction has been successfully processed',
                trustIndicators: { verified: true, secure: true },
                actions: [
                  { label: 'View Details', type: 'primary', action: 'view_details' },
                  { label: 'Share', type: 'secondary', action: 'share' }
                ]
              });
            } else {
              addNotification({
                type: 'info',
                title: 'Transaction Progress',
                message: `Step ${newStepIndex + 1}: ${transactionSteps[newStepIndex].title}`,
                showProgressBar: true,
                progressValue: Math.round(((newStepIndex + 1) / transactionSteps.length) * 100),
                autoClose: true,
                autoCloseTime: 3000
              });
            }

            return {
              currentStepIndex: newStepIndex,
              status: newStatus,
              estimatedTime: newEstimatedTime
            };
          }
          return prev;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentTransaction, transactionSteps]);

  // Add notification helper
  const addNotification = (notificationData) => {
    const notification = {
      id: `notification-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      category: 'transaction',
      ...notificationData
    };

    setNotifications(prev => [notification, ...prev]);
  };

  // Start demo transaction
  const startDemoTransaction = () => {
    const txId = `tx-${Date.now()}`;
    setCurrentTransaction(txId);
    setProgressData({
      currentStepIndex: 0,
      status: 'pending',
      estimatedTime: 120
    });

    addNotification({
      type: 'info',
      title: 'Transaction Started',
      message: 'Your transaction has been initiated',
      verificationStatus: { status: 'pending', message: 'Awaiting network confirmation' },
      trustIndicators: { secure: true },
      persistent: false
    });
  };

  // Handle notification actions
  const handleNotificationAction = (notificationId, action) => {
    console.log('Notification action:', notificationId, action);
    
    if (action.action === 'view_details') {
      addNotification({
        type: 'info',
        title: 'Transaction Details',
        message: 'Transaction hash: 0x1234...5678',
        details: (
          <div>
            <p><strong>Transaction ID:</strong> {currentTransaction}</p>
            <p><strong>Status:</strong> Completed</p>
            <p><strong>Block Height:</strong> 12345678</p>
            <p><strong>Gas Used:</strong> 21000</p>
          </div>
        ),
        actions: [
          { label: 'View on Explorer', type: 'primary', action: 'view_explorer' }
        ]
      });
    }
  };

  // Handle notification read/delete
  const handleNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleNotificationDelete = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="advanced-feedback-demo">
      <div className="demo-header">
        <h1>Advanced UI Feedback Demo</h1>
        <p>Demonstrating enhanced transaction progress, analytics, and real-time feedback</p>
        
        <button 
          className="demo-button"
          onClick={startDemoTransaction}
          disabled={currentTransaction && progressData.status === 'pending'}
        >
          {currentTransaction && progressData.status === 'pending' ? 'Transaction in Progress...' : 'Start Demo Transaction'}
        </button>
      </div>

      <div className="demo-content">
        {/* Real-time Feedback */}
        <div className="demo-section">
          <h2>Real-time Network & Transaction Feedback</h2>
          <RealTimeFeedback
            transactionId={currentTransaction}
            networkEndpoint="wss://api.mainnet-beta.solana.com"
            enableSound={true}
            enablePushNotifications={true}
            onStatusUpdate={(status) => console.log('Status update:', status)}
            onNetworkChange={(network) => console.log('Network change:', network)}
          />
        </div>

        {/* Transaction Progress */}
        {currentTransaction && (
          <div className="demo-section">
            <h2>Multi-step Transaction Progress</h2>
            <TransactionProgressIndicator
              steps={transactionSteps}
              currentStepIndex={progressData.currentStepIndex}
              status={progressData.status}
              estimatedTimeRemaining={progressData.estimatedTime}
              showTimeEstimate={true}
              showProgressBar={true}
              showStepDetails={true}
            />
            
            {/* Compact version */}
            <div style={{ marginTop: '16px' }}>
              <h3>Compact Mode:</h3>
              <TransactionProgressIndicator
                steps={transactionSteps}
                currentStepIndex={progressData.currentStepIndex}
                totalSteps={transactionSteps.length}
                estimatedTimeRemaining={progressData.estimatedTime}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Transaction Analytics */}
        <div className="demo-section">
          <h2>Transaction Analytics & Trust Indicators</h2>
          <TransactionAnalytics
            recentTransactions={mockTransactions}
            showRecentActivity={true}
            showGlobalStats={true}
            globalStats={{ networkHealth: 98 }}
            timeframe="7d"
          />
          
          {/* Compact analytics */}
          <div style={{ marginTop: '16px' }}>
            <h3>Compact Analytics:</h3>
            <TransactionAnalytics
              recentTransactions={mockTransactions}
              compact={true}
            />
          </div>
        </div>

        {/* Enhanced Notifications */}
        <div className="demo-section">
          <h2>Enhanced Notifications</h2>
          <div className="notifications-container">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications. Start a demo transaction to see notifications in action.</p>
            ) : (
              notifications.map(notification => (
                <EnhancedNotification
                  key={notification.id}
                  {...notification}
                  onRead={handleNotificationRead}
                  onDelete={handleNotificationDelete}
                  onAction={handleNotificationAction}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .advanced-feedback-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(6px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .demo-header h1 {
          margin: 0 0 10px 0;
          color: #1f2937;
          font-size: 2rem;
        }

        .demo-header p {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 1.125rem;
        }

        .demo-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .demo-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .demo-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .demo-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .demo-section {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .demo-section h2 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .demo-section h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .notifications-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 500px;
          overflow-y: auto;
          padding: 8px;
        }

        .no-notifications {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 40px 20px;
        }

        @media (max-width: 768px) {
          .advanced-feedback-demo {
            padding: 16px;
          }

          .demo-header {
            padding: 16px;
          }

          .demo-header h1 {
            font-size: 1.5rem;
          }

          .demo-section {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedFeedbackDemo;