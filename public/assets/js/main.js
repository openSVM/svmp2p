/**
 * OpenSVM P2P Exchange - Main JavaScript
 * Implements functionality for the Solana SVM P2P exchange
 */

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Network Selector
    const networkSelector = document.querySelector('.network-selector');
    const selectedNetwork = document.querySelector('.selected-network');
    const networkDropdown = document.querySelector('.network-dropdown');
    const networkOptions = document.querySelectorAll('.network-dropdown li');
    
    // Language Selector
    const languageSelector = document.querySelector('.language-selector');
    const selectedLanguage = document.querySelector('.selected-language');
    const languageDropdown = document.querySelector('.language-dropdown');
    
    // Wallet Connection
    const connectWalletBtn = document.querySelector('.connect-wallet-btn');
    const walletModal = document.getElementById('wallet-modal');
    const modalClose = document.querySelector('.modal-close');
    const walletOptions = document.querySelectorAll('.wallet-option');
    
    // Filter Dropdowns
    const selectWrappers = document.querySelectorAll('.select-wrapper');
    
    // Cookie Banner
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieClose = document.getElementById('cookie-close');
    
    // Avatar Placeholders
    const avatarPlaceholders = document.querySelectorAll('.avatar-placeholder');
    
    // Network Stats
    const currentTps = document.getElementById('current-tps');
    const confirmationTime = document.getElementById('confirmation-time');
    const activeValidators = document.getElementById('active-validators');
    
    // Network Data
    const networkData = {
        solana: {
            name: 'Solana',
            icon: 'assets/images/solana-logo.svg',
            tps: '4,289',
            confirmationTime: '0.4s',
            validators: '1,785',
            tokens: [
                { symbol: 'SOL', name: 'Solana', icon: 'assets/images/sol-icon.svg' },
                { symbol: 'USDC', name: 'USD Coin', icon: 'assets/images/usdc-icon.svg' },
                { symbol: 'USDT', name: 'Tether', icon: 'assets/images/usdt-icon.svg' },
                { symbol: 'BONK', name: 'Bonk', icon: 'assets/images/bonk-icon.svg' },
                { symbol: 'JTO', name: 'Jito', icon: 'assets/images/jto-icon.svg' }
            ],
            gasFee: '0.000005 SOL ($0.0007)'
        },
        sonic: {
            name: 'Sonic',
            icon: 'assets/images/sonic-logo.svg',
            tps: '3,500',
            confirmationTime: '0.5s',
            validators: '120',
            tokens: [
                { symbol: 'SOL', name: 'Solana', icon: 'assets/images/sol-icon.svg' },
                { symbol: 'SONIC', name: 'Sonic', icon: 'assets/images/sonic-icon.svg' },
                { symbol: 'USDC', name: 'USD Coin', icon: 'assets/images/usdc-icon.svg' }
            ],
            gasFee: '0.000007 SOL ($0.001)'
        },
        eclipse: {
            name: 'Eclipse',
            icon: 'assets/images/eclipse-logo.svg',
            tps: '2,500',
            confirmationTime: '2.0s',
            validators: '85',
            tokens: [
                { symbol: 'SOL', name: 'Solana', icon: 'assets/images/sol-icon.svg' },
                { symbol: 'ETH', name: 'Ethereum', icon: 'assets/images/eth-icon.svg' },
                { symbol: 'USDC', name: 'USD Coin', icon: 'assets/images/usdc-icon.svg' }
            ],
            gasFee: '0.00001 ETH ($0.03)'
        },
        svmbnb: {
            name: 'svmBNB',
            icon: 'assets/images/svmbnb-logo.svg',
            tps: '2,000',
            confirmationTime: '3.0s',
            validators: '42',
            tokens: [
                { symbol: 'BNB', name: 'BNB', icon: 'assets/images/bnb-icon.svg' },
                { symbol: 'SOL', name: 'Solana', icon: 'assets/images/sol-icon.svg' },
                { symbol: 'USDT', name: 'Tether', icon: 'assets/images/usdt-icon.svg' }
            ],
            gasFee: '0.0001 BNB ($0.04)'
        },
        soon: {
            name: 's00n',
            icon: 'assets/images/soon-logo.svg',
            tps: '5,000',
            confirmationTime: '0.05s',
            validators: '65',
            tokens: [
                { symbol: 'SOL', name: 'Solana', icon: 'assets/images/sol-icon.svg' },
                { symbol: 'ETH', name: 'Ethereum', icon: 'assets/images/eth-icon.svg' },
                { symbol: 'USDC', name: 'USD Coin', icon: 'assets/images/usdc-icon.svg' }
            ],
            gasFee: '0.000003 ETH ($0.009)'
        }
    };
    
    // Payment Methods
    const paymentMethods = [
        { id: 'all', name: 'All methods', icon: 'fas fa-credit-card' },
        { id: 'bank', name: 'Bank transfer', icon: 'fas fa-university' },
        { id: 'cash', name: 'Cash', icon: 'fas fa-money-bill-wave' },
        { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal' },
        { id: 'venmo', name: 'Venmo', icon: 'fab fa-vimeo-v' },
        { id: 'zelle', name: 'Zelle', icon: 'fas fa-exchange-alt' },
        { id: 'revolut', name: 'Revolut', icon: 'fas fa-exchange-alt' },
        { id: 'wise', name: 'Wise', icon: 'fas fa-exchange-alt' }
    ];
    
    // Currencies
    const currencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'BRL', name: 'Brazilian Real' },
        { code: 'INR', name: 'Indian Rupee' }
    ];
    
    // Initialize the page
    function init() {
        // Set current network to Solana by default
        updateNetworkInfo('solana');
        
        // Populate dropdowns
        populateTokenDropdown('solana');
        populatePaymentMethodDropdown();
        populateCurrencyDropdown();
        
        // Generate avatar placeholders
        generateAvatarPlaceholders();
        
        // Show cookie banner after 2 seconds
        setTimeout(() => {
            cookieBanner.style.display = 'flex';
        }, 2000);
        
        // Add event listeners
        addEventListeners();
    }
    
    // Update network information based on selected network
    function updateNetworkInfo(networkId) {
        const network = networkData[networkId];
        
        // Update network selector
        const networkIcon = selectedNetwork.querySelector('.network-icon');
        const networkName = selectedNetwork.querySelector('span');
        
        networkIcon.src = network.icon;
        networkName.textContent = network.name;
        
        // Update network stats
        currentTps.textContent = network.tps;
        confirmationTime.textContent = network.confirmationTime;
        activeValidators.textContent = network.validators;
        
        // Update gas fee info
        const gasFeeElement = document.querySelector('.gas-fee .value');
        const confirmationTimeElement = document.querySelector('.confirmation-time .value');
        
        gasFeeElement.textContent = network.gasFee;
        confirmationTimeElement.textContent = `~${network.confirmationTime}`;
        
        // Update active network in dropdown
        networkOptions.forEach(option => {
            const optionNetworkId = option.getAttribute('data-network');
            if (optionNetworkId === networkId) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // Populate token dropdown based on selected network
    function populateTokenDropdown(networkId) {
        const network = networkData[networkId];
        const tokenDropdown = document.querySelector('.crypto-select .dropdown-options');
        
        // Clear existing options
        tokenDropdown.innerHTML = '';
        
        // Add tokens for the selected network
        network.tokens.forEach(token => {
            const tokenOption = document.createElement('div');
            tokenOption.classList.add('dropdown-option');
            tokenOption.setAttribute('data-value', token.symbol);
            
            tokenOption.innerHTML = `
                <img src="${token.icon}" alt="${token.symbol}" class="crypto-icon">
                <span>${token.symbol} - ${token.name}</span>
            `;
            
            tokenOption.addEventListener('click', () => {
                const selectedOption = document.querySelector('.crypto-select .selected-option');
                const icon = selectedOption.querySelector('.crypto-icon');
                const text = selectedOption.querySelector('span');
                
                icon.src = token.icon;
                text.textContent = token.symbol;
                
                // Update market price
                const marketPrice = document.querySelector('.market-price .price');
                marketPrice.textContent = `${token.symbol} - $${(Math.random() * 100 + 50).toFixed(2)}`;
                
                // Hide dropdown
                tokenDropdown.parentElement.classList.remove('active');
            });
            
            tokenDropdown.appendChild(tokenOption);
        });
    }
    
    // Populate payment method dropdown
    function populatePaymentMethodDropdown() {
        const paymentMethodDropdown = document.querySelector('.payment-method-select .dropdown-options');
        
        // Clear existing options
        paymentMethodDropdown.innerHTML = '';
        
        // Add payment methods
        paymentMethods.forEach(method => {
            const methodOption = document.createElement('div');
            methodOption.classList.add('dropdown-option');
            methodOption.setAttribute('data-value', method.id);
            
            methodOption.innerHTML = `
                <i class="${method.icon}"></i>
                <span>${method.name}</span>
            `;
            
            methodOption.addEventListener('click', () => {
                const selectedOption = document.querySelector('.payment-method-select .selected-option');
                const icon = selectedOption.querySelector('i:first-child');
                const text = selectedOption.querySelector('span');
                
                icon.className = method.icon;
                text.textContent = method.name;
                
                // Hide dropdown
                paymentMethodDropdown.parentElement.classList.remove('active');
            });
            
            paymentMethodDropdown.appendChild(methodOption);
        });
    }
    
    // Populate currency dropdown
    function populateCurrencyDropdown() {
        const currencyDropdown = document.querySelector('.currency-select .dropdown-options');
        
        // Clear existing options
        currencyDropdown.innerHTML = '';
        
        // Add currencies
        currencies.forEach(currency => {
            const currencyOption = document.createElement('div');
            currencyOption.classList.add('dropdown-option');
            currencyOption.setAttribute('data-value', currency.code);
            
            currencyOption.innerHTML = `
                <span>${currency.code} - ${currency.name}</span>
            `;
            
            currencyOption.addEventListener('click', () => {
                const selectedOption = document.querySelector('.currency-select .selected-option');
                const text = selectedOption.querySelector('span');
                
                text.textContent = `${currency.code} - ${currency.name}`;
                
                // Hide dropdown
                currencyDropdown.parentElement.classList.remove('active');
            });
            
            currencyDropdown.appendChild(currencyOption);
        });
    }
    
    // Generate avatar placeholders with initials
    function generateAvatarPlaceholders() {
        avatarPlaceholders.forEach(avatar => {
            const initials = avatar.getAttribute('data-initials');
            if (!avatar.src || avatar.src.endsWith('avatar-placeholder.svg')) {
                // Generate random color based on initials
                const hue = Math.abs(initials.charCodeAt(0) * 5) % 360;
                avatar.style.backgroundColor = `hsl(${hue}, 70%, 80%)`;
                avatar.style.color = `hsl(${hue}, 70%, 30%)`;
                avatar.textContent = initials;
            }
        });
    }
    
    // Add event listeners
    function addEventListeners() {
        // Network selector dropdown
        selectedNetwork.addEventListener('click', () => {
            networkDropdown.classList.toggle('active');
        });
        
        // Network options
        networkOptions.forEach(option => {
            option.addEventListener('click', () => {
                const networkId = option.getAttribute('data-network');
                updateNetworkInfo(networkId);
                populateTokenDropdown(networkId);
                networkDropdown.classList.remove('active');
            });
        });
        
        // Language selector dropdown
        selectedLanguage.addEventListener('click', () => {
            languageDropdown.classList.toggle('active');
        });
        
        // Connect wallet button
        connectWalletBtn.addEventListener('click', () => {
            walletModal.classList.add('active');
        });
        
        // Modal close button
        modalClose.addEventListener('click', () => {
            walletModal.classList.remove('active');
        });
        
        // Wallet options
        walletOptions.forEach(option => {
            option.addEventListener('click', () => {
                const walletId = option.getAttribute('data-wallet');
                connectWallet(walletId);
                walletModal.classList.remove('active');
            });
        });
        
        // Select dropdowns
        selectWrappers.forEach(wrapper => {
            const selectedOption = wrapper.querySelector('.selected-option');
            const dropdownOptions = wrapper.querySelector('.dropdown-options');
            
            selectedOption.addEventListener('click', () => {
                // Close all other dropdowns
                document.querySelectorAll('.dropdown-options.active').forEach(dropdown => {
                    if (dropdown !== dropdownOptions) {
                        dropdown.classList.remove('active');
                    }
                });
                
                dropdownOptions.classList.toggle('active');
            });
        });
        
        // Cookie banner close
        cookieClose.addEventListener('click', () => {
            cookieBanner.style.display = 'none';
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            // Network dropdown
            if (!networkSelector.contains(event.target)) {
                networkDropdown.classList.remove('active');
            }
            
            // Language dropdown
            if (!languageSelector.contains(event.target)) {
                languageDropdown.classList.remove('active');
            }
            
            // Select dropdowns
            selectWrappers.forEach(wrapper => {
                if (!wrapper.contains(event.target)) {
                    const dropdownOptions = wrapper.querySelector('.dropdown-options');
                    dropdownOptions.classList.remove('active');
                }
            });
        });
        
        // Sell buttons
        const sellButtons = document.querySelectorAll('.sell-btn');
        sellButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Check if wallet is connected
                if (!isWalletConnected()) {
                    walletModal.classList.add('active');
                    return;
                }
                
                // Simulate trade initiation
                alert('Trade request sent! This would initiate the escrow process on the selected SVM network.');
            });
        });
    }
    
    // Connect wallet function
    function connectWallet(walletId) {
        console.log(`Connecting to ${walletId} wallet...`);
        
        // In a real implementation, this would use the Solana wallet adapter
        // For this demo, we'll simulate a successful connection
        
        setTimeout(() => {
            // Update connect wallet button
            connectWalletBtn.innerHTML = `
                <i class="fas fa-wallet"></i>
                <span>Wallet Connected</span>
            `;
            connectWalletBtn.classList.add('connected');
            
            console.log(`Connected to ${walletId} wallet`);
            
            // Show success message
            alert(`Successfully connected to ${walletId} wallet on the selected SVM network!`);
        }, 1000);
    }
    
    // Check if wallet is connected
    function isWalletConnected() {
        return connectWalletBtn.classList.contains('connected');
    }
    
    // Simulate real-time price updates
    function startPriceUpdates() {
        setInterval(() => {
            // Update prices in listings
            document.querySelectorAll('.listing-item .rate').forEach(rate => {
                // Get current price
                let currentPrice = parseFloat(rate.textContent.replace('$', ''));
                
                // Add small random change
                const change = (Math.random() - 0.5) * 0.5;
                currentPrice += change;
                
                // Update price
                rate.textContent = `$${currentPrice.toFixed(2)}`;
                
                // Update percentage
                const percentageElement = rate.nextElementSibling;
                const currentPercentage = parseFloat(percentageElement.textContent.replace('%', ''));
                const newPercentage = currentPercentage + (change / 2);
                
                percentageElement.textContent = `${newPercentage > 0 ? '+' : ''}${newPercentage.toFixed(2)}%`;
                
                // Update class based on percentage
                percentageElement.classList.remove('positive', 'negative');
                percentageElement.classList.add(newPercentage >= 0 ? 'positive' : 'negative');
            });
        }, 5000);
    }
    
    // Initialize the page
    init();
    
    // Start simulated price updates
    startPriceUpdates();
});
