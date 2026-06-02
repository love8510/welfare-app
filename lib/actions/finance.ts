'use server'
import { createClient } from '@/lib/supabase/server'

async function getMyOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('사용자 정보 없음')
  return data.org_id as string
}

export async function getBudgetSummary(year: number, type?: 'income' | 'expense') {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  let query = supabase
    .from('budget_execution_summary')
    .select('*')
    .eq('org_id', orgId)
    .eq('year', year)
    .order('sort_order')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFinanceSummaryCards(year: number) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  const { data, error } = await supabase
    .from('budget_execution_summary')
    .select('budget_amount,executed_amount')
    .eq('org_id', orgId)
    .eq('year', year)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { budget_amount: number; executed_amount: number }[]
  const totalBudget = rows.reduce((s, r) => s + (r.budget_amount ?? 0), 0)
  const totalExecuted = rows.reduce((s, r) => s + (r.executed_amount ?? 0), 0)
  const remaining = totalBudget - totalExecuted
  const executionRate = totalBudget > 0 ? Math.round((totalExecuted / totalBudget) * 1000) / 10 : 0

  return { totalBudget, totalExecuted, remaining, executionRate }
}

export async function getBudgetItems(year: number, type?: 'income' | 'expense') {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  let query = supabase
    .from('budget_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('year', year)
    .order('sort_order')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createBudgetItem(input: {
  year: number; type: 'income' | 'expense'
  category: string; sub_category?: string
  item_name: string; budget_amount: number; sort_order?: number
}) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase.from('budget_items').insert({ ...input, org_id: orgId })
  if (error) throw new Error(error.message)
}

export async function updateBudgetItem(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('budget_items')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteBudgetItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function copyBudgetFromPrevYear(fromYear: number, toYear: number) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  const { data: prev, error: fetchErr } = await supabase
    .from('budget_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('year', fromYear)
  if (fetchErr) throw new Error(fetchErr.message)
  if (!prev?.length) throw new Error('전년도 예산 항목이 없습니다')

  const inserts = prev.map(({ id: _id, created_at: _c, updated_at: _u, year: _y, ...rest }) => ({
    ...rest, year: toYear, org_id: orgId,
  }))
  const { error } = await supabase.from('budget_items').upsert(inserts)
  if (error) throw new Error(error.message)
}

export async function getExecutions(budgetItemId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_executions')
    .select('*')
    .eq('budget_item_id', budgetItemId)
    .order('executed_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addExecution(input: {
  budget_item_id: string; year: number; month: number
  executed_at: string; description?: string
  amount: number; receipt_no?: string; note?: string
}) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase.from('budget_executions').insert({ ...input, org_id: orgId })
  if (error) throw new Error(error.message)
}

export async function updateExecution(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_executions').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteExecution(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('budget_executions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
