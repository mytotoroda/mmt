import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 환경 변수 타입 정의
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_USERNAME: string;
    }
  }
}

// 응답 타입 정의
interface AuthCheckResponse {
  success: boolean;
  user: {
    username: string;
  } | null;
  error?: string;
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME

/**
 * 인증 상태를 확인하는 API 핸들러
 * @returns {Promise<NextResponse<AuthCheckResponse>>} 인증 상태 및 사용자 정보
 */
export async function GET(): Promise<NextResponse<AuthCheckResponse>> {
  try {
    const authCookie = cookies().get('auth')
    
    return NextResponse.json({
      success: true,
      user: authCookie?.value === 'authenticated' 
        ? { username: ADMIN_USERNAME }
        : null
    })
  } catch (error) {
    console.error('Auth check error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { 
        success: false, 
        user: null,
        error: '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// 상수 값들을 분리하여 관리할 경우 추가
const AUTH_COOKIE_NAME = 'auth'
const AUTH_COOKIE_VALUE = 'authenticated'
const ERROR_MESSAGE = '서버 오류가 발생했습니다.'

// 유틸리티 함수로 분리할 경우 추가
function createErrorResponse(message: string, status: number = 500): NextResponse<AuthCheckResponse> {
  return NextResponse.json(
    { 
      success: false, 
      user: null,
      error: message 
    },
    { status }
  )
}

function createSuccessResponse(user: AuthCheckResponse['user']): NextResponse<AuthCheckResponse> {
  return NextResponse.json({
    success: true,
    user
  })
}

// 타입 가드로 분리할 경우 추가
function isAuthenticated(cookieValue: string | undefined): boolean {
  return cookieValue === AUTH_COOKIE_VALUE
}