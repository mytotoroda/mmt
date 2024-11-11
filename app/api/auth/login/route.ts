import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 환경 변수 타입 정의
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_USERNAME: string;
      ADMIN_PASSWORD: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// 타입 정의
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: {
    username: string;
  };
  error?: string;
}

interface LogoutResponse {
  success: boolean;
  error?: string;
}

interface AuthCheckResponse {
  user: {
    username: string;
  } | null;
  error?: string;
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse | LogoutResponse>> {
  const path = request.nextUrl.pathname
  
  if (path.endsWith('/login')) {
    try {
      const { username, password }: LoginRequest = await request.json()
    
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // 세션 쿠키 설정
        cookies().set('auth', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 24시간 1month
        })
        
        return NextResponse.json({
          success: true,
          user: { username }
        })
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: '아이디 또는 비밀번호가 잘못되었습니다.' 
        },
        { status: 401 }
      )
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: '잘못된 요청 형식입니다.' 
        },
        { status: 400 }
      )
    }
  }
  
  if (path.endsWith('/logout')) {
    cookies().delete('auth')
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json(
    { 
      success: false,
      error: '잘못된 요청입니다.' 
    },
    { status: 400 }
  )
}

export async function GET(request: NextRequest): Promise<NextResponse<AuthCheckResponse>> {
  const path = request.nextUrl.pathname
  
  if (path.endsWith('/check')) {
    const authCookie = cookies().get('auth')
    
    if (authCookie?.value === 'authenticated') {
      return NextResponse.json({
        user: { username: ADMIN_USERNAME }
      })
    }
    
    return NextResponse.json({ user: null })
  }
  
  return NextResponse.json(
    { 
      user: null,
      error: '잘못된 요청입니다.' 
    },
    { status: 400 }
  )
}