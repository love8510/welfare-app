'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function setupOrganization(form: {
  name: string
  representative?: string
  phone?: string
  address?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const admin = await createAdminClient()

  // 기관 코드 자동 생성 (영문+숫자 6자리)
  const code = form.name
    .replace(/[^a-zA-Z0-9가-힣]/g, '')
    .slice(0, 3)
    .toUpperCase() + Date.now().toString().slice(-4)

  // 기관 생성
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: form.name,
      code,
      representative: form.representative || null,
      phone: form.phone || null,
      address: form.address || null,
    })
    .select()
    .single()

  if (orgError) throw new Error('기관 등록 실패: ' + orgError.message)

  // users 테이블에 현재 유저 등록 (관리자로)
  const { error: userError } = await admin
    .from('users')
    .insert({
      id: user.id,
      org_id: org.id,
      name: user.email?.split('@')[0] ?? '관리자',
      email: user.email,
      job_title: '관리자',
      is_active: true,
    })

  if (userError) throw new Error('사용자 등록 실패: ' + userError.message)
}

export async function checkUserSetup(): Promise<'ok' | 'setup_needed'> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'setup_needed'

  const admin = await createAdminClient()
  const { data } = await admin
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return data?.org_id ? 'ok' : 'setup_needed'
}
