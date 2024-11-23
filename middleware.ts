// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// 분석에서 제외할 경로
const EXCLUDED_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/static/',
  '/images/',
  '/assets/',
  '/robots.txt',
  '/manifest.json'
];

// 봇 패턴 (더 포괄적인 목록)
const BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'ping',
  'slurp',
  'lighthouse',
  'pagespeed',
  'googlebot',
  'baiduspider',
  'yandex',
  'bingbot',
  'facebookexternalhit',
  'ahrefsbot',
  'semrushbot',
  'voltron',
  'scoutjet',
  'seznambot',
  'proximic',
  'exabot'
];

// 의심스러운 접근 패턴
const SUSPICIOUS_PATTERNS = [
  // 비정상적인 Referer
  (req: NextRequest) => {
    const referer = req.headers.get('referer');
    if (!referer) return false;
    const currentHost = req.headers.get('host');
    return !referer.includes(currentHost || '');
  },
  // 비정상적인 User-Agent
  (req: NextRequest) => {
    const ua = req.headers.get('user-agent')?.toLowerCase() || '';
    return ua.length < 20 || ua.includes('curl') || ua.includes('postman');
  },
  // 빠른 연속 요청
  (req: NextRequest) => {
    // 여기에 rate limiting 로직을 추가할 수 있습니다
    return false;
  }
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

function isSuspiciousRequest(req: NextRequest): boolean {
  return SUSPICIOUS_PATTERNS.some(check => check(req));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. 제외 경로 체크
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. User-Agent 체크
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 5 || isBot(userAgent)) {
    return NextResponse.next();
  }

  // 3. 의심스러운 요청 체크
  if (isSuspiciousRequest(request)) {
    return NextResponse.next();
  }

  // 4. 실제 브라우저 요청인지 확인 (Optional)
  const acceptHeader = request.headers.get('accept');
  if (!acceptHeader?.includes('text/html')) {
    return NextResponse.next();
  }

  try {
    const visitorIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const referer = request.headers.get('referer');

    // 5. 정상적인 페이지 로드만 기록
    if (request.method === 'GET' && request.headers.get('sec-fetch-mode') === 'navigate') {
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
          isDirectAccess: !referer,
          headers: {
            accept: acceptHeader,
            'sec-fetch-dest': request.headers.get('sec-fetch-dest'),
            'sec-fetch-mode': request.headers.get('sec-fetch-mode'),
            'sec-fetch-site': request.headers.get('sec-fetch-site'),
          }
        }),
      });
    }
  } catch (error) {
    console.error('Failed to record page visit:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};