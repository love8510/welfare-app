import { getOrganization } from '@/lib/actions/organization'
import { OrgInfoForm } from '@/components/organization/OrgInfoForm'
import { redirect } from 'next/navigation'

export default async function OrganizationPage() {
  const org = await getOrganization()
  if (!org) redirect('/setup')
  return <OrgInfoForm org={org as Record<string, unknown>} />
}
