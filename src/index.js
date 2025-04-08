import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Create root and render app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// Import responsive styles
import './styles/responsive.css';

// This adds the import to the main index.js file to include our new responsive styles
