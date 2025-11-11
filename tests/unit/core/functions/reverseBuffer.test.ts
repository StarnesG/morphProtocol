import reverseBufferPair from '../../../../src/core/functions/reverseBuffer';
import { buffersEqual } from '../../../helpers/test-utils';

describe('reverseBuffer obfuscation function', () => {
  const keyArray = new Uint8Array(256);
  const initor = 0;

  describe('obfuscation and deobfuscation', () => {
    it('should reverse the buffer', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(5);
      expect(result[1]).toBe(4);
      expect(result[2]).toBe(3);
      expect(result[3]).toBe(2);
      expect(result[4]).toBe(1);
    });

    it('should be self-reversible (reverse twice returns original)', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      
      const obfuscated = reverseBufferPair.obfuscation(original, keyArray, initor);
      const deobfuscated = reverseBufferPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });

    it('should handle single element', () => {
      const input = new Uint8Array([42]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(42);
    });

    it('should handle two elements', () => {
      const input = new Uint8Array([1, 2]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(2);
      expect(result[1]).toBe(1);
    });

    it('should handle empty input', () => {
      const input = new Uint8Array(0);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(0);
    });

    it('should handle palindrome correctly', () => {
      const input = new Uint8Array([1, 2, 3, 2, 1]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(buffersEqual(Buffer.from(result), Buffer.from(input))).toBe(true);
    });

    it('should be reversible for large data', () => {
      const original = new Uint8Array(1500);
      for (let i = 0; i < 1500; i++) {
        original[i] = i % 256;
      }

      const obfuscated = reverseBufferPair.obfuscation(original, keyArray, initor);
      const deobfuscated = reverseBufferPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });
  });

  describe('reverse properties', () => {
    it('should maintain buffer length', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      expect(result.length).toBe(input.length);
    });

    it('should preserve all values', () => {
      const input = new Uint8Array([10, 20, 30, 40, 50]);
      const result = reverseBufferPair.obfuscation(input, keyArray, initor);

      const inputSorted = Array.from(input).sort();
      const resultSorted = Array.from(result).sort();

      expect(resultSorted).toEqual(inputSorted);
    });
  });
});
