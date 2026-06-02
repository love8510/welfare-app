'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrganization() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userData) return null

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', userData.org_id)
    .single()

  return data
}

export async function updateOrganization(formData: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userData) throw new Error('User not found')

  const { error } = await supabase
    .from('organizations')
    .update(formData)
    .eq('id', userData.org_id)

  if (error) throw new Error(error.message)
  revalidatePath('/organization')
}

export async function uploadOrgImage(
  base64: string,
  mimeType: string,
  type: 'logo' | 'stamp',
  orgId: string
) {
  const supabase = await createAdminClient()

  const ext = mimeType.includes('gif') ? 'gif' : 'jpg'
  const path = `${type}s/${orgId}.${ext}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await supabase.storage
    .from('org-assets')
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
  return data.publicUrl
}
