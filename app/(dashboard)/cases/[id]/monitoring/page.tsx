'use client'
import { use, useState, useEffect } from 'react'
import { getCaseById } from '@/lib/actions/cases'
import { MonitoringForm } from '@/components/cases/MonitoringForm'

export default function MonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [caseData, setCaseData] = useState<{ clients: { id: string; name: string }; worker: { name: string } | null } | null>(null)

  useEffect(() => {
    getCaseById(id).then((d) => setCaseData(d as typeof caseData)).catch(() => {})
  }, [id])

  if (!caseData) return <div className="text-gray-400">불러오는 중...</div>

  return (
    <MonitoringForm
      caseId={id}
      client={caseData.clients}
      workerName={caseData.worker?.name}
    />
  )
}
