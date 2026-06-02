'use client'
import { use, useState, useEffect } from 'react'
import { getCaseById } from '@/lib/actions/cases'
import { InitialInterviewForm } from '@/components/cases/InitialInterviewForm'

interface Client {
  id: string; name: string; gender?: string; birth_date?: string
  id_number?: string; address?: string; phone_home?: string; phone_mobile?: string
}

export default function InitialInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<{ clients: Client; worker: { name: string } | null } | null>(null)

  useEffect(() => {
    getCaseById(id).then((d) => setCaseData(d as typeof caseData)).catch(() => {})
  }, [id])

  if (!caseData) return <div className="text-gray-400">불러오는 중...</div>

  return (
    <InitialInterviewForm
      caseId={id}
      client={caseData.clients}
      workerName={caseData.worker?.name}
    />
  )
}
