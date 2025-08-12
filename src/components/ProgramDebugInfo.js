import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { usePhantomWallet } from '../contexts/PhantomWalletProvider';

/**
 * Debug component to show program integration status
 */
const ProgramDebugInfo = () => {
  const { program, connection, network } = useContext(AppContext);
  const wallet = usePhantomWallet();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Debug Info</h4>
      <div>Wallet Connected: {wallet.connected ? '✅' : '❌'}</div>
      <div>Program Available: {program ? '✅' : '❌'}</div>
      <div>Connection Available: {connection ? '✅' : '❌'}</div>
      <div>Network: {network?.name || 'Unknown'}</div>
      {program && (
        <div>Program ID: {program.programId.toString().slice(0, 8)}...</div>
      )}
    </div>
  );
};

export default ProgramDebugInfo;