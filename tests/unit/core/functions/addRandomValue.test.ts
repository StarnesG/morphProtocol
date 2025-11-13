import addRandomValuePair from '../../../../src/core/functions/addRandomValue';
import { buffersEqual } from '../../../helpers/test-utils';

describe('addRandomValue obfuscation function', () => {
  const keyArray = new Uint8Array(256);
  const initor = 42;

  describe('obfuscation', () => {
    it('should obfuscate data by adding initor value', () => {
      const input = new Uint8Array([0, 1, 2, 3, 4]);
      const result = addRandomValuePair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(5);
      expect(result[0]).toBe((0 + initor) % 256);
      expect(result[1]).toBe((1 + initor) % 256);
      expect(result[2]).toBe((2 + initor) % 256);
    });

    it('should handle overflow with modulo 256', () => {
      const input = new Uint8Array([250, 251, 252, 253, 254, 255]);
      const result = addRandomValuePair.obfuscation(input, keyArray, 10);

      expect(result[0]).toBe((250 + 10) % 256); // 4
      expect(result[5]).toBe((255 + 10) % 256); // 9
    });

    it('should handle empty input', () => {
      const input = new Uint8Array(0);
      const result = addRandomValuePair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(0);
    });

    it('should handle large input', () => {
      const input = new Uint8Array(1500);
      const result = addRandomValuePair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(1500);
    });
  });

  describe('deobfuscation', () => {
    it('should correctly reverse obfuscation', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      const obfuscated = addRandomValuePair.obfuscation(original, keyArray, initor);
      const deobfuscated = addRandomValuePair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });

    it('should handle underflow with modulo 256', () => {
      const input = new Uint8Array([0, 1, 2, 3, 4, 5]);
      const result = addRandomValuePair.deobfuscation(input, keyArray, 10);

      expect(result[0]).toBe((0 - 10 + 256) % 256); // 246
      expect(result[1]).toBe((1 - 10 + 256) % 256); // 247
    });

    it('should be reversible for all byte values', () => {
      const original = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        original[i] = i;
      }

      const obfuscated = addRandomValuePair.obfuscation(original, keyArray, initor);
      const deobfuscated = addRandomValuePair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });
  });

  describe('initorFn', () => {
    it('should generate a random value between 0 and 255', () => {
      const value = addRandomValuePair.initorFn();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(256);
      expect(Number.isInteger(value)).toBe(true);
    });

    it('should generate different values on multiple calls', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(addRandomValuePair.initorFn());
      }

      // Should have at least some variety (not all the same)
      expect(values.size).toBeGreaterThan(1);
    });
  });
});
