import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 개발/운영 편의를 위한 자동 로그인 엔드포인트
// 서비스 롤로 세션 토큰을 생성해서 쿠키에 주입
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/organization'

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 관리자 계정으로 세션 생성
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'gimeunji424@gmail.com',
  })

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // magic link의 token_hash를 이용해 직접 리다이렉트
  const verifyUrl = new URL('/auth/v1/verify', process.env.NEXT_PUBLIC_SUPABASE_URL!)
  verifyUrl.searchParams.set('token', data.properties.hashed_token)
  verifyUrl.searchParams.set('type', 'magiclink')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  verifyUrl.searchParams.set('redirect_to', new URL(redirect, siteUrl).toString())

  return NextResponse.redirect(verifyUrl)
}
