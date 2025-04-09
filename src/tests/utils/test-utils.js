import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Test utilities for common testing patterns
export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return {
    user: userEvent.setup(),
    ...render(ui),
  };
};

export const renderWithProviders = (ui, { providers = [] } = {}) => {
  return {
    user: userEvent.setup(),
    ...render(
      providers.reduce((acc, Provider) => {
        const [ProviderComponent, props] = Array.isArray(Provider) 
          ? Provider 
          : [Provider, {}];
        return <ProviderComponent {...props}>{acc}</ProviderComponent>;
      }, ui)
    ),
  };
};

export const waitForElementToBeRemoved = async (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = callback();
      if (!element) {
        return true;
      }
    } catch (error) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Element not removed within timeout');
};

export const mockFetch = (data) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      ok: true,
    })
  );
};

export const mockFetchError = (status = 500, statusText = 'Internal Server Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.reject(new Error(statusText)),
      text: () => Promise.reject(new Error(statusText)),
      ok: false,
      status,
      statusText,
    })
  );
};

export const mockLocalStorage = (initialData = {}) => {
  const store = { ...initialData };
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => {
          delete store[key];
        });
      }),
      key: jest.fn(index => {
        return Object.keys(store)[index] || null;
      }),
      get length() {
        return Object.keys(store).length;
      },
    },
    writable: true,
  });
  
  return store;
};

export const mockWindowLocation = (location) => {
  const originalLocation = window.location;
  delete window.location;
  
  window.location = {
    ...originalLocation,
    ...location,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  };
  
  return () => {
    window.location = originalLocation;
  };
};

export const mockConsole = () => {
  const originalConsole = { ...console };
  
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
  console.info = jest.fn();
  
  return () => {
    Object.assign(console, originalConsole);
  };
};

export const createMockWallet = (address = '5Gh7Ld7UUAKAdTZu3xcGpU5PYwwGJsGmZP1Gb9DUXwU3', connected = true) => {
  return {
    publicKey: { toString: () => address },
    isConnected: connected,
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    signTransaction: jest.fn(() => Promise.resolve()),
    signAllTransactions: jest.fn(() => Promise.resolve()),
  };
};
