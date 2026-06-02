'use server'
import { createClient } from '@/lib/supabase/server'

export async function getMidCategoryReport(year: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_quarterly_summary')
    .select('*')
    .eq('year', year)
    .order('sort_order')
    .order('item_no')
  if (error) throw new Error(error.message)

  const items = (data ?? []) as {
    id: string; category: string; item_no: number; item_name: string
    target_count: number; q1_count: number; q2_count: number
    q3_count: number; q4_count: number; total_count: number; achievement_rate: number
  }[]

  const categories: Record<string, {
    subTotal: { target: number; q1: number; q2: number; q3: number; q4: number; sum: number; rate: number }
    items: typeof items
  }> = {}

  for (const item of items) {
    if (!categories[item.category]) {
      categories[item.category] = { subTotal: { target: 0, q1: 0, q2: 0, q3: 0, q4: 0, sum: 0, rate: 0 }, items: [] }
    }
    const cat = categories[item.category]
    cat.items.push(item)
    cat.subTotal.target += item.target_count
    cat.subTotal.q1 += item.q1_count
    cat.subTotal.q2 += item.q2_count
    cat.subTotal.q3 += item.q3_count
    cat.subTotal.q4 += item.q4_count
    cat.subTotal.sum += item.total_count
  }

  for (const cat of Object.values(categories)) {
    cat.subTotal.rate = cat.subTotal.target > 0
      ? Math.round((cat.subTotal.sum / cat.subTotal.target) * 1000) / 10
      : 0
  }

  const totalTarget = items.reduce((s, i) => s + i.target_count, 0)
  const totalQ1 = items.reduce((s, i) => s + i.q1_count, 0)
  const totalQ2 = items.reduce((s, i) => s + i.q2_count, 0)
  const totalQ3 = items.reduce((s, i) => s + i.q3_count, 0)
  const totalQ4 = items.reduce((s, i) => s + i.q4_count, 0)
  const totalSum = items.reduce((s, i) => s + i.total_count, 0)
  const totalRate = totalTarget > 0 ? Math.round((totalSum / totalTarget) * 1000) / 10 : 0

  return { totalTarget, totalQ1, totalQ2, totalQ3, totalQ4, totalSum, totalRate, categories, items }
}

export async function updateTargetCount(categoryId: string, targetCount: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('report_categories')
    .update({ target_count: targetCount, updated_at: new Date().toISOString() })
    .eq('id', categoryId)
  if (error) throw new Error(error.message)
}

export async function getReportCategories(year: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_categories')
    .select('*')
    .eq('year', year)
    .order('sort_order')
    .order('item_no')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createReportCategory(data: {
  year: number; category: string; item_no: number; item_name: string
  target_count?: number; service_types?: string[]; sort_order?: number
}) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.user.id).single()
  if (!userData) throw new Error('사용자 정보 없음')
  const { error } = await supabase.from('report_categories').insert({ ...data, org_id: userData.org_id })
  if (error) throw new Error(error.message)
}

export async function updateReportCategory(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('report_categories')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteReportCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('report_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function copyFromPrevYear(fromYear: number, toYear: number) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.user.id).single()
  if (!userData) throw new Error('사용자 정보 없음')

  const { data: prevYear, error: fetchErr } = await supabase
    .from('report_categories')
    .select('*')
    .eq('org_id', userData.org_id)
    .eq('year', fromYear)
  if (fetchErr) throw new Error(fetchErr.message)
  if (!prevYear?.length) throw new Error('전년도 설정이 없습니다')

  const inserts = prevYear.map(({ id: _id, created_at: _c, updated_at: _u, year: _y, ...rest }) => ({
    ...rest, year: toYear, org_id: userData.org_id,
  }))
  const { error } = await supabase.from('report_categories').upsert(inserts, { onConflict: 'org_id,year,category,item_no' })
  if (error) throw new Error(error.message)
}

export async function seedDefaultCategories(year: number) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('인증이 필요합니다')
  const { data: userData } = await supabase.from('users').select('org_id').eq('id', user.user.id).single()
  if (!userData) throw new Error('사용자 정보 없음')

  const existing = await getReportCategories(year)
  if (existing.length > 0) return

  const orgId = userData.org_id
  const defaults = [
    { org_id: orgId, year, category: '위기관리체계구축', item_no: 1, item_name: '사각지대 노인보호 발굴체계 구축', target_count: 18, service_types: ['발굴'], sort_order: 1 },
    { org_id: orgId, year, category: '위기관리체계구축', item_no: 2, item_name: '사례관리', target_count: 92, service_types: ['사례관리'], sort_order: 2 },
    { org_id: orgId, year, category: '위기관리체계구축', item_no: 3, item_name: '노인상담 및 정보제공', target_count: 250, service_types: ['전화상담', '방문상담', '노인상담'], sort_order: 3 },
    { org_id: orgId, year, category: '위기관리체계구축', item_no: 4, item_name: '통합지원체계 구축', target_count: 7, service_types: ['연계'], sort_order: 4 },
    { org_id: orgId, year, category: '예방적사업', item_no: 5, item_name: '예방적 사업', target_count: 3590, service_types: ['예방적사업', '교육', '프로그램'], sort_order: 5 },
    { org_id: orgId, year, category: '욕구기반위기관리서비스제공', item_no: 6, item_name: '경제적 위기관리', target_count: 1282, service_types: ['경제지원'], sort_order: 6 },
    { org_id: orgId, year, category: '욕구기반위기관리서비스제공', item_no: 7, item_name: '사회적 위기 관리', target_count: 244, service_types: ['사회적지원'], sort_order: 7 },
    { org_id: orgId, year, category: '지역특화사업발굴', item_no: 8, item_name: '지역특화사업발굴', target_count: 1560, service_types: ['특화사업'], sort_order: 8 },
  ]
  const { error } = await supabase.from('report_categories').insert(defaults)
  if (error) throw new Error(error.message)
}

export async function getServiceSummary(year: number, month?: number, workerId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('monthly_service_stats')
    .select('year,month,service_type,total_count')
    .eq('year', year)

  if (month) query = query.eq('month', month)
  if (workerId && workerId !== '전체') query = query.eq('worker_id', workerId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
