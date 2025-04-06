import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Import styles - order matters for CSS
import '@solana/wallet-adapter-react-ui/styles.css';
import '@/styles/globals.css';

// Import context
import { AppContextProvider } from '@/contexts/AppContext';

// Import Layout
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  // Set up wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <AppContextProvider>
      {({ network }) => (
        <ConnectionProvider endpoint={network.endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      )}
    </AppContextProvider>
  );
}
