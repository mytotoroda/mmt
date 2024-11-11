import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 상수 정의
const PROTECTED_PATHS = [
  '/meme-coins',
  '/airdrops',
  '/users',
  '/admin'
] as const

// 타입 정의
type ProtectedPath = typeof PROTECTED_PATHS[number]

interface MiddlewareConfig {
  matcher: string[];
}

/**
 * 보호된 경로인지 확인하는 함수
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path))
}

/**
 * 미들웨어 핸들러
 */
export function middleware(request: NextRequest): NextResponse {
  // 현재 요청의 URL 정보 가져오기
  const { pathname } = request.nextUrl
  
  // 인증 쿠키 확인
  const authCookie = request.cookies.get('auth')
  
  // API 경로는 제외 (API 라우트는 별도의 인증 처리)
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // 로그인이 필요한 페이지 체크
  if (isProtectedPath(pathname)) {
    // 인증되지 않은 경우
    if (!authCookie?.value) {
      // 현재 접근하려던 URL을 'from' 쿼리 파라미터로 저장
      const url = new URL('/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  // 이미 로그인한 사용자가 로그인 페이지에 접근하는 경우
  if (pathname === '/login' && authCookie?.value) {
    // from 파라미터가 있으면 해당 페이지로, 없으면 홈으로 리다이렉트
    const from = request.nextUrl.searchParams.get('from')
    return NextResponse.redirect(new URL(from || '/', request.url))
  }

  return NextResponse.next()
}

/**
 * 미들웨어가 실행될 경로 설정
 */
export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}