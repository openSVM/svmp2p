/**
 * OAuth Authentication Buttons Component
 * 
 * Provides OAuth login options for Swig wallet authentication
 */

import React from 'react';
import { OAuthMethod } from '@getpara/web-sdk';

/**
 * OAuth authentication buttons component
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when OAuth method is selected
 * @param {boolean} props.isLoading - Loading state
 */
export const OAuthButtons = ({ onSelect, isLoading = false }) => {
  const oauthMethods = [
    {
      method: OAuthMethod.GOOGLE,
      name: 'Google',
      icon: '🔍',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      method: OAuthMethod.APPLE,
      name: 'Apple',
      icon: '🍎',
      color: 'bg-gray-800 hover:bg-gray-900',
    },
    {
      method: OAuthMethod.FARCASTER,
      name: 'Farcaster',
      icon: '🟣',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Authenticating...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <h3 className="text-lg font-semibold text-center mb-2">Sign in to continue</h3>
      {oauthMethods.map(({ method, name, icon, color }) => (
        <button
          key={method}
          onClick={() => onSelect(method)}
          className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-colors ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isLoading}
        >
          <span className="text-xl">{icon}</span>
          <span>Continue with {name}</span>
        </button>
      ))}
      <div className="text-xs text-gray-500 text-center mt-2">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
};

export default OAuthButtons;