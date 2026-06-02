'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getMyOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!data) throw new Error('User not found')
  return data.org_id as string
}

export async function getStaffList(filters?: {
  search?: string; job_title?: string; department_id?: string; employment_status?: string
}) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()

  let query = supabase
    .from('users')
    .select('*, departments(id, name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters?.job_title) query = query.eq('job_title', filters.job_title)
  if (filters?.department_id) query = query.eq('department_id', filters.department_id)
  if (filters?.employment_status) {
    query = query.eq('employment_status', filters.employment_status)
  } else {
    query = query.neq('employment_status', '퇴사')
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStaffById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*, departments(id, name), salary_base(*), employment_contracts(*), staff_counsel_logs(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createStaff(formData: {
  email: string; password: string; name: string
  job_title?: string; department_id?: string; hire_date?: string
  work_start_date?: string; employment_type?: string; employment_status?: string
  phone?: string; mobile?: string; gender?: string; birth_date?: string
  id_number?: string; address?: string; address_detail?: string; zipcode?: string
  main_duties?: string; user_id_login?: string; employee_no?: string
}) {
  const admin = await createAdminClient()
  const orgId = await getMyOrgId()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })
  if (authError) throw new Error('계정 생성 실패: ' + authError.message)

  const userId = authData.user.id
  const { error: userError } = await admin.from('users').insert({
    id: userId, org_id: orgId,
    name: formData.name, email: formData.email,
    job_title: formData.job_title || null,
    department_id: formData.department_id || null,
    hire_date: formData.hire_date || null,
    work_start_date: formData.work_start_date || null,
    employment_type: formData.employment_type || '정규직',
    employment_status: formData.employment_status || '재직',
    phone: formData.phone || null, mobile: formData.mobile || null,
    gender: formData.gender || null, birth_date: formData.birth_date || null,
    id_number: formData.id_number || null,
    address: formData.address || null, address_detail: formData.address_detail || null,
    zipcode: formData.zipcode || null,
    main_duties: formData.main_duties || null,
    user_id_login: formData.user_id_login || null,
    employee_no: formData.employee_no || null,
    is_active: true,
  })

  if (userError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error('직원 등록 실패: ' + userError.message)
  }

  revalidatePath('/organization/staff')
  return userId
}

export async function updateStaff(id: string, formData: Record<string, unknown>) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  if (formData.employment_status === '퇴사' && !formData.resign_date) {
    formData.resign_date = new Date().toISOString().split('T')[0]
  }
  const { error } = await supabase
    .from('users')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id).eq('org_id', orgId)
  if (error) throw new Error(error.message)
  revalidatePath('/organization/staff')
}

export async function deleteStaff(id: string) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase
    .from('users')
    .update({ employment_status: '퇴사', is_active: false, resign_date: new Date().toISOString().split('T')[0] })
    .eq('id', id).eq('org_id', orgId)
  if (error) throw new Error(error.message)
  revalidatePath('/organization/staff')
}

export async function resetPassword(userId: string, newPassword: string) {
  const admin = await createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) throw new Error(error.message)
}

export async function upsertSalaryBase(userId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase
    .from('salary_base')
    .upsert({ ...data, user_id: userId, org_id: orgId, updated_at: new Date().toISOString() },
      { onConflict: 'org_id,user_id' })
  if (error) throw new Error(error.message)
  revalidatePath(`/organization/staff/${userId}`)
}

export async function createContract(userId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase.from('employment_contracts')
    .insert({ ...data, user_id: userId, org_id: orgId })
  if (error) throw new Error(error.message)
  revalidatePath(`/organization/staff/${userId}`)
}

export async function deleteContract(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('employment_contracts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createCounselLog(userId: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase.from('staff_counsel_logs')
    .insert({ ...data, user_id: userId, org_id: orgId })
  if (error) throw new Error(error.message)
  revalidatePath(`/organization/staff/${userId}`)
}

export async function deleteCounselLog(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('staff_counsel_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadStaffPhoto(userId: string, base64: string, mimeType: string) {
  const admin = await createAdminClient()
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const path = `${userId}.${ext}`
  const buffer = Buffer.from(base64, 'base64')
  const { error } = await admin.storage
    .from('staff-photos')
    .upload(path, buffer, { contentType: mimeType, upsert: true })
  if (error) throw new Error(error.message)
  const { data } = admin.storage.from('staff-photos').getPublicUrl(path)
  await admin.from('users').update({ photo_url: data.publicUrl }).eq('id', userId)
  return data.publicUrl
}

export async function getDepartments() {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { data } = await supabase.from('departments').select('id, name').eq('org_id', orgId).order('name')
  return data ?? []
}

export async function createDepartment(name: string) {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { error } = await supabase.from('departments').insert({ org_id: orgId, name })
  if (error) throw new Error(error.message)
  revalidatePath('/organization/departments')
}

export async function updateDepartment(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('departments').update({ name }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/organization/departments')
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/organization/departments')
}

export async function getRoles() {
  const supabase = await createClient()
  const orgId = await getMyOrgId()
  const { data } = await supabase.from('roles').select('*').eq('org_id', orgId)
  return data ?? []
}
