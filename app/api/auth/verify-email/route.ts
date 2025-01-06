import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || []
    
    const isAuthorized = allowedEmails.includes(email)
    
    return NextResponse.json({ isAuthorized })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
  }
}