/**
 * Internationalization utility for P2P exchange platform
 * 
 * Provides localized error messages and UI text to support
 * users from different regions beyond English-only.
 */

// Default locale
const DEFAULT_LOCALE = 'en';

// Translation strings organized by locale
const translations = {
  en: {
    // Error messages
    errors: {
      CLAIM_FAILED: 'Claim failed',
      INSUFFICIENT_BALANCE: 'Insufficient balance',
      NETWORK_ERROR: 'Network error occurred',
      WALLET_NOT_CONNECTED: 'Please connect your wallet',
      NO_REWARDS_TO_CLAIM: 'No rewards available to claim',
      TRANSACTION_FAILED: 'Transaction failed',
      ACCOUNT_NOT_FOUND: 'Account not found',
      INVALID_AMOUNT: 'Invalid amount',
      TOO_MANY_REQUESTS: 'Too many requests, please wait',
      USER_REJECTED: 'Transaction rejected by user',
      RATE_LIMITED: 'Rate limited, please try again later'
    },
    // UI text
    ui: {
      CONNECT_WALLET: 'Connect wallet',
      CLAIM_REWARDS: 'Claim Rewards',
      REWARDS: 'Rewards',
      LOADING: 'Loading...',
      SUCCESS: 'Success',
      FAILED: 'Failed',
      RETRY: 'Retry',
      CANCEL: 'Cancel',
      CONFIRM: 'Confirm',
      UNCLAIMED: 'Unclaimed',
      TOTAL_EARNED: 'Total Earned',
      LAST_CLAIM: 'Last Claim',
      NEVER: 'Never',
      TOKENS: 'tokens',
      WAIT_SECONDS: 'Please wait {seconds} seconds'
    }
  },
  es: {
    errors: {
      CLAIM_FAILED: 'Reclamo falló',
      INSUFFICIENT_BALANCE: 'Saldo insuficiente',
      NETWORK_ERROR: 'Error de red ocurrió',
      WALLET_NOT_CONNECTED: 'Por favor conecta tu billetera',
      NO_REWARDS_TO_CLAIM: 'No hay recompensas disponibles para reclamar',
      TRANSACTION_FAILED: 'Transacción falló',
      ACCOUNT_NOT_FOUND: 'Cuenta no encontrada',
      INVALID_AMOUNT: 'Cantidad inválida',
      TOO_MANY_REQUESTS: 'Demasiadas solicitudes, por favor espera',
      USER_REJECTED: 'Transacción rechazada por el usuario',
      RATE_LIMITED: 'Límite de tasa alcanzado, intenta de nuevo más tarde'
    },
    ui: {
      CONNECT_WALLET: 'Conectar billetera',
      CLAIM_REWARDS: 'Reclamar Recompensas',
      REWARDS: 'Recompensas',
      LOADING: 'Cargando...',
      SUCCESS: 'Éxito',
      FAILED: 'Falló',
      RETRY: 'Reintentar',
      CANCEL: 'Cancelar',
      CONFIRM: 'Confirmar',
      UNCLAIMED: 'Sin reclamar',
      TOTAL_EARNED: 'Total Ganado',
      LAST_CLAIM: 'Último Reclamo',
      NEVER: 'Nunca',
      TOKENS: 'tokens',
      WAIT_SECONDS: 'Por favor espera {seconds} segundos'
    }
  },
  pt: {
    errors: {
      CLAIM_FAILED: 'Solicitação falhou',
      INSUFFICIENT_BALANCE: 'Saldo insuficiente',
      NETWORK_ERROR: 'Erro de rede ocorreu',
      WALLET_NOT_CONNECTED: 'Por favor conecte sua carteira',
      NO_REWARDS_TO_CLAIM: 'Não há recompensas disponíveis para reivindicar',
      TRANSACTION_FAILED: 'Transação falhou',
      ACCOUNT_NOT_FOUND: 'Conta não encontrada',
      INVALID_AMOUNT: 'Quantidade inválida',
      TOO_MANY_REQUESTS: 'Muitas solicitações, por favor aguarde',
      USER_REJECTED: 'Transação rejeitada pelo usuário',
      RATE_LIMITED: 'Taxa limitada, tente novamente mais tarde'
    },
    ui: {
      CONNECT_WALLET: 'Conectar carteira',
      CLAIM_REWARDS: 'Reivindicar Recompensas',
      REWARDS: 'Recompensas',
      LOADING: 'Carregando...',
      SUCCESS: 'Sucesso',
      FAILED: 'Falhou',
      RETRY: 'Tentar novamente',
      CANCEL: 'Cancelar',
      CONFIRM: 'Confirmar',
      UNCLAIMED: 'Não reivindicado',
      TOTAL_EARNED: 'Total Ganho',
      LAST_CLAIM: 'Última Reivindicação',
      NEVER: 'Nunca',
      TOKENS: 'tokens',
      WAIT_SECONDS: 'Por favor aguarde {seconds} segundos'
    }
  },
  fr: {
    errors: {
      CLAIM_FAILED: 'Réclamation échouée',
      INSUFFICIENT_BALANCE: 'Solde insuffisant',
      NETWORK_ERROR: 'Erreur réseau survenue',
      WALLET_NOT_CONNECTED: 'Veuillez connecter votre portefeuille',
      NO_REWARDS_TO_CLAIM: 'Aucune récompense disponible à réclamer',
      TRANSACTION_FAILED: 'Transaction échouée',
      ACCOUNT_NOT_FOUND: 'Compte non trouvé',
      INVALID_AMOUNT: 'Montant invalide',
      TOO_MANY_REQUESTS: 'Trop de demandes, veuillez patienter',
      USER_REJECTED: 'Transaction rejetée par l\'utilisateur',
      RATE_LIMITED: 'Taux limité, veuillez réessayer plus tard'
    },
    ui: {
      CONNECT_WALLET: 'Connecter portefeuille',
      CLAIM_REWARDS: 'Réclamer Récompenses',
      REWARDS: 'Récompenses',
      LOADING: 'Chargement...',
      SUCCESS: 'Succès',
      FAILED: 'Échoué',
      RETRY: 'Réessayer',
      CANCEL: 'Annuler',
      CONFIRM: 'Confirmer',
      UNCLAIMED: 'Non réclamé',
      TOTAL_EARNED: 'Total Gagné',
      LAST_CLAIM: 'Dernière Réclamation',
      NEVER: 'Jamais',
      TOKENS: 'jetons',
      WAIT_SECONDS: 'Veuillez attendre {seconds} secondes'
    }
  }
};

