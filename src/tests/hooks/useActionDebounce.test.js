import { renderHook, act } from '@testing-library/react';
import { useActionDebounce, useInputValidation } from '../../hooks/useActionDebounce';

// Mock timers
jest.useFakeTimers();

describe('useActionDebounce', () => {
  let mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('executes callback immediately on first call', () => {
    const { result } = renderHook(() => useActionDebounce(mockCallback, 1000));

    act(() => {
      result.current.debouncedCallback('test');
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('test');
  });

  it('disables subsequent calls during debounce period', () => {
    const { result } = renderHook(() => useActionDebounce(mockCallback, 1000));

    act(() => {
      result.current.debouncedCallback('test1');
    });

    expect(result.current.isDisabled).toBe(true);

    act(() => {
      result.current.debouncedCallback('test2');
    });

    // Should still only be called once
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('test1');
  });

  it('re-enables after debounce period', () => {
    const { result } = renderHook(() => useActionDebounce(mockCallback, 1000));

    act(() => {
      result.current.debouncedCallback('test1');
    });

    expect(result.current.isDisabled).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isDisabled).toBe(false);

    act(() => {
      result.current.debouncedCallback('test2');
    });

    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenNthCalledWith(1, 'test1');
    expect(mockCallback).toHaveBeenNthCalledWith(2, 'test2');
  });

  it('uses default delay when none provided', () => {
    const { result } = renderHook(() => useActionDebounce(mockCallback));

    act(() => {
      result.current.debouncedCallback();
    });

    expect(result.current.isDisabled).toBe(true);

    // Should use ACTION_DEBOUNCE_TIME (1000ms) as default
    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(result.current.isDisabled).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.isDisabled).toBe(false);
  });

  it('clears timeout on cleanup', () => {
    const { result, unmount } = renderHook(() => useActionDebounce(mockCallback, 1000));

    act(() => {
      result.current.debouncedCallback();
    });

    act(() => {
      result.current.cleanup();
    });

    expect(result.current.isDisabled).toBe(false);

    // Unmounting should also clean up
    unmount();
    // This tests that no errors occur during cleanup
  });
});

describe('useInputValidation', () => {
  let mockValidator;

  beforeEach(() => {
    mockValidator = jest.fn();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('validates successfully when validator returns true', () => {
    mockValidator.mockReturnValue(true);
    const { result } = renderHook(() => useInputValidation('test', mockValidator));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBe('');
    expect(mockValidator).toHaveBeenCalledWith('test');
  });

  it('shows error when validator returns error message', () => {
    const errorMessage = 'Invalid input';
    mockValidator.mockReturnValue(errorMessage);
    const { result } = renderHook(() => useInputValidation('test', mockValidator));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles validator exceptions', () => {
    mockValidator.mockImplementation(() => {
      throw new Error('Validation error');
    });
    const { result } = renderHook(() => useInputValidation('test', mockValidator));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBe('Validation error');
  });

  it('debounces validation calls', () => {
    mockValidator.mockReturnValue(true);
    const { result, rerender } = renderHook(
      ({ value }) => useInputValidation(value, mockValidator),
      { initialProps: { value: 'test1' } }
    );

    // Change value multiple times quickly
    rerender({ value: 'test2' });
    rerender({ value: 'test3' });
    rerender({ value: 'test4' });

    // Should not validate yet
    expect(mockValidator).not.toHaveBeenCalled();

    // Advance time to trigger validation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should only validate the final value
    expect(mockValidator).toHaveBeenCalledTimes(1);
    expect(mockValidator).toHaveBeenCalledWith('test4');
  });

  it('validates immediately with validateNow', () => {
    mockValidator.mockReturnValue(true);
    const { result } = renderHook(() => useInputValidation('test', mockValidator));

    act(() => {
      result.current.validateNow();
    });

    expect(mockValidator).toHaveBeenCalledTimes(1);
    expect(result.current.isValid).toBe(true);
  });

  it('skips validation for empty values', () => {
    mockValidator.mockReturnValue(true);
    const { result } = renderHook(() => useInputValidation('', mockValidator));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockValidator).not.toHaveBeenCalled();
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('skips validation for undefined values', () => {
    mockValidator.mockReturnValue(true);
    const { result } = renderHook(() => useInputValidation(undefined, mockValidator));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockValidator).not.toHaveBeenCalled();
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('uses custom delay', () => {
    mockValidator.mockReturnValue(true);
    const { result } = renderHook(() => useInputValidation('test', mockValidator, 500));

    // Should not validate at default delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockValidator).not.toHaveBeenCalled();

    // Should validate at custom delay
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockValidator).toHaveBeenCalledTimes(1);
  });
});