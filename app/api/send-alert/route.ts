import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()
    if (!clientId) return Response.json({ error: 'clientId required' }, { status: 400 })

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!userData) return Response.json({ error: 'User not found' }, { status: 404 })

    const orgId = userData.org_id

    // 대상자 정보 조회
    const { data: client } = await supabase
      .from('clients_with_contact_status')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) return Response.json({ error: '대상자 없음' }, { status: 404 })

    const c = client as Record<string, unknown>
    const days = Number(c.days_no_contact) >= 9999 ? '기록없음' : `${c.days_no_contact}일`

    // 알림 설정 조회
    const { data: setting } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('org_id', orgId)
      .single()

    let isSuccess = false
    let errorMsg: string | null = null

    // 카카오 알림톡 발송 시도
    if (setting?.kakao_sender_key && setting?.kakao_template_code_danger) {
      try {
        const kakaoRes = await fetch(
          `https://api-alimtalk.kakao.com/alimtalk/v2/senders/${setting.kakao_sender_key}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
            },
            body: JSON.stringify({
              senderKey: setting.kakao_sender_key,
              templateCode: setting.kakao_template_code_danger,
              messages: [{
                to: c.worker_phone,
                content: `[수동알림] ${c.name} 어르신 ${days}째 미접촉입니다.\n담당자: ${c.worker_name}`,
              }],
            }),
          }
        )
        const kakaoData = await kakaoRes.json()
        isSuccess = kakaoData.resultCode === 'MRC-000'
        if (!isSuccess) errorMsg = kakaoData.message ?? '카카오 발송 실패'
      } catch (e) {
        errorMsg = (e as Error).message
      }
    } else {
      // 카카오 미설정 시 성공으로 처리 (이메일 대체는 Edge Function에서 처리)
      isSuccess = true
    }

    // 알림 이력 저장
    await supabase.from('alerts').insert({
      org_id: orgId,
      client_id: clientId,
      worker_id: c.worker_id,
      days_no_contact: Number(c.days_no_contact) >= 9999 ? null : c.days_no_contact,
      send_type: 'manual',
      is_success: isSuccess,
      error_msg: errorMsg,
    })

    return Response.json({ success: true, days, clientName: c.name, workerName: c.worker_name })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
