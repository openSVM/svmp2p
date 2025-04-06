# OpenSVM P2P Exchange

A peer-to-peer cryptocurrency exchange platform for trading across Solana Virtual Machine networks (Solana, Sonic, Eclipse, svmBNB, and s00n).

## Features

- **Multi-Network Support**: Trade across multiple SVM networks from a single interface
- **Network-Specific Information**: View confirmation times, gas fees, and other network details
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Wallet Integration**: Connect with popular Solana wallets (Phantom, Solflare, etc.)
- **Secure Trading**: Escrow-based P2P trading system

## Technologies Used

- Next.js 14 (Server-Side Rendering)
- React 18
- CSS3 with responsive design
- JavaScript (ES6+)
- Solana Web3.js and Wallet Adapters
- SVG for network logos and icons

## Next.js Architecture

- The application uses a standard Next.js architecture with SSR (Server-Side Rendering)
- The project structure follows Next.js conventions with `/pages`, `/components`, and `/contexts`
- Page layouts are applied consistently using the Layout component in `_app.js`
- Dynamic imports with `{ ssr: false }` are used for client-side only components

## Important CSS Notes

- When using CSS `@import` rules, they **must** be placed at the top of the stylesheet, before any other CSS rules or declarations.
- Each `@import` rule should be on its own line with proper formatting and semicolons.
- Add extra line breaks between imports and the first CSS rule to ensure proper parsing.
- Next.js enforces this CSS standard strictly, whereas some other build systems might be more forgiving.
- Only `@charset` and `@layer` declarations can precede `@import` rules.
- The main stylesheet is at `src/styles/globals.css` which imports styles from the public directory.
- Example of correct formatting:
  ```css
  @import "/path/to/file.css";
  
  @import "/path/to/another.css";
  
  /* First CSS rule after imports */
  :root { ... }
  ```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Run the development server: `npm run dev`
4. Connect your wallet to start trading

## Requirements

- Node.js >= 18.17.0 (required by Next.js 14)

## Mobile Responsiveness

The exchange is fully responsive and works on all device sizes:
- Mobile phones (375px and up)
- Tablets (768px and up)
- Desktops (1024px and up)

## Network Support

- **Solana**: The original high-performance blockchain
- **Sonic**: Gaming and NFT-focused SVM network
- **Eclipse**: Cross-chain applications SVM network
- **svmBNB**: BNB Chain integration with SVM
- **s00n**: Ultra-fast optimistic rollup SVM network

## License

MIT

## Contact

For more information, visit [OpenSVM](https://opensvm.com)
