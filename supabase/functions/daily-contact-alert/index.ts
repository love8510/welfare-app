// Edge Function: daily-contact-alert
// 스케줄: 0 0 * * * (UTC 00:00 = KST 09:00)
// 배포: npx supabase functions deploy daily-contact-alert --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface ClientRow {
  id: string; org_id: string; name: string
  worker_id: string; worker_name: string; worker_phone: string
  days_no_contact: number; contact_status: string
}

interface AlertSetting {
  org_id: string
  kakao_sender_key?: string
  kakao_template_code_warning?: string
  kakao_template_code_danger?: string
  is_active: boolean
}

async function sendKakaoAlimtalk(params: {
  senderKey: string; templateCode: string
  receiverPhone: string; message: string
}) {
  const res = await fetch(
    `https://api-alimtalk.kakao.com/alimtalk/v2/senders/${params.senderKey}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `KakaoAK ${Deno.env.get('KAKAO_ADMIN_KEY')}`,
      },
      body: JSON.stringify({
        senderKey: params.senderKey,
        templateCode: params.templateCode,
        messages: [{
          to: params.receiverPhone,
          content: params.message,
          buttons: [{
            buttonType: 'WL',
            buttonName: '대시보드 확인',
            linkMo: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/monitoring`,
            linkPc: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/monitoring`,
          }],
        }],
      }),
    }
  )
  const data = await res.json()
  return {
    success: data.resultCode === 'MRC-000',
    messageId: data.messages?.[0]?.messageId ?? null,
    error: data.resultCode !== 'MRC-000' ? (data.message ?? '발송 실패') : null,
  }
}

async function sendEmailAlert(params: {
  to: string; clientName: string; days: string
  status: string; workerName: string
}) {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''
  const statusLabel = params.status === 'danger' ? '위험' : '주의'
  const color = params.status === 'danger' ? '#dc2626' : '#d97706'
  const icon = params.status === 'danger' ? '🔴' : '🟡'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@welfare-cms.kr',
      to: [params.to],
      subject: `[${statusLabel}] ${params.clientName} 어르신 ${params.days}째 미접촉`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px">
          <h2 style="color:${color}">${icon} ${statusLabel} 미접촉 알림</h2>
          <p><strong>${params.clientName}</strong> 어르신이 <strong>${params.days}</strong>째 미접촉 상태입니다.</p>
          <p>담당자: ${params.workerName}</p>
          <a href="${appUrl}/monitoring"
             style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px">
            대시보드에서 확인하기
          </a>
        </div>
      `,
    }),
  })
  return res.ok
}

Deno.serve(async () => {
  try {
    const { data: settings } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('is_active', true)

    const results: Record<string, unknown>[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const setting of (settings ?? []) as AlertSetting[]) {
      const { data: clients } = await supabase
        .from('clients_with_contact_status')
        .select('*')
        .eq('org_id', setting.org_id)
        .in('contact_status', ['warning', 'danger', 'never'])

      for (const client of (clients ?? []) as ClientRow[]) {
        // 오늘 이미 발송한 경우 스킵
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('client_id', client.id)
          .eq('org_id', setting.org_id)
          .eq('send_type', 'auto')
          .gte('created_at', `${today}T00:00:00`)
          .maybeSingle()

        if (existing) continue

        const days = client.days_no_contact >= 9999 ? '기록없음' : `${client.days_no_contact}일`
        const isDanger = client.contact_status === 'danger' || client.contact_status === 'never'
        const templateCode = isDanger ? setting.kakao_template_code_danger : setting.kakao_template_code_warning
        const message = isDanger
          ? `[위험] ${client.name} 어르신 ${days}째 미접촉입니다.\n빠른 확인이 필요합니다.\n담당자: ${client.worker_name}`
          : `[주의] ${client.name} 어르신 ${days}째 미접촉입니다.\n확인 바랍니다.\n담당자: ${client.worker_name}`

        let isSuccess = false
        let kakaoMsgId: string | null = null
        let errorMsg: string | null = null

        if (setting.kakao_sender_key && templateCode && client.worker_phone) {
          try {
            const result = await sendKakaoAlimtalk({
              senderKey: setting.kakao_sender_key,
              templateCode,
              receiverPhone: client.worker_phone,
              message,
            })
            isSuccess = result.success
            kakaoMsgId = result.messageId
            errorMsg = result.error
          } catch (e) {
            errorMsg = (e as Error).message
          }
        } else if (Deno.env.get('RESEND_API_KEY') && client.worker_phone) {
          // 카카오 미설정 시 이메일 대체 (worker_phone을 이메일로 재활용하거나 별도 이메일 필드 필요)
          isSuccess = await sendEmailAlert({
            to: client.worker_phone,
            clientName: client.name,
            days,
            status: client.contact_status,
            workerName: client.worker_name,
          })
        }

        await supabase.from('alerts').insert({
          org_id: setting.org_id,
          client_id: client.id,
          worker_id: client.worker_id,
          days_no_contact: client.days_no_contact >= 9999 ? null : client.days_no_contact,
          send_type: 'auto',
          is_success: isSuccess,
          kakao_msg_id: kakaoMsgId,
          error_msg: errorMsg,
        })

        results.push({ client: client.name, status: client.contact_status, days, isSuccess })
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
