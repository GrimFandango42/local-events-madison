// Next.js middleware for security and rate limiting (2025 best practices)
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, EnvironmentSchema } from './lib/validation';

// Rate limiting store (in production, use Redis or external service)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers for different route types
const getSecurityHeaders = (pathname: string) => {
  const headers = new Headers();
  
  // Base security headers
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (pathname.startsWith('/api/')) {
    // API-specific headers
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'no-store, max-age=0');
  } else if (pathname.startsWith('/_next/')) {
    // Static assets get longer cache
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return headers;
};

// Rate limiting function
const rateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  rateLimitStore.set(identifier, current);
  
  return { 
    allowed: true, 
    remaining: limit - current.count, 
    resetTime: current.resetTime 
  };
};

// Security checks
const performSecurityChecks = (request: NextRequest): NextResponse | null => {
  const { pathname } = request.nextUrl;
  
  // Block suspicious user agents
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /masscan/i,
    /nmap/i,
    /burpsuite/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // Block requests with suspicious query parameters
  const searchParams = request.nextUrl.searchParams;
  const suspiciousParams = ['union', 'select', 'drop', 'delete', 'insert', 'update'];
  
  for (const [key, value] of searchParams.entries()) {
    const combined = `${key}=${value}`.toLowerCase();
    if (suspiciousParams.some(param => combined.includes(param))) {
      return new NextResponse('Bad Request', { status: 400 });
    }
  }
  
  // Validate request size (prevent DoS)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return new NextResponse('Payload Too Large', { status: 413 });
  }
  
  return null;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Perform security checks
  const securityBlock = performSecurityChecks(request);
  if (securityBlock) {
    return securityBlock;
  }
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const limit = pathname.includes('health') ? 1000 : 100; // Health endpoint gets higher limit
    
    const rateLimitResult = rateLimit(identifier, limit);
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    
    return response;
  }
  
  // Add security headers
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders(pathname);
  
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};