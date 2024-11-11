import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse> {
  try {
    cookies().delete('auth')
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}