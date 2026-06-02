'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DangerClientCard } from './DangerClientCard'
import { ContactStatusBadge } from './ContactStatusBadge'
import {
  getContactStatusSummary, getContactStatusList, getWorkersForMonitoring,
  ContactStatus, ContactStatusRow,
} from '@/lib/actions/monitoring'
import { toast } from '@/lib/hooks/use-toast'

type StatusFilter = 'all' | ContactStatus

const SUMMARY_CARDS = [
  { key: 'total',   label: '전체 대상자', color: 'bg-gray-50 border-gray-200 text-gray-700' },
  { key: 'normal',  label: '정상 (0~2일)', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'warning', label: '주의 (3~6일)', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'danger',  label: '위험 (7일+)',  color: 'bg-red-50 border-red-200 text-red-700' },
]

export function ContactStatusDashboard() {
  const [summary, setSummary] = useState({ total: 0, normal: 0, warning: 0, danger: 0, never: 0 })
  const [clients, setClients] = useState<ContactStatusRow[]>([])
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [workerFilter, setWorkerFilter] = useState('전체')
  const [sortBy, setSortBy] = useState<'days_desc' | 'days_asc' | 'name'>('days_desc')
  const [loading, setLoading] = useState(true)
  const [showNormal, setShowNormal] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => { getWorkersForMonitoring().then(setWorkers).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sum, list] = await Promise.all([
        getContactStatusSummary(),
        getContactStatusList({
          status: statusFilter === 'all' ? undefined : statusFilter,
          workerId: workerFilter === '전체' ? undefined : workerFilter,
          sortBy,
        }),
      ])
      setSummary(sum)
      setClients(list)
      setLastUpdated(new Date())
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, workerFilter, sortBy])

  useEffect(() => { load() }, [load])

  const dangerList  = clients.filter((c) => c.contact_status === 'danger')
  const warningList = clients.filter((c) => c.contact_status === 'warning')
  const neverList   = clients.filter((c) => c.contact_status === 'never')
  const normalList  = clients.filter((c) => c.contact_status === 'normal')
  const urgentList  = [...dangerList, ...neverList, ...warningList]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">미접촉 감지 대시보드</h1>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? '로딩중...' : '새로고침'}
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3">
        {SUMMARY_CARDS.map(({ key, label, color }) => {
          const val = summary[key as keyof typeof summary]
          const pct = summary.total > 0 && key !== 'total' ? ` (${Math.round(val / summary.total * 100)}%)` : ''
          return (
            <div
              key={key}
              className={`rounded-lg border p-4 cursor-pointer transition-all ${color} ${statusFilter === key || (key === 'total' && statusFilter === 'all') ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => setStatusFilter(key === 'total' ? 'all' : key as ContactStatus)}
            >
              <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
              <div className="text-2xl font-bold">{val}명{pct}</div>
            </div>
          )
        })}
      </div>
      {summary.never > 0 && (
        <div className="text-sm text-gray-500">
          접촉이력 없음: <span className="font-semibold text-gray-700">{summary.never}명</span>
        </div>
      )}

      {/* 필터 바 */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="normal">정상</SelectItem>
            <SelectItem value="warning">주의</SelectItem>
            <SelectItem value="danger">위험</SelectItem>
            <SelectItem value="never">접촉없음</SelectItem>
          </SelectContent>
        </Select>
        <Select value={workerFilter} onValueChange={setWorkerFilter}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">담당자 전체</SelectItem>
            {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="days_desc">미접촉 일수 내림차순</SelectItem>
            <SelectItem value="days_asc">미접촉 일수 오름차순</SelectItem>
            <SelectItem value="name">이름순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <>
          {/* 위험/주의/접촉없음 카드 */}
          {urgentList.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {urgentList.map((c) => (
                <DangerClientCard key={c.id} client={c} onRefresh={load} />
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-green-700 font-semibold">위험/주의 대상자가 없습니다</div>
              <div className="text-green-600 text-sm mt-1">모든 대상자가 정상 접촉 상태입니다.</div>
            </div>
          )}

          {/* 정상 대상자 접이식 */}
          {normalList.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                onClick={() => setShowNormal((v) => !v)}
              >
                <span>{showNormal ? '▲' : '▼'} 정상 대상자 {normalList.length}명 {showNormal ? '접기' : '보기'}</span>
                <ContactStatusBadge status="normal" size="sm" />
              </button>
              {showNormal && (
                <div className="divide-y">
                  {normalList.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium w-16">{c.name}</span>
                        <span className="text-gray-500 text-xs">{c.gender === 'F' ? '여' : '남'} {c.age}세</span>
                        {c.living_alone && <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">독거</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>담당: {c.worker_name}</span>
                        <span>{c.days_no_contact < 9999 ? `${c.days_no_contact}일 전` : '접촉없음'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
