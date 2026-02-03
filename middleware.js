import { NextResponse } from 'next/server';
import { getClientId, checkRateLimit, createRateLimitResponse, addRateLimitHeaders, RATE_LIMITS } from './lib/rate-limit.js';

// Simple token validation for edge runtime (no crypto verification)
function validateTokenFormat(token) {
  if (!token) return null;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (no verification needed at middleware level)
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get client identifier for rate limiting
  const clientId = getClientId(request);

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Determine rate limit config based on endpoint
    let rateLimitConfig = RATE_LIMITS.api;
    
    if (pathname.includes('/auth/login')) {
      rateLimitConfig = RATE_LIMITS.login;
    } else if (pathname.includes('/auth/signup')) {
      rateLimitConfig = RATE_LIMITS.signup;
    } else if (pathname.includes('/auth/')) {
      rateLimitConfig = RATE_LIMITS.auth;
    } else if (request.method !== 'GET') {
      // POST/PUT/DELETE operations - use stricter write limits
      rateLimitConfig = RATE_LIMITS.write;
    } else {
      // GET operations - use read limits
      rateLimitConfig = RATE_LIMITS.read;
    }

    const rateLimitCheck = checkRateLimit(clientId, rateLimitConfig);
    
    if (!rateLimitCheck.allowed) {
      return createRateLimitResponse(rateLimitCheck.remaining, rateLimitCheck.resetTime, rateLimitCheck.retryAfter);
    }
  }

  // Public routes (no auth required)
  const publicRoutes = ['/menu'];

  // Protected routes by role
  const ownerRoutes = ['/owner'];
  const managerRoutes = ['/manager'];
  const staffRoutes = ['/staff'];
  const protectedRoutes = [...ownerRoutes, ...managerRoutes, ...staffRoutes];
  const authRoutes = ['/login', '/signup'];

  const token = request.cookies.get('authToken')?.value;

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    // Add cache headers for static content
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return response;
  }

  // If route is protected ensure token is present and valid
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = validateTokenFormat(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('authToken');
      response.cookies.delete('token');
      return response;
    }

    if (!payload.role) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('authToken');
      response.cookies.delete('token');
      return response;
    }

    // Role-based route guarding
    if (pathname.startsWith('/owner')) {
      // Only owners allowed on /owner routes
      if (payload.role !== 'owner') {
        // Redirect to respective dashboard
        if (payload.role === 'manager') {
          return NextResponse.redirect(new URL('/orders', request.url));
        }
        if (payload.role === 'staff') {
          return NextResponse.redirect(new URL('/orders', request.url));
        }
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        response.cookies.delete('token');
        return response;
      }
    }

    if (pathname.startsWith('/manager')) {
      // Only managers and owners allowed on /manager routes
      if (payload.role !== 'manager' && payload.role !== 'owner') {
        // Redirect to respective dashboard
        if (payload.role === 'staff') {
          return NextResponse.redirect(new URL('/orders', request.url));
        }
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        response.cookies.delete('token');
        return response;
      }
    }

    if (pathname.startsWith('/staff')) {
      // Only staff, managers and owners allowed on /staff routes
      if (payload.role !== 'staff' && payload.role !== 'manager' && payload.role !== 'owner') {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('authToken');
        response.cookies.delete('token');
        return response;
      }
    }
  }

  // Redirect to appropriate dashboard if already logged in and visiting auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      const payload = validateTokenFormat(token);
      if (payload) {
        if (payload.role === 'owner') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (payload.role === 'manager') {
          return NextResponse.redirect(new URL('/orders', request.url));
        }
        if (payload.role === 'staff') {
          return NextResponse.redirect(new URL('/orders', request.url));
        }
      }
    }
  }

  const response = NextResponse.next();
  
  // Add security and performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache static assets
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
