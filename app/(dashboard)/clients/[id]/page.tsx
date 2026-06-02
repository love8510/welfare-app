import { notFound } from 'next/navigation'
import { ClientForm } from '@/components/clients/ClientForm'
import { getClientById, getWorkerListForOrg } from '@/lib/actions/clients'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const [client, workers] = await Promise.all([
    getClientById(id).catch(() => null),
    getWorkerListForOrg(),
  ])

  if (!client) notFound()

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Link
          href={`/clients/${id}/initial-interview`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-input bg-background hover:bg-accent transition-colors"
        >
          초기상담기록지
        </Link>
      </div>
      <ClientForm mode="edit" client={client as Record<string, unknown>} workers={workers} />
    </div>
  )
}