// Current locale state
let currentLocale = DEFAULT_LOCALE;

/**
 * Set the current locale
 * @param {string} locale - Locale code (e.g., 'en', 'es', 'pt', 'fr')
 */
export const setLocale = (locale) => {
  if (translations[locale]) {
    currentLocale = locale;
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2p_locale', locale);
    }
  } else {
    console.warn(`Locale '${locale}' not supported, using default '${DEFAULT_LOCALE}'`);
  }
};

/**
 * Get the current locale
 * @returns {string} Current locale code
 */
export const getLocale = () => currentLocale;

/**
 * Initialize locale from localStorage or browser preference
 */
export const initializeLocale = () => {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage first
    const savedLocale = localStorage.getItem('p2p_locale');
    if (savedLocale && translations[savedLocale]) {
      currentLocale = savedLocale;
      return;
    }
    
    // Fall back to browser language
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && translations[browserLang]) {
      currentLocale = browserLang;
      localStorage.setItem('p2p_locale', browserLang);
    }
  }
};

/**
 * Get translated text
 * @param {string} category - Category ('errors' or 'ui')
 * @param {string} key - Translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Translated text
 */
export const t = (category, key, params = {}) => {
  const translation = translations[currentLocale]?.[category]?.[key] 
                   || translations[DEFAULT_LOCALE]?.[category]?.[key]
                   || key;
  
  // Simple parameter interpolation
  return Object.keys(params).reduce((str, param) => {
    return str.replace(`{${param}}`, params[param]);
  }, translation);
};

/**
 * Get error message
 * @param {string} key - Error key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Localized error message
 */
export const getErrorMessage = (key, params = {}) => t('errors', key, params);

/**
 * Get UI text
 * @param {string} key - UI text key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Localized UI text
 */
export const getUIText = (key, params = {}) => t('ui', key, params);

/**
 * Get all available locales
 * @returns {string[]} Array of locale codes
 */
export const getAvailableLocales = () => Object.keys(translations);

/**
 * Check if a locale is supported
 * @param {string} locale - Locale code to check
 * @returns {boolean} True if locale is supported
 */
export const isLocaleSupported = (locale) => translations.hasOwnProperty(locale);

// Initialize locale on module load
initializeLocale();

export default {
  setLocale,
  getLocale,
  t,
  getErrorMessage,
  getUIText,
  getAvailableLocales,
  isLocaleSupported,
  initializeLocale
};