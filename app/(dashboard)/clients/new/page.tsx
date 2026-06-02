import { ClientForm } from '@/components/clients/ClientForm'
import { getWorkerListForOrg } from '@/lib/actions/clients'

export default async function NewClientPage() {
  const workers = await getWorkerListForOrg()
  return <ClientForm mode="create" workers={workers} />
}
