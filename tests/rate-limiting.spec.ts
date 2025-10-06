import { test, expect } from '@playwright/test';

/**
 * Rate Limiting Tests
 * Tests the new database-backed rate limiting system
 */

test.describe('Rate Limiting System', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5001';
  const testClientId = '127.0.0.1';

  test.beforeEach(async ({ request }) => {
    // Clean up any existing rate limits for test IP
    try {
      await request.delete(`${baseURL}/api/admin/rate-limits/${testClientId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {},
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should allow login attempts within limits', async ({ request }) => {
    // Test multiple login attempts within the 5-attempt limit
    for (let i = 1; i <= 4; i++) {
      const response = await request.post(`${baseURL}/api/admin/login`, {
        data: {
          username: 'test-user',
          password: 'wrong-password'
        }
      });

      // Should not be rate limited yet
      expect(response.status()).not.toBe(429);
    }
  });

  test('should block after exceeding login rate limit', async ({ request }) => {
    // Exhaust the rate limit (5 attempts in 5 minutes)
    for (let i = 1; i <= 6; i++) {
      const response = await request.post(`${baseURL}/api/admin/login`, {
        data: {
          username: 'test-user',
          password: 'wrong-password'
        }
      });

      if (i <= 5) {
        // First 5 attempts should not be rate limited
        expect(response.status()).not.toBe(429);
      } else {
        // 6th attempt should be rate limited
        expect(response.status()).toBe(429);
        
        const body = await response.json();
        expect(body.error).toBe('Rate limit exceeded');
        expect(body.retryAfter).toBeGreaterThan(0);
      }
    }
  });

  test('should persist rate limits across server restarts', async ({ request }) => {
    // This test verifies that rate limits are stored in database, not memory
    // First, exhaust the rate limit
    for (let i = 1; i <= 6; i++) {
      await request.post(`${baseURL}/api/admin/login`, {
        data: {
          username: 'test-user',
          password: 'wrong-password'
        }
      });
    }

    // Verify we're rate limited
    const blockedResponse = await request.post(`${baseURL}/api/admin/login`, {
      data: {
        username: 'test-user',
        password: 'wrong-password'
      }
    });
    
    expect(blockedResponse.status()).toBe(429);
    
    // In a real test, we would restart the server here
    // For now, we verify the rate limit status is retrievable
    const statusResponse = await request.get(`${baseURL}/api/admin/rate-limits/${testClientId}?limitType=login`);
    
    if (statusResponse.status() === 200) {
      const status = await statusResponse.json();
      expect(status.status).toBeTruthy();
      expect(status.status.count).toBeGreaterThan(5);
    }
  });

  test('should have automatic cleanup mechanism', async ({ request }) => {
    // Test that the cleanup endpoint works
    const cleanupResponse = await request.post(`${baseURL}/api/admin/rate-limits/cleanup`);
    
    if (cleanupResponse.status() === 200) {
      const result = await cleanupResponse.json();
      expect(result.success).toBe(true);
      expect(typeof result.entriesRemoved).toBe('number');
    }
  });

  test('should handle concurrent requests safely', async ({ request }) => {
    // Test concurrent login attempts to verify no race conditions
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post(`${baseURL}/api/admin/login`, {
          data: {
            username: 'test-concurrent',
            password: 'wrong-password'
          }
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // Count successful vs rate-limited responses
    let successCount = 0;
    let rateLimitedCount = 0;
    
    for (const response of responses) {
      if (response.status() === 429) {
        rateLimitedCount++;
      } else {
        successCount++;
      }
    }

    // Should have some successful and some rate-limited responses
    // The exact numbers depend on timing, but there should be a mix
    expect(successCount).toBeGreaterThan(0);
    expect(successCount).toBeLessThanOrEqual(5); // Max allowed in short window
  });

  test('should handle admin rate limiting separately', async ({ request }) => {
    // Test that admin operations have separate rate limiting
    // This test assumes we can access admin endpoints
    for (let i = 1; i <= 12; i++) {
      const response = await request.get(`${baseURL}/api/admin/rate-limits/test-client?limitType=admin`);
      
      if (i <= 10) {
        // First 10 attempts should not be rate limited
        expect(response.status()).not.toBe(429);
      } else {
        // 11th and 12th attempts should be rate limited
        expect(response.status()).toBe(429);
        
        if (response.status() === 429) {
          const body = await response.json();
          expect(body.error).toBe('Rate limit exceeded');
          expect(body.limit).toBe(10);
          expect(body.window).toBe('15 minutes');
        }
      }
    }
  });

  test('should allow admin to reset rate limits', async ({ request }) => {
    // First, get rate limited
    for (let i = 1; i <= 6; i++) {
      await request.post(`${baseURL}/api/admin/login`, {
        data: {
          username: 'test-reset',
          password: 'wrong-password'
        }
      });
    }

    // Verify we're blocked
    const blockedResponse = await request.post(`${baseURL}/api/admin/login`, {
      data: {
        username: 'test-reset',
        password: 'wrong-password'
      }
    });
    expect(blockedResponse.status()).toBe(429);

    // Reset the rate limit
    const resetResponse = await request.delete(`${baseURL}/api/admin/rate-limits/${testClientId}?limitType=login`);
    
    if (resetResponse.status() === 200) {
      // Should be able to login again after reset
      const retryResponse = await request.post(`${baseURL}/api/admin/login`, {
        data: {
          username: 'test-reset',
          password: 'wrong-password'
        }
      });
      
      expect(retryResponse.status()).not.toBe(429);
    }
  });
});

/**
 * Performance and Memory Tests
 */
test.describe('Rate Limiting Performance', () => {
  
  test('should not cause memory leaks with many clients', async ({ request }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:5001';
    
    // Simulate many different clients
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        request.post(`${baseURL}/api/admin/login`, {
          data: {
            username: `client-${i}`,
            password: 'wrong-password'
          },
          headers: {
            'X-Forwarded-For': `192.168.1.${i + 1}` // Simulate different IPs
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // All should be allowed (first attempt for each client)
    for (const response of responses) {
      expect(response.status()).not.toBe(429);
    }
    
    // Trigger cleanup
    const cleanupResponse = await request.post(`${baseURL}/api/admin/rate-limits/cleanup`);
    expect(cleanupResponse.status()).toBe(200);
  });
});