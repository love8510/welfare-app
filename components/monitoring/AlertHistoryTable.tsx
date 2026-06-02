'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAlertHistory, resolveAlert, getWorkersForMonitoring } from '@/lib/actions/monitoring'
import { toast } from '@/lib/hooks/use-toast'

type AlertRow = Record<string, unknown>

export function AlertHistoryTable() {
  const [rows, setRows] = useState<AlertRow[]>([])
  const [total, setTotal] = useState(0)
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(monthAgo)
  const [endDate, setEndDate] = useState(today)
  const [clientName, setClientName] = useState('')
  const [workerId, setWorkerId] = useState('전체')
  const [sendType, setSendType] = useState<'all' | 'auto' | 'manual'>('all')
  const [isSuccess, setIsSuccess] = useState<'all' | 'true' | 'false'>('all')

  useEffect(() => { getWorkersForMonitoring().then(setWorkers).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { rows: data, total: cnt } = await getAlertHistory({
        startDate,
        endDate,
        clientName: clientName || undefined,
        workerId: workerId === '전체' ? undefined : workerId,
        sendType: sendType === 'all' ? undefined : sendType,
        isSuccess: isSuccess === 'all' ? undefined : isSuccess === 'true',
      })
      setRows(data as AlertRow[])
      setTotal(cnt)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, clientName, workerId, sendType, isSuccess])

  useEffect(() => { load() }, [load])

  async function handleResolve(id: string) {
    try {
      await resolveAlert(id)
      toast('해제되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">알림 발송 이력</h1>

      {/* 필터 */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <div className="text-xs text-gray-500 mb-1">시작일</div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-sm w-36" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">종료일</div>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-sm w-36" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">대상자 이름</div>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="이름 검색" className="h-8 text-sm w-28" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">담당자</div>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">발송방식</div>
            <Select value={sendType} onValueChange={(v) => setSendType(v as typeof sendType)}>
              <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="auto">자동</SelectItem>
                <SelectItem value="manual">수동</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">성공여부</div>
            <Select value={isSuccess} onValueChange={(v) => setIsSuccess(v as typeof isSuccess)}>
              <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">성공</SelectItem>
                <SelectItem value="false">실패</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={load}>조회</Button>
        </div>
        <div className="text-xs text-gray-500">총 {total}건</div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['No','발송일시','대상자','미접촉일수','담당자','발송방식','성공여부','해제여부','해제'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap border-r last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">이력이 없습니다</td></tr>
              ) : (
                rows.map((r, i) => {
                  const client = r.clients as Record<string, string> | null
                  const worker = (r as Record<string, unknown>)['users!alerts_worker_id_fkey'] as Record<string, string> | null
                  const sentAt = r.created_at ? new Date(r.created_at as string).toLocaleString('ko-KR') : '-'
                  const days = r.days_no_contact != null ? `${r.days_no_contact}일` : '기록없음'
                  const isAuto = r.send_type === 'auto'
                  const success = r.is_success !== false
                  const resolved = Boolean(r.resolved)
                  return (
                    <tr key={r.id as string} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-center border-r text-xs text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2 text-center border-r text-xs whitespace-nowrap">{sentAt}</td>
                      <td className="px-3 py-2 font-medium border-r">{client?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-center border-r">{days}</td>
                      <td className="px-3 py-2 text-center border-r">{worker?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-center border-r">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isAuto ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {isAuto ? '자동' : '수동'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center border-r">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          title={!success && r.error_msg ? String(r.error_msg) : undefined}
                        >
                          {success ? '성공' : '실패'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center border-r">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {resolved ? '해제됨' : '미해제'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {!resolved && (
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleResolve(r.id as string)}>
                            해제
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
