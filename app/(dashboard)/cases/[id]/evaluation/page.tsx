'use client'
import { use, useState, useEffect } from 'react'
import { getCaseById } from '@/lib/actions/cases'
import { EvaluationForm } from '@/components/cases/EvaluationForm'

interface CaseData {
  id: string; is_closed: boolean
  clients: { id: string; name: string }
  worker: { name: string } | null
}

export default function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<CaseData | null>(null)

  useEffect(() => {
    getCaseById(id).then((d) => setCaseData(d as CaseData)).catch(() => {})
  }, [id])

  if (!caseData) return <div className="text-gray-400">불러오는 중...</div>

  return (
    <EvaluationForm
      caseId={id}
      client={caseData.clients}
      workerName={caseData.worker?.name}
      isClosed={caseData.is_closed}
    />
  )
}
