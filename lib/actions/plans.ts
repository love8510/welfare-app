'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('User not found')
  return { supabase, orgId: data.org_id as string, userId: user.id }
}

// ────────────────────────────────────────────
// 담당자별 연간 일정 조회
// ────────────────────────────────────────────
export async function getWorkerScheduleMatrix(year: number) {
  const { supabase, orgId } = await getCtx()

  const { data: workers } = await supabase
    .from('users')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name')

  const { data: schedules } = await supabase
    .from('worker_schedules')
    .select('*')
    .eq('org_id', orgId)
    .eq('year', year)

  return (workers ?? []).map((w) => {
    const months: Record<number, { plan_count: number; memo: string }> = {}
    for (let m = 1; m <= 12; m++) {
      const s = schedules?.find((s) => s.worker_id === w.id && s.month === m)
      months[m] = { plan_count: s?.plan_count ?? 0, memo: s?.memo ?? '' }
    }
    return { worker: w, months }
  })
}

// 메모 저장
export async function upsertWorkerMemo(workerId: string, year: number, month: number, memo: string) {
  const { supabase, orgId } = await getCtx()
  const { error } = await supabase.from('worker_schedules').upsert(
    { org_id: orgId, worker_id: workerId, year, month, memo },
    { onConflict: 'org_id,worker_id,year,month' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/plans')
}

// ────────────────────────────────────────────
// 월별 계획 매트릭스
// ────────────────────────────────────────────
export async function getMonthlyPlanMatrix(year: number, search?: string) {
  const { supabase, orgId } = await getCtx()

  let q = supabase
    .from('clients')
    .select('id, name, gender, birth_date')
    .eq('org_id', orgId)
    .eq('status', '이용')
    .order('name')

  if (search) q = q.ilike('name', `%${search}%`)
  const { data: clients } = await q

  const { data: plans } = await supabase
    .from('monthly_plans')
    .select('client_id, month, planned_count, actual_count')
    .eq('org_id', orgId)
    .eq('year', year)

  return (clients ?? []).map((c) => {
    const months: Record<number, { planned: number; actual: number }> = {}
    for (let m = 1; m <= 12; m++) {
      const p = plans?.find((p) => p.client_id === c.id && p.month === m)
      months[m] = { planned: p?.planned_count ?? 0, actual: p?.actual_count ?? 0 }
    }
    return { client: c, months }
  })
}

// 계획 횟수 저장
export async function upsertMonthlyPlan(clientId: string, year: number, month: number, plannedCount: number) {
  const { supabase, orgId, userId } = await getCtx()

  const { data: client } = await supabase
    .from('clients').select('worker_id').eq('id', clientId).single()
  const workerId = client?.worker_id ?? userId

  const { error } = await supabase.from('monthly_plans').upsert(
    { org_id: orgId, client_id: clientId, worker_id: workerId, year, month, planned_count: plannedCount },
    { onConflict: 'org_id,client_id,year,month' }
  )
  if (error) throw new Error(error.message)

  // worker_schedules 없으면 생성
  await supabase.from('worker_schedules').upsert(
    { org_id: orgId, worker_id: workerId, year, month, plan_count: 0 },
    { onConflict: 'org_id,worker_id,year,month' }
  )
  revalidatePath('/plans/monthly')
}

// ────────────────────────────────────────────
// 달력용 일별 계획
// ────────────────────────────────────────────
export async function getDailyPlans(clientId: string, year: number, month: number) {
  const { supabase } = await getCtx()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: plans }, { data: logs }, { data: holidays }] = await Promise.all([
    supabase.from('daily_plans').select('*').eq('client_id', clientId)
      .gte('plan_date', startDate).lte('plan_date', endDate),
    supabase.from('contact_logs').select('*').eq('client_id', clientId)
      .gte('contacted_at', startDate).lte('contacted_at', endDate + 'T23:59:59'),
    supabase.from('public_holidays').select('*')
      .gte('date', startDate).lte('date', endDate),
  ])

  return { plans: plans ?? [], logs: logs ?? [], holidays: holidays ?? [] }
}

