'use client'
import { use, useState, useEffect } from 'react'
import { getCaseById } from '@/lib/actions/cases'
import { ServicePlanForm } from '@/components/cases/ServicePlanForm'

export default function ServicePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<{ clients: { id: string; name: string }; worker: { name: string } | null } | null>(null)

  useEffect(() => {
    getCaseById(id).then((d) => setCaseData(d as typeof caseData)).catch(() => {})
  }, [id])

  if (!caseData) return <div className="text-gray-400">불러오는 중...</div>

  return (
    <ServicePlanForm
      caseId={id}
      client={caseData.clients}
      workerName={caseData.worker?.name}
    />
  )
}
