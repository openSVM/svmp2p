import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders correctly with default props', () => {
    render(<LoadingSpinner />);
    
    const spinnerContainer = screen.getByText('Loading...');
    expect(spinnerContainer).toBeInTheDocument();
    
    const spinnerElement = spinnerContainer.parentElement;
    expect(spinnerElement).toHaveClass('loading-spinner-container');
    
    const spinner = spinnerElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
    expect(spinner).toHaveClass('spinner-primary');
  });

  test('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    
    const spinnerText = screen.getByText('Please wait...');
    expect(spinnerText).toBeInTheDocument();
  });

  test('renders without text when text prop is empty', () => {
    render(<LoadingSpinner text="" />);
    
    const spinnerContainer = screen.getByRole('generic', { name: '' });
    expect(spinnerContainer).toHaveClass('loading-spinner-container');
    
    const textElement = spinnerContainer.querySelector('.spinner-text');
    expect(textElement).toBeNull();
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    const spinnerContainer = screen.getByText('Loading...');
    const spinner = spinnerContainer.parentElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-small');
    expect(spinner).not.toHaveClass('spinner-medium');
    expect(spinner).not.toHaveClass('spinner-large');
  });

  test('renders with medium size', () => {
    render(<LoadingSpinner size="medium" />);
    
    const spinnerContainer = screen.getByText('Loading...');
    const spinner = spinnerContainer.parentElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
    expect(spinner).not.toHaveClass('spinner-small');
    expect(spinner).not.toHaveClass('spinner-large');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinnerContainer = screen.getByText('Loading...');
    const spinner = spinnerContainer.parentElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-large');
    expect(spinner).not.toHaveClass('spinner-small');
    expect(spinner).not.toHaveClass('spinner-medium');
  });

  test('renders with different colors', () => {
    const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    
    colors.forEach(color => {
      const { unmount, container } = render(<LoadingSpinner color={color} />);
      
      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toHaveClass(`spinner-${color}`);
      
      unmount();
    });
  });

  test('uses default size when invalid size is provided', () => {
    render(<LoadingSpinner size="invalid-size" />);
    
    const spinnerContainer = screen.getByText('Loading...');
    const spinner = spinnerContainer.parentElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
  });

  test('uses default color when invalid color is provided', () => {
    render(<LoadingSpinner color="invalid-color" />);
    
    const spinnerContainer = screen.getByText('Loading...');
    const spinner = spinnerContainer.parentElement.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-primary');
  });
});
