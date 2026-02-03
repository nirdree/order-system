/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for request throttling
 * Uses in-memory Map for edge runtime compatibility
 */

// Global store for rate limit tracking
const rateLimitStore = new Map();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Rate limit configurations
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 requests per 15 min
  },
  // Login endpoint - very strict
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3 // 3 attempts per 15 min
  },
  // Signup endpoint - moderate
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 requests per hour
  },
  // API endpoints - standard limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  },
  // Database write operations - stricter
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  },
  // Dashboard/read operations - higher limit
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }
};

/**
 * Get client identifier (IP address or user ID)
 */
export function getClientId(request) {
  // Try to get user ID from token
  const authToken = request.headers.get('cookie')?.match(/authToken=([^;]+)/)?.[1];
  if (authToken) {
    try {
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.userId) return `user-${payload.userId}`;
      }
    } catch (err) {
      // Fall through to IP-based identification
    }
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || request.ip || 'unknown';
  return `ip-${ip}`;
}

/**
 * Check if request exceeds rate limit
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(clientId, config = RATE_LIMITS.api) {
  const now = Date.now();
  const key = `${clientId}`;

  // Get or create rate limit record
  let record = rateLimitStore.get(key);
  
  if (!record || now - record.resetTime > config.windowMs) {
    // Window expired, reset counter
    record = {
      count: 0,
      resetTime: now,
      window: config.windowMs
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetTime = record.resetTime + config.windowMs;

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter: Math.ceil((resetTime - now) / 1000)
  };
}

/**
 * Cleanup old entries from rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.resetTime > record.window * 2) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Rate Limit] Cleaned up ${cleanedCount} expired entries`);
  }
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(remaining, resetTime, retryAfter) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      remaining,
      resetTime: new Date(resetTime).toISOString(),
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      }
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(response, remaining, resetTime) {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  return response;
}

// Setup periodic cleanup (only if in Node.js environment)
if (typeof global !== 'undefined' && global.setInterval) {
  setInterval(cleanupRateLimitStore, CLEANUP_INTERVAL);
}

export default {
  getClientId,
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  RATE_LIMITS
};
