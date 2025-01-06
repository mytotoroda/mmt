import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

// 상수 정의
const PROTECTED_PATHS = [
  '/meme-coins',
  '/airdrops',
  '/mmt',
  '/manage-wallet'
] as const;

// 분석에서 제외할 경로
const EXCLUDED_FROM_ANALYTICS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/static/',
  '/images/',
  '/assets/',
  '/robots.txt',
  '/manifest.json',
  '/public/'
];

// 봇 패턴
const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'ping', 'slurp',
  'lighthouse', 'pagespeed', 'googlebot'
];

// 타입 정의
type ProtectedPath = typeof PROTECTED_PATHS[number];
interface MiddlewareConfig {
  matcher: string[];
}

/**
 * 보호된 경로인지 확인하는 함수
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * 분석 제외 경로인지 확인하는 함수
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_FROM_ANALYTICS.some(path => pathname.startsWith(path));
}

/**
 * 페이지 방문 기록 함수
 */
async function recordPageVisit(request: NextRequest, pathname: string) {
  try {
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
    if (BOT_PATTERNS.some(pattern => userAgent.includes(pattern))) {
      return;
    }

    const visitorIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const referer = request.headers.get('referer') || '';

    await fetch(`${request.nextUrl.origin}/api/analytics/page-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pagePath: pathname,
        visitorIp,
        userAgent,
        referer,
      }),
    });
  } catch (error) {
    console.error('Failed to record page visit:', error);
  }
}

/**
 * JWT 토큰 검증 함수
 */
async function verifyAuth(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // 로그인/인증 관련 경로는 검증 제외
    const publicPaths = [
      '/login',
      '/api/auth/login',
      '/api/auth/verify-email',
      '/api/analytics/page-visit'
    ];

    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 세션 쿠키 확인
    const session = request.cookies.get('user-session');

    if (!session?.value) {
      // API 요청인 경우 401 응답
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // 일반 페이지 접근인 경우 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 토큰 검증
    const verified = await verifyAuth(session.value);

    if (!verified) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 페이지 방문 기록 (API 요청 제외)
    if (!pathname.startsWith('/api/') && !isExcludedPath(pathname)) {
      await recordPageVisit(request, pathname);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};