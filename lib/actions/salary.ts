'use server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_ORG_RATES, OrgRates } from '@/lib/insurance-rates'

async function getMyOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('사용자 정보 없음')
  return data.org_id as string
}

export async function getOrgRates(): Promise<OrgRates> {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { data } = await supabase
    .from('organizations')
    .select('industrial_insurance_rate,employment_dev_rate,severance_rate')
    .eq('id', orgId)
    .single()
  if (!data) return DEFAULT_ORG_RATES
  return {
    industrialInsRate: (data as Record<string, number>).industrial_insurance_rate ?? DEFAULT_ORG_RATES.industrialInsRate,
    employmentDevRate: (data as Record<string, number>).employment_dev_rate ?? DEFAULT_ORG_RATES.employmentDevRate,
    severanceRate: (data as Record<string, number>).severance_rate ?? DEFAULT_ORG_RATES.severanceRate,
  }
}

export async function getSalaryList(year: number, month: number, deptId?: string) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  let query = supabase
    .from('salary_records')
    .select('*, users(id,name,job_title,department_id,departments(name))')
    .eq('org_id', orgId)
    .eq('year', year)
    .eq('month', month)
    .order('created_at')

  if (deptId && deptId !== '전체') query = query.eq('users.department_id', deptId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSalaryById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('salary_records')
    .select('*, users(id,name,job_title,email)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertSalary(input: {
  user_id: string; year: number; month: number
  base_salary: number; position_allowance: number
  meal_allowance: number; transport_allowance: number
  overtime_pay: number; holiday_pay: number
  bonus: number; other_pay: number; other_deduction: number
  work_days: number; paid_leave_days: number
  absent_days: number; overtime_hours: number; note?: string
}) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  const { error } = await supabase.from('salary_records').upsert(
    { ...input, org_id: orgId },
    { onConflict: 'org_id,user_id,year,month' }
  )
  if (error) throw new Error(error.message)
}

export async function confirmSalary(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('salary_records')
    .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function unconfirmSalary(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('salary_records')
    .update({ is_confirmed: false, confirmed_at: null })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getSalarySlipData(id: string) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const [slipRes, orgRes] = await Promise.all([
    supabase.from('salary_records').select('*, users(name,job_title)').eq('id', id).single(),
    supabase.from('organizations').select('name,stamp_url').eq('id', orgId).single(),
  ])
  if (slipRes.error) throw new Error(slipRes.error.message)
  return { slip: slipRes.data, org: orgRes.data }
}

export async function getInsuranceSummary(year: number, month: number) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { data, error } = await supabase
    .from('salary_records')
    .select('*, users(name,job_title)')
    .eq('org_id', orgId)
    .eq('year', year)
    .eq('month', month)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStaffForSalary() {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { data, error } = await supabase
    .from('users')
    .select('id,name,job_title,base_salary,departments(name)')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function bulkCreateSalary(year: number, month: number) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  const { data: staff, error: staffErr } = await supabase
    .from('users')
    .select('id,base_salary')
    .eq('org_id', orgId)
    .eq('is_active', true)
  if (staffErr) throw new Error(staffErr.message)

  const records = (staff ?? []).map((s: { id: string; base_salary?: number }) => ({
    org_id: orgId,
    user_id: s.id,
    year,
    month,
    base_salary: s.base_salary ?? 0,
    meal_allowance: 200000,
  }))

  const { error } = await supabase
    .from('salary_records')
    .upsert(records, { onConflict: 'org_id,user_id,year,month', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}
