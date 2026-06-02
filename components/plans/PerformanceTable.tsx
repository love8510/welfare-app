'use client'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlanVsActualBadge } from './PlanVsActualBadge'
import { WorkLogPopup } from './WorkLogPopup'
import { getPerformanceSummary, getWorkLogsByClientMonth, deleteWorkLog } from '@/lib/actions/plans'
import { getWorkerListForOrg } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

interface PlanRow {
  id: string
  planned_count: number
  actual_count: number
  clients: { id: string; name: string; gender?: string; birth_date?: string } | null
}

interface WorkLog {
  id: string
  contacted_at: string
  service_type?: string
  duration_minutes?: number
  content?: string
  method?: string
}

function calcAge(bd?: string) {
  if (!bd) return '-'
  return `${new Date().getFullYear() - new Date(bd).getFullYear()}세`
}

export function PerformanceTable() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [workerId, setWorkerId] = useState('전체')
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sidePanel, setSidePanel] = useState<PlanRow | null>(null)
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [editLog, setEditLog] = useState<WorkLog | null>(null)
  const [, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, w] = await Promise.all([
        getPerformanceSummary(year, month, workerId === '전체' ? undefined : workerId),
        getWorkerListForOrg(),
      ])
      setRows(data as PlanRow[])
      setWorkers(w)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, month, workerId])

  useEffect(() => { load() }, [load])

  async function openSidePanel(row: PlanRow) {
    setSidePanel(row)
    if (row.clients?.id) {
      const logs = await getWorkLogsByClientMonth(row.clients.id, year, month)
      setWorkLogs(logs as WorkLog[])
    }
  }

  function handleDeleteLog(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    startTransition(async () => {
      try {
        await deleteWorkLog(id)
        toast('삭제되었습니다')
        if (sidePanel?.clients?.id) {
          const logs = await getWorkLogsByClientMonth(sidePanel.clients.id, year, month)
          setWorkLogs(logs as WorkLog[])
        }
        load()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  const totalPlanned = rows.reduce((s, r) => s + r.planned_count, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual_count, 0)
  const overallRate = totalPlanned ? Math.round((totalActual / totalPlanned) * 100) : 0
  const missingCount = rows.filter((r) => r.actual_count < r.planned_count).length

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        {/* 필터 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-xl font-bold">실적등록 및 수정</h1>
          <div className="flex items-center gap-1 ml-4">
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
            <span className="w-14 text-center font-semibold">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
          </div>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({length:12},(_,i)=>i+1).map((m)=><SelectItem key={m} value={String(m)}>{m}월</SelectItem>)}</SelectContent>
          </Select>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={load}>조회</Button>
        </div>

        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['No','대상자','성별','나이','계획','실적','달성률','미실적','업무일지'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
              ) : rows.map((r, i) => {
                const miss = Math.max(0, r.planned_count - r.actual_count)
                return (
                  <tr key={r.id} className="border-b hover:bg-blue-50">
                    <td className="px-3 py-2 text-center">{i+1}</td>
                    <td className="px-3 py-2 font-medium">{r.clients?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-center">{r.clients?.gender ?? '-'}</td>
                    <td className="px-3 py-2 text-center">{calcAge(r.clients?.birth_date)}</td>
                    <td className="px-3 py-2 text-center">{r.planned_count}</td>
                    <td className="px-3 py-2 text-center">{r.actual_count}</td>
                    <td className="px-3 py-2 text-center">
                      <PlanVsActualBadge planned={r.planned_count} actual={r.actual_count} />
                    </td>
                    <td className="px-3 py-2 text-center">{miss > 0 ? <span className="text-red-500 font-semibold">{miss}</span> : 0}</td>
                    <td className="px-3 py-2 text-center">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openSidePanel(r)}>일지보기</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 하단 요약 */}
        <div className="mt-3 flex gap-6 text-sm bg-white rounded-lg border p-3">
          <span>총 계획: <strong>{totalPlanned}건</strong></span>
          <span>총 실적: <strong>{totalActual}건</strong></span>
          <span>전체 달성률: <strong className={overallRate >= 80 ? 'text-green-600' : 'text-red-500'}>{overallRate}%</strong></span>
          <span>미실적 대상자: <strong className="text-red-500">{missingCount}명</strong></span>
        </div>
      </div>

      {/* 사이드패널 */}
      {sidePanel && (
        <div className="w-80 bg-white rounded-lg border p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{sidePanel.clients?.name} · {year}년 {month}월 업무일지</h3>
            <button className="text-gray-400 hover:text-gray-600 text-lg" onClick={() => setSidePanel(null)}>×</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['No','날짜','서비스','시간(분)','수정','삭제'].map((h) => (
                  <th key={h} className="px-1 py-1.5 text-center font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workLogs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-400">없음</td></tr>
              ) : workLogs.map((l, i) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="px-1 py-1 text-center">{i+1}</td>
                  <td className="px-1 py-1">{l.contacted_at?.split('T')[0]}</td>
                  <td className="px-1 py-1 truncate max-w-[60px]">{l.service_type ?? '-'}</td>
                  <td className="px-1 py-1 text-center">{l.duration_minutes ?? '-'}</td>
                  <td className="px-1 py-1">
                    <button className="text-blue-500 hover:underline" onClick={() => setEditLog(l)}>수정</button>
                  </td>
                  <td className="px-1 py-1">
                    <button className="text-red-500 hover:underline" onClick={() => handleDeleteLog(l.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editLog && sidePanel?.clients && (
        <WorkLogPopup
          open={!!editLog}
          onClose={() => setEditLog(null)}
          onSaved={async () => {
            if (sidePanel?.clients?.id) {
              const logs = await getWorkLogsByClientMonth(sidePanel.clients.id, year, month)
              setWorkLogs(logs as WorkLog[])
            }
            load()
          }}
          clientId={sidePanel.clients.id}
          clientName={sidePanel.clients.name}
          gender={sidePanel.clients.gender}
          birthDate={sidePanel.clients.birth_date}
          planDate={editLog.contacted_at?.split('T')[0] ?? ''}
          existingLog={{ id: editLog.id, content: editLog.content, duration_minutes: editLog.duration_minutes, service_type: editLog.service_type, method: editLog.method }}
        />
      )}
    </div>
  )
}
