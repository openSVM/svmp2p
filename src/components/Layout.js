import React, { useContext, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AppContext } from '@/contexts/AppContext';
import { NetworkSelector } from '@/components/NetworkSelector';
import Link from 'next/link';
import Image from 'next/image';

export const Layout = ({ children }) => {
  const { networks, selectedNetwork, setSelectedNetwork, activeTab, setActiveTab } = useContext(AppContext);
  const wallet = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNetworkChange = (networkId) => {
    setSelectedNetwork(networkId);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <Link href="/">
              <Image 
                src="/assets/images/backpack-logo.svg" 
                alt="SVM P2P Exchange" 
                width={40} 
                height={40} 
              />
              <span className="logo-text">SVM P2P Exchange</span>
            </Link>
          </div>

          <div className="header-controls">
            <NetworkSelector 
              networks={networks} 
              selectedNetwork={selectedNetwork} 
              onSelectNetwork={handleNetworkChange} 
            />
            
            <div className="wallet-connect">
              <WalletMultiButton />
            </div>
            
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'}`}></i>
            </button>
          </div>
        </div>
        
        <nav className={`main-nav ${mobileMenuOpen ? 'active' : ''}`}>
          <ul>
            <li className={activeTab === 'buy' ? 'active' : ''}>
              <button onClick={() => handleTabChange('buy')}>Buy</button>
            </li>
            <li className={activeTab === 'sell' ? 'active' : ''}>
              <button onClick={() => handleTabChange('sell')}>Sell</button>
            </li>
            <li className={activeTab === 'my-offers' ? 'active' : ''}>
              <button onClick={() => handleTabChange('my-offers')}>My Offers</button>
            </li>
            <li className={activeTab === 'disputes' ? 'active' : ''}>
              <button onClick={() => handleTabChange('disputes')}>Disputes</button>
            </li>
            <li className={activeTab === 'profile' ? 'active' : ''}>
              <button onClick={() => handleTabChange('profile')}>Profile</button>
            </li>
          </ul>
        </nav>
      </header>

      <main className="app-content">
        {children}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="#" target="_blank" rel="noopener noreferrer">FAQ</a>
            <a href="https://github.com/openSVM/svmp2p" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} SVM P2P Exchange. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
