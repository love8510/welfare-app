'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCaseById } from '@/lib/actions/cases'
import { CaseProgressBar } from '@/components/cases/CaseProgressBar'
import { cn } from '@/lib/utils'

const TABS = [
  { label: '초기면접기록', href: 'initial-interview' },
  { label: '사정기록', href: 'assessment' },
  { label: '서비스계획', href: 'service-plan' },
  { label: '과정상담', href: 'process-counsel' },
  { label: '재 사정기록', href: 'reassessment' },
  { label: '재평가', href: 'reevaluation' },
  { label: '모니터링기록', href: 'monitoring' },
  { label: '사례평가서', href: 'evaluation' },
  { label: '서비스종결', href: 'close' },
]

interface CaseData {
  id: string; case_no: number; received_at: string; is_closed: boolean
  clients: { id: string; name: string; gender?: string; birth_date?: string; phone_mobile?: string }
  worker: { id: string; name: string } | null
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pathname = usePathname()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCaseById(id)
      .then((d) => setCaseData(d as CaseData))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-10 text-gray-400">불러오는 중...</div>
  if (!caseData) return <div className="text-center py-10 text-gray-400">사례를 찾을 수 없습니다</div>

  const age = caseData.clients?.birth_date
    ? `${new Date().getFullYear() - new Date(caseData.clients.birth_date).getFullYear()}세`
    : '-'

  return (
    <div className="space-y-4">
      {/* 대상자 정보 바 */}
      <div className="bg-white rounded-lg border p-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="font-bold text-base">{caseData.clients?.name}</span>
        <span className="text-gray-500">{caseData.clients?.gender ?? '-'}</span>
        <span className="text-gray-500">{age}</span>
        <span className="text-gray-500">{caseData.clients?.phone_mobile ?? '-'}</span>
        <span className="text-gray-500">담당: {caseData.worker?.name ?? '-'}</span>
        <span className="text-gray-500">접수일: {caseData.received_at}</span>
        <span className="font-semibold text-blue-600">{caseData.case_no}차</span>
        {caseData.is_closed && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-semibold">종결</span>
        )}
      </div>

      <CaseProgressBar completedSteps={['received']} />

      <div className="flex gap-4">
        {/* 탭 사이드바 */}
        <nav className="w-40 flex-shrink-0 bg-white rounded-lg border overflow-hidden">
          {TABS.map((tab) => {
            const href = `/cases/${id}/${tab.href}`
            const isActive = pathname === href
            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  'block px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors',
                  isActive
                    ? 'bg-green-50 text-[#2d7a2d] font-semibold border-r-2 border-r-[#2d7a2d]'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 min-w-0 bg-white rounded-lg border p-6">
          <p className="text-gray-400 text-sm">좌측 메뉴에서 탭을 선택하세요.</p>
        </div>
      </div>
    </div>
  )
}
