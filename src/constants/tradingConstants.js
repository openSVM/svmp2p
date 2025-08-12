/**
 * Trading-related constants and configurations
 */

// Top 100 world currencies by trading volume and global usage
export const SUPPORTED_CURRENCIES = [
  // Major Currencies (G8)
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
  
  // Asian Currencies
  'KRW', 'SGD', 'HKD', 'INR', 'THB', 'TWD', 'MYR', 'PHP', 'IDR', 'VND',
  'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK', 'MNT',
  
  // European Currencies
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK',
  'RSD', 'BAM', 'MKD', 'ALL', 'ISK', 'TRY',
  
  // Middle East & Africa
  'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'ILS', 'EGP',
  'ZAR', 'MAD', 'TND', 'DZD', 'NGN', 'GHS', 'KES', 'UGX', 'TZS',
  'ETB', 'ZMW', 'BWP', 'MUR', 'SCR',
  
  // Americas
  'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB',
  'VES', 'GYD', 'SRD', 'JMD', 'TTD', 'BBD', 'BZD', 'GTQ', 'HNL',
  'NIO', 'CRC', 'PAB', 'DOP', 'HTG',
  
  // Pacific & Oceania
  'NZD', 'FJD', 'PGK', 'SBD', 'VUV', 'WST', 'TOP', 'KID',
  
  // Eastern Europe & Russia
  'RUB', 'UAH', 'BYN', 'MDL', 'GEL', 'AMD', 'AZN', 'KZT', 'UZS',
  'KGS', 'TJS', 'TMT',
  
  // Additional Important Currencies
  'IQD', 'IRR', 'AFN', 'LBP', 'SYP', 'YER', 'MVR', 'BND'
];

