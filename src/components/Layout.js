import { useContext } from 'react';
import Head from 'next/head';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import components
import { NetworkSelector } from '@/components/NetworkSelector';

export default function Layout({ children, title = 'OpenSVM P2P Exchange' }) {
  const { 
    network, 
    selectedNetwork, 
    setSelectedNetwork, 
    activeTab, 
    setActiveTab,
    networks 
  } = useContext(AppContext);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <img src="/assets/images/opensvm-logo.svg" alt="OpenSVM P2P Exchange" />
            <h1>OpenSVM P2P Exchange</h1>
          </div>
          
          <NetworkSelector 
            networks={networks} 
            selectedNetwork={selectedNetwork} 
            onSelectNetwork={setSelectedNetwork} 
          />
          
          <div className="wallet-container">
            <WalletMultiButton />
            <WalletDisconnectButton />
          </div>
        </header>
        
        <nav className="app-nav">
          <ul>
            <li className={activeTab === 'buy' ? 'active' : ''}>
              <button onClick={() => setActiveTab('buy')}>Buy</button>
            </li>
            <li className={activeTab === 'sell' ? 'active' : ''}>
              <button onClick={() => setActiveTab('sell')}>Sell</button>
            </li>
            <li className={activeTab === 'myoffers' ? 'active' : ''}>
              <button onClick={() => setActiveTab('myoffers')}>My Offers</button>
            </li>
            <li className={activeTab === 'disputes' ? 'active' : ''}>
              <button onClick={() => setActiveTab('disputes')}>Disputes</button>
            </li>
            <li className={activeTab === 'profile' ? 'active' : ''}>
              <button onClick={() => setActiveTab('profile')}>Profile</button>
            </li>
          </ul>
        </nav>
        
        <main className="app-main">
          {children}
        </main>
        
        <footer className="app-footer">
          <p>© 2025 OpenSVM P2P Exchange. All rights reserved.</p>
          <p>
            <a href={network.explorerUrl} target="_blank" rel="noopener noreferrer">
              {network.name} Explorer
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
