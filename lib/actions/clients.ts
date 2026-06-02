'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getMyOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('User not found')
  return { orgId: data.org_id as string, userId: user.id }
}

export async function autoAssignWorker(orgId: string) {
  const supabase = await createClient()
  const { data: workers } = await supabase
    .from('users')
    .select('id, name, roles(name)')
    .eq('org_id', orgId)
    .eq('is_active', true)

  if (!workers?.length) return null

  const socialWorkers = workers.filter(
    (w) => ((w.roles as unknown as { name: string } | null))?.name === '사회복지사'
  )
  const pool = socialWorkers.length ? socialWorkers : workers

  const counts = await Promise.all(
    pool.map(async (w) => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', w.id)
        .eq('status', '이용')
      return { id: w.id, name: w.name, count: count ?? 0 }
    })
  )
  counts.sort((a, b) => a.count - b.count || a.name.localeCompare(b.name, 'ko'))
  return counts[0]?.id ?? null
}

export async function getClientList(filters: {
  name?: string
  contractStart?: string
  contractEnd?: string
  phone?: string
  address?: string
  clientType?: string
  workerId?: string
  status?: string
  livingAlone?: string
  page?: number
  pageSize?: number
} = {}) {
  const supabase = await createClient()
  const { orgId } = await getMyOrgId()
  const { page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('clients')
    .select(`*, users!clients_worker_id_fkey(id, name)`, { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.name) query = query.ilike('name', `%${filters.name}%`)
  if (filters.phone) query = query.or(`phone_mobile.ilike.%${filters.phone}%,phone_home.ilike.%${filters.phone}%`)
  if (filters.address) query = query.ilike('address', `%${filters.address}%`)
  if (filters.clientType && filters.clientType !== '전체') query = query.eq('client_type', filters.clientType)
  if (filters.workerId && filters.workerId !== '전체') query = query.eq('worker_id', filters.workerId)
  if (filters.status && filters.status !== '전체') query = query.eq('status', filters.status)
  if (filters.livingAlone === '예') query = query.eq('living_alone', true)
  if (filters.livingAlone === '아니오') query = query.eq('living_alone', false)
  if (filters.contractStart) query = query.gte('contract_start', filters.contractStart)
  if (filters.contractEnd) query = query.lte('contract_end', filters.contractEnd)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], total: count ?? 0 }
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`*, guardians(*), weekly_service_plans(*), users!clients_worker_id_fkey(id, name)`)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createClientAction(formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { orgId } = await getMyOrgId()

  let workerId = formData.worker_id as string | null
  if (!workerId) workerId = await autoAssignWorker(orgId)

  const { guardians, weekly_service_plans, ...clientData } = formData as {
    guardians?: Record<string, unknown>[]
    weekly_service_plans?: Record<string, unknown>[]
    [key: string]: unknown
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ ...clientData, org_id: orgId, worker_id: workerId })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (guardians?.length) {
    await supabase.from('guardians').insert(
      guardians.map((g) => ({ ...g, client_id: client.id, org_id: orgId }))
    )
  }

  if (weekly_service_plans?.length) {
    await supabase.from('weekly_service_plans').insert(
      weekly_service_plans.map((p) => ({ ...p, client_id: client.id, org_id: orgId }))
    )
  }

  revalidatePath('/clients')
  return client.id
}

export async function updateClientAction(id: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { orgId } = await getMyOrgId()

  const { guardians, weekly_service_plans, ...clientData } = formData as {
    guardians?: Record<string, unknown>[]
    weekly_service_plans?: (Record<string, unknown> & { id?: string })[]
    [key: string]: unknown
  }

  const { error } = await supabase.from('clients').update(clientData).eq('id', id)
  if (error) throw new Error(error.message)

  if (guardians !== undefined) {
    await supabase.from('guardians').delete().eq('client_id', id)
    if (guardians.length) {
      await supabase.from('guardians').insert(
        guardians.map((g) => ({ ...g, client_id: id, org_id: orgId }))
      )
    }
  }

  if (weekly_service_plans !== undefined) {
    await supabase.from('weekly_service_plans').delete().eq('client_id', id)
    if (weekly_service_plans.length) {
      const rows = weekly_service_plans.map(({ id: _id, ...rest }) => ({
        ...rest,
        client_id: id,
        org_id: orgId,
      }))
      await supabase.from('weekly_service_plans').insert(rows)
    }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update({ status: '종결' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}

export async function getInitialInterview(clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('initial_interviews')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  return data
}

export async function upsertInitialInterview(clientId: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { orgId, userId } = await getMyOrgId()

  const existing = await getInitialInterview(clientId)
  if (existing) {
    const { error } = await supabase
      .from('initial_interviews')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('initial_interviews')
      .insert({ ...formData, client_id: clientId, org_id: orgId, worker_id: userId })
    if (error) throw new Error(error.message)
  }
  revalidatePath(`/clients/${clientId}/initial-interview`)
}

export async function getEmptyAddressClients() {
  const supabase = await createClient()
  const { orgId } = await getMyOrgId()
  const { data, error } = await supabase
    .from('clients')
    .select(`*, users!clients_worker_id_fkey(id, name)`)
    .eq('org_id', orgId)
    .or('address.is.null,address.eq.')
    .eq('status', '이용')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWorkerListForOrg() {
  const supabase = await createClient()
  const { orgId } = await getMyOrgId()
  const { data } = await supabase
    .from('users')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name')
  return data ?? []
}
