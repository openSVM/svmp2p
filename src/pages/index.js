import { useContext } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

// Import context
import { AppContext } from '@/contexts/AppContext';

// Import components
import { NetworkSelector } from '@/components/NetworkSelector';

// Dynamically import components that need client-side only rendering
const OfferCreation = dynamic(() => import('@/components/OfferCreation'), { ssr: false });
const OfferList = dynamic(() => import('@/components/OfferList'), { ssr: false });
const DisputeResolution = dynamic(() => import('@/components/DisputeResolution'), { ssr: false });
const UserProfile = dynamic(() => import('@/components/UserProfile'), { ssr: false });

export default function Home() {
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
        <title>OpenSVM P2P Exchange</title>
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
          {activeTab === 'buy' && <OfferList type="buy" />}
          {activeTab === 'sell' && (
            <>
              <OfferCreation />
              <OfferList type="sell" />
            </>
          )}
          {activeTab === 'myoffers' && <OfferList type="my" />}
          {activeTab === 'disputes' && <DisputeResolution />}
          {activeTab === 'profile' && <UserProfile />}
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