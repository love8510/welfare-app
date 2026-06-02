'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('사용자 정보 없음')
  return { supabase, orgId: data.org_id as string, userId: user.id }
}

export type ContactStatus = 'normal' | 'warning' | 'danger' | 'never'

export interface ContactStatusRow {
  id: string; org_id: string; name: string; gender: string
  phone_mobile: string; address: string; client_type: string
  living_alone: boolean; last_contact_at: string | null
  worker_id: string; worker_name: string; worker_phone: string
  days_no_contact: number; contact_status: ContactStatus; age: number
}

export async function getContactStatusSummary() {
  const { supabase, orgId } = await getCtx()
  const { data, error } = await supabase
    .from('clients_with_contact_status')
    .select('contact_status')
    .eq('org_id', orgId)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as { contact_status: string }[]
  return {
    total:   rows.length,
    normal:  rows.filter((r) => r.contact_status === 'normal').length,
    warning: rows.filter((r) => r.contact_status === 'warning').length,
    danger:  rows.filter((r) => r.contact_status === 'danger').length,
    never:   rows.filter((r) => r.contact_status === 'never').length,
  }
}

export async function getContactStatusList(filters?: {
  status?: ContactStatus | 'all'
  workerId?: string
  sortBy?: 'days_desc' | 'days_asc' | 'name'
}) {
  const { supabase, orgId } = await getCtx()
  let query = supabase
    .from('clients_with_contact_status')
    .select('*')
    .eq('org_id', orgId)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('contact_status', filters.status)
  }
  if (filters?.workerId && filters.workerId !== '전체') {
    query = query.eq('worker_id', filters.workerId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as ContactStatusRow[]
  if (filters?.sortBy === 'name') {
    rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  } else if (filters?.sortBy === 'days_asc') {
    rows.sort((a, b) => a.days_no_contact - b.days_no_contact)
  } else {
    rows.sort((a, b) => b.days_no_contact - a.days_no_contact)
  }
  return rows
}

export async function quickContactLog(data: {
  clientId: string; serviceType: string; content: string; contactedAt: string
}) {
  const { supabase, orgId, userId } = await getCtx()
  const { error } = await supabase.from('contact_logs').insert({
    org_id: orgId,
    client_id: data.clientId,
    worker_id: userId,
    service_type: data.serviceType,
    method: data.serviceType,
    content: data.content,
    contacted_at: data.contactedAt,
    plan_date: data.contactedAt.slice(0, 10),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/monitoring')
}

export async function getAlertHistory(filters?: {
  startDate?: string; endDate?: string
  clientName?: string; workerId?: string
  sendType?: 'auto' | 'manual'; isSuccess?: boolean
  page?: number; pageSize?: number
}) {
  const { supabase, orgId } = await getCtx()
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('alerts')
    .select('*, clients(name,phone_mobile), users!alerts_worker_id_fkey(name)', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters?.startDate) query = query.gte('created_at', filters.startDate)
  if (filters?.endDate)   query = query.lte('created_at', filters.endDate + 'T23:59:59')
  if (filters?.sendType)  query = query.eq('send_type', filters.sendType)
  if (filters?.isSuccess !== undefined) query = query.eq('is_success', filters.isSuccess)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { rows: data ?? [], total: count ?? 0 }
}

export async function resolveAlert(alertId: string) {
  const { supabase } = await getCtx()
  const { error } = await supabase
    .from('alerts')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', alertId)
  if (error) throw new Error(error.message)
}

export async function getAlertSettings() {
  const { supabase, orgId } = await getCtx()
  const { data } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()
  return data
}

export async function upsertAlertSettings(settings: {
  warning_threshold: number; danger_threshold: number
  alert_time: string; alert_days: string[]
  kakao_sender_key?: string; kakao_template_code_warning?: string
  kakao_template_code_danger?: string; is_active: boolean
}) {
  const { supabase, orgId } = await getCtx()
  const { error } = await supabase
    .from('alert_settings')
    .upsert({ ...settings, org_id: orgId }, { onConflict: 'org_id' })
  if (error) throw new Error(error.message)
}

export async function sendManualAlert(clientId: string) {
  const { supabase, orgId } = await getCtx()

  const { data: client } = await supabase
    .from('clients_with_contact_status')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!client) throw new Error('대상자 정보를 찾을 수 없습니다')

  const c = client as ContactStatusRow
  const days = c.days_no_contact >= 9999 ? '기록없음' : `${c.days_no_contact}일`
  const statusLabel = c.contact_status === 'danger' ? '위험' : c.contact_status === 'warning' ? '주의' : '접촉없음'

  await supabase.from('alerts').insert({
    org_id: orgId,
    client_id: clientId,
    worker_id: c.worker_id,
    days_no_contact: c.days_no_contact >= 9999 ? null : c.days_no_contact,
    send_type: 'manual',
    is_success: true,
    error_msg: null,
  })

  return { clientName: c.name, workerName: c.worker_name, days, statusLabel }
}

export async function getWorkersForMonitoring() {
  const { supabase, orgId } = await getCtx()
  const { data } = await supabase
    .from('users')
    .select('id,name')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name')
  return (data ?? []) as { id: string; name: string }[]
}
