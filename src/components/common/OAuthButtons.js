/**
 * OAuth Authentication Buttons Component
 * 
 * Migrated from .legacy/OAuthButtons.js with improvements:
 * - Better accessibility and keyboard navigation
 * - Enhanced loading states and error handling
 * - Cleaner separation of concerns
 * - Improved responsive design
 */

import React from 'react';
import { OAuthMethod } from '@getpara/web-sdk';

// Configuration for OAuth providers with better organization
const OAUTH_PROVIDERS = [
  {
    method: OAuthMethod.GOOGLE,
    name: 'Google',
    icon: '🔍',
    colorClasses: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300',
    description: 'Sign in with your Google account',
  },
  {
    method: OAuthMethod.APPLE,
    name: 'Apple',
    icon: '🍎',
    colorClasses: 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-400',
    description: 'Sign in with your Apple ID',
  },
  {
    method: OAuthMethod.FARCASTER,
    name: 'Farcaster',
    icon: '🟣',
    colorClasses: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-300',
    description: 'Sign in with your Farcaster account',
  },
];

/**
 * Individual OAuth button component for better reusability
 */
const OAuthButton = ({ 
  provider, 
  onSelect, 
  isLoading, 
  disabled = false 
}) => {
  const handleClick = () => {
    if (!disabled && !isLoading) {
      onSelect(provider.method);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex items-center justify-center gap-3 px-4 py-3 rounded-lg 
        text-white font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${provider.colorClasses}
        ${isLoading ? 'animate-pulse' : ''}
      `}
      disabled={disabled || isLoading}
      aria-label={`${provider.description}${isLoading ? ' (Loading...)' : ''}`}
      title={provider.description}
    >
      <span className="text-xl" role="img" aria-hidden="true">
        {provider.icon}
      </span>
      <span>
        Continue with {provider.name}
      </span>
      {isLoading && (
        <div 
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

/**
 * Loading state component
 */
const AuthenticationLoading = () => (
  <div className="flex flex-col items-center justify-center p-6 space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Authenticating...
      </h3>
      <p className="text-sm text-gray-600">
        Please complete authentication in the popup window
      </p>
    </div>
  </div>
);

/**
 * Main OAuth buttons component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when OAuth method is selected
 * @param {boolean} props.isLoading - Loading state for the entire component
 * @param {boolean} props.disabled - Whether all buttons should be disabled
 * @param {string} props.title - Custom title for the authentication section
 * @param {string} props.subtitle - Custom subtitle/description
 * @param {string} props.className - Additional CSS classes
 */
export const OAuthButtons = ({ 
  onSelect, 
  isLoading = false,
  disabled = false,
  title = "Sign in to continue",
  subtitle = null,
  className = ""
}) => {
  // Show loading state if authenticating
  if (isLoading) {
    return <AuthenticationLoading />;
  }

  return (
    <div className={`flex flex-col gap-3 w-full max-w-sm ${className}`}>
      {/* Header section */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {/* OAuth provider buttons */}
      <div className="space-y-3" role="group" aria-label="Authentication options">
        {OAUTH_PROVIDERS.map((provider) => (
          <OAuthButton
            key={provider.method}
            provider={provider}
            onSelect={onSelect}
            isLoading={isLoading}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Terms and privacy notice */}
      <div className="text-xs text-gray-500 text-center mt-4 px-2">
        By continuing, you agree to our{' '}
        <a 
          href="/terms" 
          className="underline hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
        {' '}and{' '}
        <a 
          href="/privacy" 
          className="underline hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default OAuthButtons;