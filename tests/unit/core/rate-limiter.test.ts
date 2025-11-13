import { RateLimiter } from '../../../src/core/rate-limiter';
import { wait } from '../../helpers/test-utils';

describe('RateLimiter', () => {
  describe('constructor', () => {
    it('should create a rate limiter instance', () => {
      const limiter = new RateLimiter(10, 1000);
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should accept different limits and windows', () => {
      const limiter1 = new RateLimiter(5, 500);
      const limiter2 = new RateLimiter(100, 60000);
      
      expect(limiter1).toBeInstanceOf(RateLimiter);
      expect(limiter2).toBeInstanceOf(RateLimiter);
    });
  });

  describe('isAllowed', () => {
    it('should allow requests under the limit', () => {
      const limiter = new RateLimiter(5, 1000);
      const key = 'test-key';

      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed(key)).toBe(true);
      }
    });

    it('should block requests over the limit', () => {
      const limiter = new RateLimiter(3, 1000);
      const key = 'test-key';

      // First 3 should be allowed
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);

      // 4th should be blocked
      expect(limiter.isAllowed(key)).toBe(false);
    });

    it('should track different keys independently', () => {
      const limiter = new RateLimiter(2, 1000);

      // Key1: 2 requests (at limit)
      expect(limiter.isAllowed('key1')).toBe(true);
      expect(limiter.isAllowed('key1')).toBe(true);
      expect(limiter.isAllowed('key1')).toBe(false);

      // Key2: should still be allowed
      expect(limiter.isAllowed('key2')).toBe(true);
      expect(limiter.isAllowed('key2')).toBe(true);
      expect(limiter.isAllowed('key2')).toBe(false);
    });

    it('should reset after time window expires', async () => {
      const limiter = new RateLimiter(2, 100); // 100ms window
      const key = 'test-key';

      // Use up the limit
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);

      // Wait for window to expire
      await wait(150);

      // Should be allowed again
      expect(limiter.isAllowed(key)).toBe(true);
    });

    it('should handle rapid requests correctly', () => {
      const limiter = new RateLimiter(10, 1000);
      const key = 'test-key';

      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        expect(limiter.isAllowed(key)).toBe(true);
      }

      // 11th should be blocked
      expect(limiter.isAllowed(key)).toBe(false);
    });

    it('should handle sliding window correctly', async () => {
      const limiter = new RateLimiter(3, 200); // 3 requests per 200ms
      const key = 'test-key';

      // Make 3 requests at t=0
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);

      // Wait 100ms (half the window)
      await wait(100);

      // Still blocked (window hasn't fully expired)
      expect(limiter.isAllowed(key)).toBe(false);

      // Wait another 150ms (total 250ms, window expired)
      await wait(150);

      // Should be allowed again
      expect(limiter.isAllowed(key)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle limit of 1', () => {
      const limiter = new RateLimiter(1, 1000);
      const key = 'test-key';

      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);
    });

    it('should handle very large limits', () => {
      const limiter = new RateLimiter(10000, 1000);
      const key = 'test-key';

      for (let i = 0; i < 100; i++) {
        expect(limiter.isAllowed(key)).toBe(true);
      }
    });

    it('should handle very short time windows', async () => {
      const limiter = new RateLimiter(2, 10); // 10ms window
      const key = 'test-key';

      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);

      await wait(20);

      expect(limiter.isAllowed(key)).toBe(true);
    });

    it('should handle empty key string', () => {
      const limiter = new RateLimiter(2, 1000);

      expect(limiter.isAllowed('')).toBe(true);
      expect(limiter.isAllowed('')).toBe(true);
      expect(limiter.isAllowed('')).toBe(false);
    });

    it('should handle special characters in keys', () => {
      const limiter = new RateLimiter(2, 1000);
      const key = '192.168.1.1:12345';

      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);
    });
  });

  describe('memory management', () => {
    it('should clean up old entries', async () => {
      const limiter = new RateLimiter(2, 100);

      // Create entries for multiple keys
      for (let i = 0; i < 10; i++) {
        limiter.isAllowed(`key${i}`);
      }

      // Wait for entries to expire
      await wait(150);

      // Make new requests (should trigger cleanup)
      for (let i = 0; i < 10; i++) {
        limiter.isAllowed(`key${i}`);
      }

      // All should be allowed (old entries cleaned up)
      for (let i = 0; i < 10; i++) {
        expect(limiter.isAllowed(`key${i}`)).toBe(true);
      }
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests from same key', () => {
      const limiter = new RateLimiter(5, 1000);
      const key = 'test-key';

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(limiter.isAllowed(key));
      }

      // First 5 should be true, rest false
      expect(results.slice(0, 5).every(r => r === true)).toBe(true);
      expect(results.slice(5).every(r => r === false)).toBe(true);
    });

    it('should handle concurrent requests from different keys', () => {
      const limiter = new RateLimiter(2, 1000);

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(limiter.isAllowed(`key${i}`));
        results.push(limiter.isAllowed(`key${i}`));
      }

      // All should be allowed (different keys)
      expect(results.every(r => r === true)).toBe(true);
    });
  });
});
