import xorWithKeyPair from '../../../../src/core/functions/xorWithKey';
import { deterministicBuffer, buffersEqual } from '../../../helpers/test-utils';

describe('xorWithKey obfuscation function', () => {
  describe('obfuscation and deobfuscation', () => {
    it('should XOR data with key array', () => {
      const input = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]);
      const keyArray = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
      const initor = 0;

      const result = xorWithKeyPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0xAA ^ 0x11);
      expect(result[1]).toBe(0xBB ^ 0x22);
      expect(result[2]).toBe(0xCC ^ 0x33);
      expect(result[3]).toBe(0xDD ^ 0x44);
    });

    it('should be self-reversible (XOR twice returns original)', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      const keyArray = new Uint8Array([5, 15, 25, 35, 45]);
      const initor = 0;

      const obfuscated = xorWithKeyPair.obfuscation(original, keyArray, initor);
      const deobfuscated = xorWithKeyPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), Buffer.from(original))).toBe(true);
    });

    it('should handle all zero input', () => {
      const input = new Uint8Array([0, 0, 0, 0]);
      const keyArray = new Uint8Array([0xFF, 0xAA, 0x55, 0x11]);
      const initor = 0;

      const result = xorWithKeyPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0xFF);
      expect(result[1]).toBe(0xAA);
      expect(result[2]).toBe(0x55);
      expect(result[3]).toBe(0x11);
    });

    it('should handle all 0xFF input', () => {
      const input = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
      const keyArray = new Uint8Array([0xFF, 0xAA, 0x55, 0x11]);
      const initor = 0;

      const result = xorWithKeyPair.obfuscation(input, keyArray, initor);

      expect(result[0]).toBe(0xFF ^ 0xFF); // 0x00
      expect(result[1]).toBe(0xFF ^ 0xAA); // 0x55
      expect(result[2]).toBe(0xFF ^ 0x55); // 0xAA
      expect(result[3]).toBe(0xFF ^ 0x11); // 0xEE
    });

    it('should handle empty input', () => {
      const input = new Uint8Array(0);
      const keyArray = new Uint8Array(0);
      const initor = 0;

      const result = xorWithKeyPair.obfuscation(input, keyArray, initor);

      expect(result).toHaveLength(0);
    });

    it('should be reversible for large data', () => {
      const original = deterministicBuffer(1500);
      const keyArray = new Uint8Array(1500);
      for (let i = 0; i < 1500; i++) {
        keyArray[i] = (i * 7) % 256;
      }
      const initor = 0;

      const obfuscated = xorWithKeyPair.obfuscation(new Uint8Array(original), keyArray, initor);
      const deobfuscated = xorWithKeyPair.deobfuscation(obfuscated, keyArray, initor);

      expect(buffersEqual(Buffer.from(deobfuscated), original)).toBe(true);
    });
  });

  describe('XOR properties', () => {
    it('should satisfy XOR identity: A XOR 0 = A', () => {
      const input = new Uint8Array([42, 100, 200]);
      const keyArray = new Uint8Array([0, 0, 0]);
      const initor = 0;

      const result = xorWithKeyPair.obfuscation(input, keyArray, initor);

      expect(buffersEqual(Buffer.from(result), Buffer.from(input))).toBe(true);
    });

    it('should satisfy XOR self-inverse: A XOR B XOR B = A', () => {
      const input = new Uint8Array([42, 100, 200]);
      const keyArray = new Uint8Array([17, 89, 234]);
      const initor = 0;

      const step1 = xorWithKeyPair.obfuscation(input, keyArray, initor);
      const step2 = xorWithKeyPair.obfuscation(step1, keyArray, initor);

      expect(buffersEqual(Buffer.from(step2), Buffer.from(input))).toBe(true);
    });
  });
});
