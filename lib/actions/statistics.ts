'use server'
import { createClient } from '@/lib/supabase/server'

export async function getMonthlyStats(year: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_service_stats')
    .select('year,month,service_type,total_count')
    .eq('year', year)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { month: number; service_type: string; total_count: number }[]
  const serviceTypes = Array.from(new Set(rows.map((r) => r.service_type).filter(Boolean)))

  const monthlyData: Record<number, Record<string, number>> = {}
  for (let m = 1; m <= 12; m++) monthlyData[m] = {}
  for (const row of rows) {
    if (!monthlyData[row.month]) monthlyData[row.month] = {}
    monthlyData[row.month][row.service_type] = (monthlyData[row.month][row.service_type] ?? 0) + row.total_count
  }

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const entry: Record<string, unknown> = { month: m }
    for (const st of serviceTypes) entry[st] = monthlyData[m][st] ?? 0
    return entry
  })

  const crosstab = serviceTypes.map((st) => {
    const row: Record<string, unknown> = { service_type: st }
    let total = 0
    for (let m = 1; m <= 12; m++) {
      const val = monthlyData[m][st] ?? 0
      row[`m${m}`] = val
      total += val
    }
    row.total = total
    return row
  })

  const pieData = serviceTypes.map((st) => ({
    name: st,
    value: rows.filter((r) => r.service_type === st).reduce((s, r) => s + r.total_count, 0),
  }))

  return { serviceTypes, chartData, crosstab, pieData }
}

export async function getStatsSummary(year: number) {
  const supabase = await createClient()

  const [servicesRes, clientsRes, dangerRes] = await Promise.all([
    supabase.from('monthly_service_stats').select('total_count').eq('year', year),
    supabase.from('monthly_service_stats').select('client_id').eq('year', year),
    supabase.from('clients_with_contact_status').select('id').eq('contact_status', 'danger'),
  ])

  const totalServices = (servicesRes.data ?? []).reduce((s: number, r: { total_count: number }) => s + (r.total_count ?? 0), 0)
  const totalClients = new Set((clientsRes.data ?? []).map((r: { client_id: string }) => r.client_id)).size
  const dangerClients = dangerRes.data?.length ?? 0

  return { totalServices, totalClients, avgAchievementRate: 0, dangerClients }
}

export async function getServiceStats(year: number, serviceType?: string, month?: number) {
  const supabase = await createClient()
  let query = supabase
    .from('monthly_service_stats')
    .select('month,service_type,worker_id,total_count')
    .eq('year', year)
  if (serviceType && serviceType !== '전체') query = query.eq('service_type', serviceType)
  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { month: number; service_type: string; worker_id: string; total_count: number }[]
  const serviceTypes = Array.from(new Set(rows.map((r) => r.service_type).filter(Boolean)))
  const workerIds = Array.from(new Set(rows.map((r) => r.worker_id).filter(Boolean)))

  const { data: workerData } = await supabase.from('users').select('id,name').in('id', workerIds)
  const workerMap = Object.fromEntries((workerData ?? []).map((w: { id: string; name: string }) => [w.id, w.name]))

  const crosstab = workerIds.map((wid) => {
    const row: Record<string, unknown> = { worker_id: wid, worker_name: workerMap[wid] ?? wid }
    let total = 0
    for (const st of serviceTypes) {
      const val = rows.filter((r) => r.worker_id === wid && r.service_type === st).reduce((s, r) => s + r.total_count, 0)
      row[st] = val
      total += val
    }
    row.total = total
    return row
  })

  const barData = Object.entries(
    rows.reduce((acc: Record<string, number>, r) => {
      const name = workerMap[r.worker_id] ?? r.worker_id
      acc[name] = (acc[name] ?? 0) + r.total_count
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return { serviceTypes, workerIds, crosstab, barData }
}

export async function getWorkerStats(year: number, workerId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('worker_monthly_stats')
    .select('*')
    .eq('year', year)
  if (workerId && workerId !== '전체') query = query.eq('worker_id', workerId)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { worker_id: string; worker_name: string; month: number; service_count: number; client_count: number; total_minutes: number }[]
  const workers = Array.from(new Map(rows.map((r) => [r.worker_id, { id: r.worker_id, name: r.worker_name }])).values())

  const crosstab = workers.map((w) => {
    const row: Record<string, unknown> = { worker_id: w.id, worker_name: w.name }
    let total = 0
    let clients = 0
    for (let m = 1; m <= 12; m++) {
      const found = rows.find((r) => r.worker_id === w.id && r.month === m)
      row[`m${m}`] = found?.service_count ?? 0
      total += found?.service_count ?? 0
      clients = Math.max(clients, found?.client_count ?? 0)
    }
    row.total = total
    row.clients = clients
    return row
  })

  const lineData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const entry: Record<string, unknown> = { month: m }
    for (const w of workers) {
      const found = rows.find((r) => r.worker_id === w.id && r.month === m)
      entry[w.name] = found?.service_count ?? 0
    }
    return entry
  })

  return { workers, crosstab, lineData }
}

export async function getWorkerWorklog(year: number, month: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('worker_monthly_stats')
    .select('*')
    .eq('year', year)
    .eq('month', month)
  if (error) throw new Error(error.message)

  return (data ?? []) as {
    worker_id: string; worker_name: string; client_count: number
    service_count: number; total_minutes: number
  }[]
}
