'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { MonthlyMemoModal } from './MonthlyMemoModal'
import { getWorkerScheduleMatrix } from '@/lib/actions/plans'
import { toast } from '@/lib/hooks/use-toast'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

interface WorkerRow {
  worker: { id: string; name: string }
  months: Record<number, { plan_count: number; memo: string }>
}

export function WorkerScheduleMatrix() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<WorkerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ workerId: string; workerName: string; month: number; planCount: number; memo: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWorkerScheduleMatrix(year)
      setRows(data as WorkerRow[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  const colTotals = MONTHS.map((m) =>
    rows.reduce((sum, r) => sum + (r.months[m]?.plan_count ?? 0), 0)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">담당자별 일정등록</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="font-semibold text-lg w-16 text-center">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 w-24">담당자</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-2 py-2.5 text-center font-semibold text-gray-600 w-14">{m}월</th>
              ))}
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">일정 메모</th>
            </tr>
          </thead>
          <tbody>
            {/* 합계 행 */}
            <tr className="border-b bg-blue-50 font-semibold">
              <td className="px-3 py-2 sticky left-0 bg-blue-50">합계</td>
              {colTotals.map((t, i) => (
                <td key={i} className="px-2 py-2 text-center text-blue-700">{t > 0 ? t : ''}</td>
              ))}
              <td />
            </tr>
            {loading ? (
              <tr><td colSpan={15} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : rows.map((row) => (
              <tr key={row.worker.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-medium sticky left-0 bg-white">{row.worker.name}</td>
                {MONTHS.map((m) => {
                  const cell = row.months[m]
                  const count = cell?.plan_count ?? 0
                  return (
                    <td key={m} className="px-1 py-2 text-center">
                      <button
                        className={`w-10 h-7 rounded text-xs font-medium transition-colors ${
                          count > 0
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-300 hover:bg-gray-100'
                        }`}
                        onClick={() => setModal({
                          workerId: row.worker.id,
                          workerName: row.worker.name,
                          month: m,
                          planCount: count,
                          memo: cell?.memo ?? '',
                        })}
                      >
                        {count > 0 ? count : '□'}
                      </button>
                    </td>
                  )
                })}
                <td className="px-3 py-2">
                  <button
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => {
                      const curMonth = new Date().getMonth() + 1
                      const cell = row.months[curMonth]
                      setModal({
                        workerId: row.worker.id,
                        workerName: row.worker.name,
                        month: curMonth,
                        planCount: cell?.plan_count ?? 0,
                        memo: cell?.memo ?? '',
                      })
                    }}
                  >
                    일정메모 클릭
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <MonthlyMemoModal
          open={!!modal}
          onClose={() => { setModal(null); load() }}
          workerName={modal.workerName}
          workerId={modal.workerId}
          year={year}
          month={modal.month}
          planCount={modal.planCount}
          initialMemo={modal.memo}
        />
      )}
    </div>
  )
}
