import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ButtonLoader from '../../components/common/ButtonLoader';

describe('ButtonLoader Component', () => {
  test('renders correctly with default props', () => {
    render(<ButtonLoader>Click Me</ButtonLoader>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click Me');
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('btn-medium');
    expect(button).not.toHaveClass('is-loading');
  });

  test('renders in loading state correctly', () => {
    render(<ButtonLoader isLoading>Click Me</ButtonLoader>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('is-loading');
    expect(button).toBeDisabled();
    
    const spinner = screen.getByText('Processing...');
    expect(spinner).toBeInTheDocument();
  });

  test('renders with custom loading text', () => {
    render(<ButtonLoader isLoading loadingText="Please wait...">Click Me</ButtonLoader>);
    
    const loadingText = screen.getByText('Please wait...');
    expect(loadingText).toBeInTheDocument();
  });

  test('handles click events correctly', () => {
    const handleClick = jest.fn();
    render(<ButtonLoader onClick={handleClick}>Click Me</ButtonLoader>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not trigger click when disabled', () => {
    const handleClick = jest.fn();
    render(<ButtonLoader disabled onClick={handleClick}>Click Me</ButtonLoader>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not trigger click when loading', () => {
    const handleClick = jest.fn();
    render(<ButtonLoader isLoading onClick={handleClick}>Click Me</ButtonLoader>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('renders with different variants', () => {
    const { rerender } = render(<ButtonLoader variant="secondary">Secondary</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    
    rerender(<ButtonLoader variant="success">Success</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-success');
    
    rerender(<ButtonLoader variant="danger">Danger</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
    
    rerender(<ButtonLoader variant="warning">Warning</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-warning');
    
    rerender(<ButtonLoader variant="info">Info</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-info');
    
    rerender(<ButtonLoader variant="outline">Outline</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-outline');
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<ButtonLoader size="small">Small</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-small');
    
    rerender(<ButtonLoader size="medium">Medium</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-medium');
    
    rerender(<ButtonLoader size="large">Large</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('btn-large');
  });

  test('applies custom className correctly', () => {
    render(<ButtonLoader className="custom-class">Custom Class</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  test('renders with correct button type', () => {
    const { rerender } = render(<ButtonLoader type="button">Button</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    
    rerender(<ButtonLoader type="submit">Submit</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    
    rerender(<ButtonLoader type="reset">Reset</ButtonLoader>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
  });
});
