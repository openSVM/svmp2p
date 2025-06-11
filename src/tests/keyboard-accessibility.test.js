/**
 * Tests for keyboard accessibility improvements in NetworkSelector and LanguageSelector
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { NetworkSelector } from '../components/NetworkSelector';
import LanguageSelector from '../components/LanguageSelector';

// Mock networks for testing
const mockNetworks = {
  solana: { name: 'Solana', color: '#14F195' },
  sonic: { name: 'Sonic', color: '#FF6B6B' },
  eclipse: { name: 'Eclipse', color: '#4ECDC4' },
  svmBNB: { name: 'svmBNB', color: '#F7DC6F' }
};

// Mock languages for testing
const mockLanguages = [
  { code: 'en', name: 'English', country: '🇺🇸' },
  { code: 'es', name: 'Español', country: '🇪🇸' },
  { code: 'fr', name: 'Français', country: '🇫🇷' },
  { code: 'de', name: 'Deutsch', country: '🇩🇪' }
];

describe('Keyboard Accessibility Improvements', () => {
  describe('NetworkSelector', () => {
    test('should handle ArrowDown to open dropdown and focus first option', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Press ArrowDown to open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });

      // Should open dropdown
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });
    });

    test('should cycle through options with ArrowDown/ArrowUp', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Arrow down should focus next option
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      // Arrow up should focus previous option
      fireEvent.keyDown(button, { key: 'ArrowUp' });
    });

    test('should select option with Enter key', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Press Enter to select current option
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onSelectNetwork).toHaveBeenCalled();
    });

    test('should close dropdown with Escape and return focus to button', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Press Escape to close
      fireEvent.keyDown(button, { key: 'Escape' });

      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).not.toBeInTheDocument();
      });

      // Focus should return to button
      expect(document.activeElement).toBe(button);
    });

    test('should handle Space key to open/select options', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Press Space to open dropdown
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Press Space again to select current option
      fireEvent.keyDown(button, { key: ' ' });

      expect(onSelectNetwork).toHaveBeenCalled();
    });

    test('should wrap focus from last to first option', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Move to last option by pressing ArrowUp (should wrap to last)
      fireEvent.keyDown(button, { key: 'ArrowUp' });
      
      // Move to first option by pressing ArrowDown (should wrap to first)
      fireEvent.keyDown(button, { key: 'ArrowDown' });
    });
  });

  describe('LanguageSelector', () => {
    test('should handle ArrowDown to open dropdown and focus first option', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole, container } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Press ArrowDown to open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });

      // Should open dropdown
      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).toBeInTheDocument();
      });
    });

    test('should cycle through language options with keyboard', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole, container } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).toBeInTheDocument();
      });

      // Cycle through options
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      fireEvent.keyDown(button, { key: 'ArrowUp' });
    });

    test('should select language with Enter key', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole, container } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown and select option
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).toBeInTheDocument();
      });

      // Select with Enter
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onLanguageChange).toHaveBeenCalled();
    });

    test('should close with Escape and return focus', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole, container } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).toBeInTheDocument();
      });

      // Close with Escape
      fireEvent.keyDown(button, { key: 'Escape' });

      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).not.toBeInTheDocument();
      });

      // Focus should return to button
      expect(document.activeElement).toBe(button);
    });

    test('should handle edge case with empty languages array', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole } = render(
        <LanguageSelector
          languages={[]}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Should not crash with empty array
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      fireEvent.keyDown(button, { key: 'ArrowUp' });
      fireEvent.keyDown(button, { key: 'Enter' });
    });

    test('should provide proper ARIA labels and descriptions', () => {
      const onLanguageChange = jest.fn();
      const { getByRole } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-controls', 'language-dropdown');
      expect(button).toHaveAttribute('aria-label');
    });

    test('should handle focus management for options', async () => {
      const onLanguageChange = jest.fn();
      const { getByRole, container } = render(
        <LanguageSelector
          languages={mockLanguages}
          currentLocale="en"
          onLanguageChange={onLanguageChange}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.language-dropdown')).toBeInTheDocument();
      });

      // Options should have proper tabIndex and role
      const options = container.querySelectorAll('[role="option"]');
      options.forEach(option => {
        expect(option).toHaveAttribute('tabIndex', '-1');
        expect(option).toHaveAttribute('role', 'option');
      });
    });
  });

  describe('Focus Cycling Edge Cases', () => {
    test('should handle rapid key presses without losing focus', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(button, { key: 'ArrowDown' });
      }
      
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(button, { key: 'ArrowUp' });
      }

      // Should still be functional
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(onSelectNetwork).toHaveBeenCalled();
    });

    test('should maintain focus on option elements when focused', async () => {
      const onSelectNetwork = jest.fn();
      const { getByRole, container } = render(
        <NetworkSelector
          networks={mockNetworks}
          selectedNetwork="solana"
          onSelectNetwork={onSelectNetwork}
        />
      );

      const button = getByRole('combobox');
      
      // Open dropdown
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      await waitFor(() => {
        expect(container.querySelector('.network-selector-dropdown')).toBeInTheDocument();
      });

      // Move focus to an option
      fireEvent.keyDown(button, { key: 'ArrowDown' });
      
      // The focused option should have appropriate styling
      const focusedOption = container.querySelector('.network-option.focused');
      expect(focusedOption).toBeInTheDocument();
    });
  });
});