// 주간계획 → 달력 자동배치
export async function importWeeklyPlanToCalendar(clientId: string, year: number, month: number) {
  const { supabase, orgId, userId } = await getCtx()

  const { data: weeklyPlans } = await supabase
    .from('weekly_service_plans')
    .select('*')
    .eq('client_id', clientId)

  if (!weeklyPlans?.length) return 0

  const DAY_MAP: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }
  const daysInMonth = new Date(year, month, 0).getDate()
  const rows: Record<string, unknown>[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dayOfWeek = date.getDay()
    const weeklyForDay = weeklyPlans.filter((p) => DAY_MAP[p.day_of_week] === dayOfWeek)
    for (const p of weeklyForDay) {
      rows.push({
        org_id: orgId,
        client_id: clientId,
        worker_id: userId,
        plan_date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        service_type: p.service_name,
        resource: p.resource,
        provider: p.provider,
        planned_start: p.start_time,
        planned_end: p.end_time,
        note: p.note,
      })
    }
  }

  if (rows.length) {
    await supabase.from('daily_plans').upsert(rows as Parameters<typeof supabase.from>[0] extends never ? never : never, { onConflict: 'org_id,client_id,plan_date,service_type', ignoreDuplicates: true })
    await supabase.from('daily_plans').upsert(rows as never, { onConflict: 'org_id,client_id,plan_date,service_type', ignoreDuplicates: true })
  }
  return rows.length
}

// 일별 계획 저장
export async function upsertDailyPlan(data: {
  clientId: string; planDate: string; serviceType: string
  resource?: string; provider?: string
  plannedStart?: string; plannedEnd?: string; note?: string
}) {
  const { supabase, orgId, userId } = await getCtx()

  const { data: client } = await supabase.from('clients').select('worker_id').eq('id', data.clientId).single()
  const workerId = client?.worker_id ?? userId

  const { error } = await supabase.from('daily_plans').upsert({
    org_id: orgId, client_id: data.clientId, worker_id: workerId,
    plan_date: data.planDate, service_type: data.serviceType,
    resource: data.resource, provider: data.provider,
    planned_start: data.plannedStart, planned_end: data.plannedEnd,
    note: data.note,
  }, { onConflict: 'org_id,client_id,plan_date,service_type' })
  if (error) throw new Error(error.message)
}

// ────────────────────────────────────────────
// 업무일지 (contact_logs)
// ────────────────────────────────────────────
export async function saveWorkLog(data: {
  clientId: string; serviceType: string; method: string
  content: string; durationMinutes?: number
  planDate: string; startTime?: string; endTime?: string
  dailyPlanId?: string
}) {
  const { supabase, orgId, userId } = await getCtx()

  const contactedAt = new Date(`${data.planDate}T${new Date().toTimeString().slice(0, 8)}`).toISOString()

  const { error } = await supabase.from('contact_logs').insert({
    org_id: orgId,
    client_id: data.clientId,
    worker_id: userId,
    service_type: data.serviceType,
    method: data.method,
    content: data.content,
    duration_minutes: data.durationMinutes ?? null,
    plan_date: data.planDate,
    start_time: data.startTime ?? null,
    end_time: data.endTime ?? null,
    contacted_at: contactedAt,
    daily_plan_id: data.dailyPlanId ?? null,
  })
  if (error) throw new Error(error.message)

  if (data.dailyPlanId) {
    await supabase.from('daily_plans').update({ is_completed: true }).eq('id', data.dailyPlanId)
  }

  if (process.env.NODE_ENV === 'development') {
    const { data: check } = await supabase
      .from('clients_with_contact_status')
      .select('name, last_contact_at, contact_status')
      .eq('id', data.clientId)
      .single()
    console.log('[미접촉감지 연동확인]', check)
  }

  revalidatePath('/plans')
  revalidatePath('/plans/performance')
}

export async function updateWorkLog(id: string, data: {
  serviceType?: string; method?: string; content?: string
  durationMinutes?: number; startTime?: string; endTime?: string
}) {
  const { supabase } = await getCtx()
  const { error } = await supabase.from('contact_logs').update({
    service_type: data.serviceType,
    method: data.method,
    content: data.content,
    duration_minutes: data.durationMinutes,
    start_time: data.startTime,
    end_time: data.endTime,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/plans/performance')
}

export async function deleteWorkLog(id: string) {
  const { supabase } = await getCtx()
  const { error } = await supabase.from('contact_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/plans/performance')
}

// ────────────────────────────────────────────
// 실적 현황
// ────────────────────────────────────────────
export async function getPerformanceSummary(year: number, month: number, workerId?: string) {
  const { supabase, orgId } = await getCtx()

  let q = supabase
    .from('monthly_plans')
    .select(`*, clients(id, name, gender, birth_date)`)
    .eq('org_id', orgId)
    .eq('year', year)
    .eq('month', month)

  if (workerId && workerId !== '전체') q = q.eq('worker_id', workerId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWorkLogsByClientMonth(clientId: string, year: number, month: number) {
  const { supabase } = await getCtx()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('contact_logs')
    .select('*, users!contact_logs_worker_id_fkey(name)')
    .eq('client_id', clientId)
    .gte('contacted_at', start)
    .lte('contacted_at', end + 'T23:59:59')
    .order('contacted_at')

  if (error) throw new Error(error.message)
  return data ?? []
}
