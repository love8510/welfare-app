'use server'
import { createClient } from '@/lib/supabase/server'

export async function getCaseList(filters: {
  name?: string
  receivedStart?: string
  receivedEnd?: string
  isClosed?: string
  workerId?: string
  page?: number
  pageSize?: number
}) {
  const supabase = await createClient()
  const { page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('cases')
    .select(`
      id, case_no, received_at, receive_method, referrer_name,
      referrer_phone, referral_route, is_closed, closed_at, close_reason,
      clients!inner(id, name, birth_date, phone_mobile, gender),
      worker:users!cases_worker_id_fkey(id, name)
    `, { count: 'exact' })
    .order('received_at', { ascending: false })
    .range(from, to)

  if (filters.name) {
    query = query.ilike('clients.name', `%${filters.name}%`)
  }
  if (filters.receivedStart) {
    query = query.gte('received_at', filters.receivedStart)
  }
  if (filters.receivedEnd) {
    query = query.lte('received_at', filters.receivedEnd)
  }
  if (filters.isClosed === 'true') {
    query = query.eq('is_closed', true)
  } else if (filters.isClosed === 'false') {
    query = query.eq('is_closed', false)
  }
  if (filters.workerId && filters.workerId !== '전체') {
    query = query.eq('worker_id', filters.workerId)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], count: count ?? 0 }
}

export async function getCaseById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      clients(id, name, birth_date, phone_home, phone_mobile, gender, address, id_number),
      worker:users!cases_worker_id_fkey(id, name)
    `)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCase(data: {
  client_id: string
  worker_id?: string
  received_at?: string
  receive_method?: string
  referrer_name?: string
  referrer_relation?: string
  referrer_phone?: string
  referral_route?: string
}) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const { data: result, error } = await supabase
    .from('cases')
    .insert({ ...data, org_id: userData.org_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return result
}

export async function updateCase(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cases').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function closeCase(id: string, reason: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .update({
      is_closed: true,
      closed_at: new Date().toISOString().split('T')[0],
      close_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getInitialInterviewByCase(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('initial_interviews')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertInitialInterviewForCase(caseId: string, clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const existing = await getInitialInterviewByCase(caseId)
  if (existing) {
    const { error } = await supabase
      .from('initial_interviews')
      .update({ ...formData, case_id: caseId })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('initial_interviews')
      .insert({ ...formData, case_id: caseId, client_id: clientId, org_id: userData.org_id })
    if (error) throw new Error(error.message)
  }
}

export async function getAssessment(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertAssessment(caseId: string, clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const existing = await getAssessment(caseId)
  if (existing) {
    const { error } = await supabase
      .from('assessments')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('assessments')
      .insert({ ...formData, case_id: caseId, client_id: clientId, org_id: userData.org_id })
    if (error) throw new Error(error.message)
  }
}

export async function getServicePlan(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_plans')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertServicePlan(caseId: string, clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const existing = await getServicePlan(caseId)
  if (existing) {
    const { error } = await supabase
      .from('service_plans')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('service_plans')
      .insert({ ...formData, case_id: caseId, client_id: clientId, org_id: userData.org_id })
    if (error) throw new Error(error.message)
  }
}

export async function getMonitoringLogs(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monitoring_logs')
    .select('*, worker:users!monitoring_logs_worker_id_fkey(id, name)')
    .eq('case_id', caseId)
    .order('monitored_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addMonitoringLog(caseId: string, clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const { error } = await supabase
    .from('monitoring_logs')
    .insert({ ...formData, case_id: caseId, client_id: clientId, org_id: userData.org_id, worker_id: user.user.id })
  if (error) throw new Error(error.message)
}

export async function updateMonitoringLog(id: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('monitoring_logs')
    .update(formData)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMonitoringLog(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('monitoring_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getCaseEvaluation(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('case_evaluations')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertCaseEvaluation(caseId: string, clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다')

  const existing = await getCaseEvaluation(caseId)
  if (existing) {
    const { error } = await supabase
      .from('case_evaluations')
      .update(formData)
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('case_evaluations')
      .insert({ ...formData, case_id: caseId, client_id: clientId, org_id: userData.org_id, worker_id: user.user.id })
    if (error) throw new Error(error.message)
  }
}

export async function getBlankFormData() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.user.id)
    .single()
  if (!userData) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('name, stamp_url, approval_slots, approver1, approver2, approver3')
    .eq('id', userData.org_id)
    .maybeSingle()
  return org
}
