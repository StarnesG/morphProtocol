import bitwiseNOTPair from '../../../../src/core/functions/bitwiseNOT';
import { buffersEqual } from '../../../helpers/test-utils';

describe('bitwiseNOT obfuscation function', () => {
  const keyArray = new Uint8Array(256);
  const initor = 0;

  describe('obfuscation and deobfuscation', () => {
    it('should invert all bits', () => {
      const input = new Uint8Array([0x00, 0xFF, 0xAA, 0x55]);
      const result = bitwiseNOTPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0xFF);
      expect(result[1]).toBe(0x00);
      expect(result[2]).toBe(0x55);
      expect(result[3]).toBe(0xAA);
    });

    it('should be self-reversible (NOT twice returns original)', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      
      const obfuscated = bitwiseNOTPair.obfuscation(original, keyArray, initor);
      const deobfuscated = bitwiseNOTPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });

    it('should handle all zeros', () => {
      const input = new Uint8Array([0, 0, 0, 0]);
      const result = bitwiseNOTPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0xFF);
      expect(result[1]).toBe(0xFF);
      expect(result[2]).toBe(0xFF);
      expect(result[3]).toBe(0xFF);
    });

    it('should handle all ones', () => {
      const input = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
      const result = bitwiseNOTPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0x00);
      expect(result[1]).toBe(0x00);
      expect(result[2]).toBe(0x00);
      expect(result[3]).toBe(0x00);
    });

    it('should handle empty input', () => {
      const input = new Uint8Array(0);
      const result = bitwiseNOTPair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(0);
    });

    it('should be reversible for all byte values', () => {
      const original = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        original[i] = i;
      }

      const obfuscated = bitwiseNOTPair.obfuscation(original, keyArray, initor);
      const deobfuscated = bitwiseNOTPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });
  });

  describe('bitwise NOT properties', () => {
    it('should satisfy NOT(NOT(x)) = x', () => {
      const input = new Uint8Array([42, 100, 200, 17, 89]);
      
      const step1 = bitwiseNOTPair.obfuscation(input, keyArray, initor);
      const step2 = bitwiseNOTPair.obfuscation(step1, keyArray, initor);

      expect(buffersEqual(Buffer.from(step2), Buffer.from(input))).toBe(true);
    });

    it('should satisfy x + NOT(x) = 0xFF', () => {
      const input = new Uint8Array([42, 100, 200]);
      const result = bitwiseNOTPair.obfuscation(input, keyArray, initor);

      for (let i = 0; i < input.length; i++) {
        expect((input[i] + result[i]) & 0xFF).toBe(0xFF);
      }
    });
  });
});
