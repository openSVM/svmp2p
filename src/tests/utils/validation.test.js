import { validateSolAmount, validateFiatAmount, validateMarketRate } from '../../utils/validation';
import { VALIDATION_CONSTRAINTS } from '../../constants/tradingConstants';

describe('Input Validation Utils', () => {
  describe('validateSolAmount', () => {
    it('validates valid SOL amounts', () => {
      expect(validateSolAmount('1.0')).toBe(true);
      expect(validateSolAmount('0.01')).toBe(true);
      expect(validateSolAmount('100')).toBe(true);
      expect(validateSolAmount(5.5)).toBe(true);
    });

    it('rejects invalid SOL amounts', () => {
      expect(validateSolAmount('0')).toContain('must be greater than 0');
      expect(validateSolAmount('-1')).toContain('must be greater than 0');
      expect(validateSolAmount('abc')).toContain('valid number');
      expect(validateSolAmount('')).toContain('valid number');
    });

    it('enforces minimum SOL amount', () => {
      const belowMin = (VALIDATION_CONSTRAINTS.SOL_AMOUNT.min - 0.001).toString();
      expect(validateSolAmount(belowMin)).toContain(`Minimum SOL amount is ${VALIDATION_CONSTRAINTS.SOL_AMOUNT.min}`);
    });

    it('enforces maximum SOL amount', () => {
      const aboveMax = (VALIDATION_CONSTRAINTS.SOL_AMOUNT.max + 1).toString();
      expect(validateSolAmount(aboveMax)).toContain(`Maximum SOL amount is ${VALIDATION_CONSTRAINTS.SOL_AMOUNT.max}`);
    });
  });

  describe('validateFiatAmount', () => {
    it('validates valid fiat amounts', () => {
      expect(validateFiatAmount('100', 'USD')).toBe(true);
      expect(validateFiatAmount('1000', 'EUR')).toBe(true);
      expect(validateFiatAmount('15000', 'JPY')).toBe(true);
      expect(validateFiatAmount(50.25)).toBe(true);
    });

    it('rejects invalid fiat amounts', () => {
      expect(validateFiatAmount('0')).toContain('must be greater than 0');
      expect(validateFiatAmount('-100')).toContain('must be greater than 0');
      expect(validateFiatAmount('abc')).toContain('valid number');
      expect(validateFiatAmount('')).toContain('valid number');
    });

    it('enforces different minimums for different currencies', () => {
      // JPY should have higher minimum
      expect(validateFiatAmount('50', 'JPY')).toContain('Minimum amount is 100 JPY');
      
      // USD should have lower minimum
      expect(validateFiatAmount('0.5', 'USD')).toContain('Minimum amount is 1 USD');
    });

    it('enforces different maximums for different currencies', () => {
      // JPY should have higher maximum
      const highJPY = '20000000';
      expect(validateFiatAmount(highJPY, 'JPY')).toContain('Maximum amount is 10000000 JPY');
      
      // USD should have lower maximum
      const highUSD = '200000';
      expect(validateFiatAmount(highUSD, 'USD')).toContain('Maximum amount is 100000 USD');
    });
  });

  describe('validateMarketRate', () => {
    it('validates reasonable market rates', () => {
      expect(validateMarketRate(1, 150, 'USD')).toBe(true);
      expect(validateMarketRate(2, 300, 'USD')).toBe(true);
      expect(validateMarketRate(1, 16000, 'JPY')).toBe(true);
    });

    it('warns about unusually low rates', () => {
      const result = validateMarketRate(1, 25, 'USD'); // Very low rate
      expect(result).toContain('Rate seems unusually low');
      expect(result).toContain('25.00 USD/SOL');
    });

    it('warns about unusually high rates', () => {
      const result = validateMarketRate(1, 500, 'USD'); // Very high rate
      expect(result).toContain('Rate seems unusually high');
      expect(result).toContain('500.00 USD/SOL');
    });

    it('handles different currencies appropriately', () => {
      // Test JPY rates
      expect(validateMarketRate(1, 16000, 'JPY')).toBe(true);
      const lowJPY = validateMarketRate(1, 5000, 'JPY');
      expect(lowJPY).toContain('unusually low');
      
      // Test EUR rates
      expect(validateMarketRate(1, 140, 'EUR')).toBe(true);
      const highEUR = validateMarketRate(1, 400, 'EUR');
      expect(highEUR).toContain('unusually high');
    });

    it('returns true for missing values', () => {
      expect(validateMarketRate(null, 150, 'USD')).toBe(true);
      expect(validateMarketRate(1, null, 'USD')).toBe(true);
      expect(validateMarketRate(0, 150, 'USD')).toBe(true);
      expect(validateMarketRate(1, 0, 'USD')).toBe(true);
    });

    it('falls back to USD rates for unknown currencies', () => {
      const result = validateMarketRate(1, 500, 'UNKNOWN');
      expect(result).toContain('unusually high');
    });
  });
});