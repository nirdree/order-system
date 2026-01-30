import { NextResponse } from 'next/server';

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
    return NextResponse.next();
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
          return NextResponse.redirect(new URL('/manager/dashboard', request.url));
        }
        if (payload.role === 'staff') {
          return NextResponse.redirect(new URL('/staff/dashboard', request.url));
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
          return NextResponse.redirect(new URL('/staff/dashboard', request.url));
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
          return NextResponse.redirect(new URL('/owner/dashboard', request.url));
        }
        if (payload.role === 'manager') {
          return NextResponse.redirect(new URL('/manager/dashboard', request.url));
        }
        if (payload.role === 'staff') {
          return NextResponse.redirect(new URL('/staff/dashboard', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
