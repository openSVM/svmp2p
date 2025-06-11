import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Test Confirmation',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default'
  };

  it('renders when isOpen is true', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Confirm'));
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close (×) button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Close'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog content is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);
    
    const dialogContent = screen.getByRole('dialog');
    await user.click(dialogContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('applies correct variant class', () => {
    const { rerender } = render(<ConfirmationDialog {...defaultProps} variant="danger" />);
    
    expect(screen.getByRole('dialog')).toHaveClass('danger');
    expect(screen.getByText('Confirm')).toHaveClass('danger');
    
    rerender(<ConfirmationDialog {...defaultProps} variant="warning" />);
    
    expect(screen.getByRole('dialog')).toHaveClass('warning');
    expect(screen.getByText('Confirm')).toHaveClass('warning');
  });

  it('uses custom confirm and cancel text', () => {
    render(
      <ConfirmationDialog 
        {...defaultProps} 
        confirmText="Yes, Delete" 
        cancelText="No, Keep"
      />
    );
    
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('removes event listener when dialog closes', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { rerender } = render(<ConfirmationDialog {...defaultProps} />);
    
    // Close the dialog
    rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
});