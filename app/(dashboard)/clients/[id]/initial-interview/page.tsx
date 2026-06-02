import { notFound } from 'next/navigation'
import { getClientById, getInitialInterview } from '@/lib/actions/clients'
import { getOrganization } from '@/lib/actions/organization'
import { InitialInterviewWrapper } from './InitialInterviewWrapper'

interface Props { params: Promise<{ id: string }> }

export default async function InitialInterviewPage({ params }: Props) {
  const { id } = await params
  const [client, interview, org] = await Promise.all([
    getClientById(id).catch(() => null),
    getInitialInterview(id),
    getOrganization(),
  ])

  if (!client) notFound()

  return (
    <InitialInterviewWrapper
      client={client as Record<string, unknown>}
      interview={interview as Record<string, unknown> | null}
      org={org as Record<string, unknown> | null}
    />
  )
}
