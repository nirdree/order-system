/**
 * Authentication Rate Limit Middleware
 * Prevents brute force attacks on login/signup endpoints
 */

import { NextResponse } from 'next/server';
import { getClientId, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit.js';

export function withRateLimit(config = RATE_LIMITS.auth) {
  return async (request) => {
    const clientId = getClientId(request);
    const rateLimitCheck = checkRateLimit(clientId, config);

    if (!rateLimitCheck.allowed) {
      return createRateLimitResponse(rateLimitCheck.remaining, rateLimitCheck.resetTime, rateLimitCheck.retryAfter);
    }

    // Call the actual route handler
    return null; // Middleware chain continues
  };
}

export default withRateLimit;