// Region-specific payment methods based on currency
export const CURRENCY_PAYMENT_METHODS = {
  // North America
  'USD': ['Bank Transfer', 'PayPal', 'Venmo', 'Cash App', 'Zelle', 'Western Union', 'MoneyGram', 'Apple Pay', 'Google Pay', 'ACH Transfer', 'Wire Transfer', 'Cryptocurrency'],
  'CAD': ['Bank Transfer', 'PayPal', 'Interac e-Transfer', 'Western Union', 'MoneyGram', 'Wire Transfer'],
  
  // Europe
  'EUR': ['SEPA Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union', 'MoneyGram', 'Bank Transfer', 'N26', 'Bunq', 'Wire Transfer'],
  'GBP': ['Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Faster Payments', 'CHAPS', 'Western Union', 'MoneyGram', 'Monzo', 'Starling Bank'],
  'CHF': ['Bank Transfer', 'PayPal', 'PostFinance', 'Revolut', 'Wise', 'Western Union', 'Wire Transfer'],
  'SEK': ['Swish', 'Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'NOK': ['Vipps', 'Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'DKK': ['MobilePay', 'Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'PLN': ['BLIK', 'Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union', 'Allegro Pay'],
  'CZK': ['Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'HUF': ['Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'RON': ['Bank Transfer', 'PayPal', 'Revolut', 'Wise', 'Western Union'],
  'TRY': ['Bank Transfer', 'PayPal', 'Western Union', 'MoneyGram', 'Papara', 'Garanti Bank', 'İş Bank'],
  
  // Asia Pacific
  'JPY': ['Bank Transfer', 'PayPal', 'LINE Pay', 'PayPay', 'Rakuten Pay', 'Western Union', 'Seven Bank'],
  'CNY': ['Alipay', 'WeChat Pay', 'Bank Transfer', 'UnionPay', 'Western Union'],
  'KRW': ['KakaoPay', 'Samsung Pay', 'Naver Pay', 'Bank Transfer', 'Western Union'],
  'SGD': ['PayNow', 'Bank Transfer', 'PayPal', 'GrabPay', 'Western Union', 'DBS', 'OCBC', 'UOB'],
  'HKD': ['FPS (Faster Payment)', 'PayMe', 'Bank Transfer', 'PayPal', 'Western Union', 'HSBC', 'Hang Seng Bank'],
  'INR': ['UPI', 'Paytm', 'PhonePe', 'Google Pay', 'IMPS', 'NEFT', 'RTGS', 'Bank Transfer', 'Western Union', 'HDFC Bank', 'ICICI Bank', 'SBI'],
  'AUD': ['Bank Transfer', 'PayPal', 'OSKO', 'PayID', 'Western Union', 'MoneyGram', 'Commonwealth Bank', 'ANZ', 'Westpac', 'NAB'],
  'NZD': ['Bank Transfer', 'PayPal', 'ASB', 'ANZ', 'BNZ', 'Westpac', 'Western Union'],
  'THB': ['PromptPay', 'Bank Transfer', 'True Money Wallet', 'Rabbit LINE Pay', 'Western Union', 'Kasikorn Bank', 'Bangkok Bank', 'SCB'],
  'MYR': ['Bank Transfer', 'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank', 'Touch n Go eWallet', 'GrabPay', 'Western Union'],
  'PHP': ['GCash', 'PayMaya', 'Bank Transfer', 'BDO', 'BPI', 'Metrobank', 'Western Union', 'Cebuana Lhuillier'],
  'IDR': ['Bank Transfer', 'DANA', 'OVO', 'GoPay', 'LinkAja', 'BCA', 'Mandiri', 'BRI', 'BNI', 'Western Union'],
  'VND': ['Bank Transfer', 'Vietcombank', 'BIDV', 'VietinBank', 'Techcombank', 'MoMo', 'ZaloPay', 'ViettelPay', 'Western Union'],
  'TWD': ['Bank Transfer', 'Taiwan Pay', 'LINE Pay', 'JKoPay', 'First Bank', 'CTBC Bank', 'Cathay Bank', 'Western Union'],
  
  // Middle East & Africa
  'AED': ['Bank Transfer', 'Emirates NBD', 'ADCB', 'FAB', 'ENBD', 'Western Union', 'Exchange Houses'],
  'SAR': ['Bank Transfer', 'SABB', 'NCB', 'Rajhi Bank', 'SAMA', 'STC Pay', 'Western Union'],
  'QAR': ['Bank Transfer', 'QNB', 'CBQ', 'QIIB', 'Western Union'],
  'KWD': ['Bank Transfer', 'NBK', 'Gulf Bank', 'CBK', 'Western Union'],
  'EGP': ['Bank Transfer', 'CIB', 'NBE', 'Banque Misr', 'AAIB', 'Vodafone Cash', 'Orange Money', 'Western Union'],
  'ZAR': ['Bank Transfer', 'FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec', 'PayPal', 'Western Union'],
  'NGN': ['Bank Transfer', 'GTBank', 'First Bank', 'UBA', 'Access Bank', 'Zenith Bank', 'Opay', 'PalmPay', 'Kuda', 'Western Union'],
  'KES': ['M-Pesa', 'Airtel Money', 'Bank Transfer', 'KCB', 'Equity Bank', 'NCBA', 'Western Union'],
  'GHS': ['Mobile Money', 'Bank Transfer', 'GCB Bank', 'Ecobank', 'Fidelity Bank', 'Western Union'],
  'MAD': ['Bank Transfer', 'Attijariwafa Bank', 'BMCE Bank', 'CIH Bank', 'Western Union'],
  'TND': ['Bank Transfer', 'STB', 'BIAT', 'BNA', 'Western Union'],
  
  // Americas
  'BRL': ['PIX', 'Bank Transfer', 'PayPal', 'PagSeguro', 'Mercado Pago', 'Bradesco', 'Itaú', 'Banco do Brasil', 'Santander', 'Western Union'],
  'MXN': ['SPEI', 'Bank Transfer', 'PayPal', 'OXXO', 'Mercado Pago', 'BBVA', 'Santander', 'Banamex', 'Western Union'],
  'ARS': ['Bank Transfer', 'Mercado Pago', 'Banco Nación', 'BBVA', 'Santander', 'Western Union'],
  'CLP': ['Bank Transfer', 'Banco de Chile', 'BancoEstado', 'Santander', 'BCI', 'Western Union'],
  'COP': ['Bank Transfer', 'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Nequi', 'Daviplata', 'Western Union'],
  'PEN': ['Bank Transfer', 'BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Yape', 'Plin', 'Western Union'],
  
  // Russia & Eastern Europe
  'RUB': ['Sberbank', 'VTB', 'Alfa Bank', 'Tinkoff Bank', 'YooMoney', 'Qiwi', 'WebMoney'],
  'UAH': ['PrivatBank', 'Monobank', 'PUMB', 'Oschadbank', 'Bank Transfer'],
  'PLN': ['mBank', 'PKO BP', 'ING Bank', 'Santander', 'Millennium Bank', 'BLIK'],
  
  // Default fallback for other currencies
  'DEFAULT': ['Bank Transfer', 'Western Union', 'MoneyGram', 'Wire Transfer']
};

// Get payment methods for a specific currency
export const getPaymentMethodsForCurrency = (currency) => {
  return CURRENCY_PAYMENT_METHODS[currency] || CURRENCY_PAYMENT_METHODS.DEFAULT;
};

// Input validation constraints
export const VALIDATION_CONSTRAINTS = {
  SOL_AMOUNT: {
    min: 0.01,
    max: 1000, // Reasonable max to prevent fat-finger errors
    step: 0.01
  },
  FIAT_AMOUNT: {
    min: 1, // Minimum $1 equivalent
    max: 100000, // Reasonable max
    step: 0.01
  }
};

// Debounce timing for action buttons (in milliseconds)
export const ACTION_DEBOUNCE_TIME = 1000;

// Extended currency symbols for display
export const CURRENCY_SYMBOLS = {
  // Major Currencies
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$', 'CHF': 'Fr', 'CNY': '¥',
  
  // Asian Currencies
  'KRW': '₩', 'SGD': 'S$', 'HKD': 'HK$', 'INR': '₹', 'THB': '฿', 'TWD': 'NT$', 'MYR': 'RM', 'PHP': '₱',
  'IDR': 'Rp', 'VND': '₫', 'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': 'Rs', 'MMK': 'K', 'KHR': '៛',
  'LAK': '₭', 'MNT': '₮',
  
  // European Currencies
  'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei', 'BGN': 'лв',
  'HRK': 'kn', 'RSD': 'дин', 'BAM': 'KM', 'MKD': 'ден', 'ALL': 'L', 'ISK': 'kr', 'TRY': '₺',
  
  // Middle East & Africa
  'AED': 'د.إ', 'SAR': '﷼', 'QAR': 'ر.ق', 'KWD': 'د.ك', 'BHD': '.د.ب', 'OMR': 'ر.ع.', 'JOD': 'د.ا',
  'ILS': '₪', 'EGP': '£', 'ZAR': 'R', 'MAD': 'د.م.', 'TND': 'د.ت', 'DZD': 'د.ج', 'NGN': '₦',
  'GHS': '₵', 'KES': 'KSh', 'UGX': 'USh', 'TZS': 'TSh', 'ETB': 'Br', 'ZMW': 'ZK', 'BWP': 'P',
  'MUR': '₨', 'SCR': '₨',
  
  // Americas
  'BRL': 'R$', 'MXN': '$', 'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/', 'UYU': '$U', 'PYG': '₲',
  'BOB': 'Bs', 'VES': 'Bs', 'GYD': '$', 'SRD': '$', 'JMD': 'J$', 'TTD': 'TT$', 'BBD': 'Bds$',
  'BZD': 'BZ$', 'GTQ': 'Q', 'HNL': 'L', 'NIO': 'C$', 'CRC': '₡', 'PAB': 'B/.', 'DOP': 'RD$', 'HTG': 'G',
  
  // Pacific & Oceania
  'NZD': 'NZ$', 'FJD': 'FJ$', 'PGK': 'K', 'SBD': 'SI$', 'VUV': 'VT', 'WST': 'WS$', 'TOP': 'T$', 'KID': '$',
  
  // Eastern Europe & Russia
  'RUB': '₽', 'UAH': '₴', 'BYN': 'Br', 'MDL': 'L', 'GEL': '₾', 'AMD': '֏', 'AZN': '₼', 'KZT': '₸',
  'UZS': 'soʻm', 'KGS': 'с', 'TJS': 'SM', 'TMT': 'T',
  
  // Additional
  'IQD': 'ع.د', 'IRR': '﷼', 'AFN': '؋', 'LBP': 'ل.ل', 'SYP': '£', 'YER': '﷼', 'MVR': 'Rf', 'BND': 'B$'
};