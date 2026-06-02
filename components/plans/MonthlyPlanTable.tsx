'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlanCalendarModal } from './PlanCalendarModal'
import { getMonthlyPlanMatrix, upsertMonthlyPlan } from '@/lib/actions/plans'
import { toast } from '@/lib/hooks/use-toast'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

interface ClientRow {
  client: { id: string; name: string; gender?: string; birth_date?: string; users?: { name: string } | null }
  months: Record<number, { planned: number; actual: number }>
}

function calcAge(bd?: string) {
  if (!bd) return '-'
  return `${new Date().getFullYear() - new Date(bd).getFullYear()}세`
}

export function MonthlyPlanTable() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [calendarTarget, setCalendarTarget] = useState<{ client: ClientRow['client']; month: number } | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMonthlyPlanMatrix(year, search || undefined)
      setRows(data as ClientRow[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, search])

  useEffect(() => { load() }, [load])

  function handleCellChange(clientId: string, month: number, value: string) {
    const n = parseInt(value) || 0
    setRows((prev) => prev.map((r) =>
      r.client.id === clientId
        ? { ...r, months: { ...r.months, [month]: { ...r.months[month], planned: n } } }
        : r
    ))
    const key = `${clientId}-${month}`
    setSaving(key)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await upsertMonthlyPlan(clientId, year, month, n)
        setSaving(null)
      } catch (err) {
        toast((err as Error).message, 'destructive')
        setSaving(null)
      }
    }, 500)
  }

  const colTotals = MONTHS.map((m) =>
    rows.reduce((sum, r) => sum + (r.months[m]?.planned ?? 0), 0)
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-xl font-bold">계획등록 및 수정</h1>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="font-semibold w-16 text-center">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
        <Input
          placeholder="대상자 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-40 h-8"
        />
        <Button size="sm" onClick={load}>조회</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-2 py-2.5 text-center font-semibold text-gray-600 w-8 sticky left-0 bg-gray-50">No</th>
              <th className="px-2 py-2.5 text-left font-semibold text-gray-600 w-20 sticky left-8 bg-gray-50">대상자</th>
              <th className="px-1 py-2.5 text-center font-semibold text-gray-600 w-8">성별</th>
              <th className="px-1 py-2.5 text-center font-semibold text-gray-600 w-12">나이</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-1 py-2.5 text-center font-semibold text-gray-600 w-12">{m}월</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 합계 */}
            <tr className="border-b bg-blue-50 font-semibold">
              <td colSpan={4} className="px-2 py-2 text-right sticky left-0 bg-blue-50">합계</td>
              {colTotals.map((t, i) => (
                <td key={i} className="px-1 py-2 text-center text-blue-700">{t > 0 ? t : ''}</td>
              ))}
            </tr>
            {loading ? (
              <tr><td colSpan={16} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={16} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.client.id} className="border-b hover:bg-blue-50">
                <td className="px-2 py-1.5 text-center sticky left-0 bg-white">{i + 1}</td>
                <td className="px-2 py-1.5 font-medium sticky left-8 bg-white">{row.client.name}</td>
                <td className="px-1 py-1.5 text-center text-xs">{row.client.gender ?? '-'}</td>
                <td className="px-1 py-1.5 text-center text-xs">{calcAge(row.client.birth_date)}</td>
                {MONTHS.map((m) => {
                  const cell = row.months[m]
                  const planned = cell?.planned ?? 0
                  const key = `${row.client.id}-${m}`
                  const isSaving = saving === key
                  return (
                    <td key={m} className="px-0.5 py-1">
                      <div className="relative flex items-center justify-center">
                        {planned > 0 ? (
                          <button
                            className="text-blue-600 font-semibold text-xs w-10 h-7 rounded hover:bg-blue-100 transition-colors"
                            onClick={() => setCalendarTarget({ client: row.client, month: m })}
                          >
                            {isSaving ? '...' : planned}
                          </button>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            defaultValue=""
                            className={`w-10 h-7 text-center text-xs border rounded focus:ring-1 focus:ring-blue-400 ${isSaving ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
                            placeholder="□"
                            onChange={(e) => handleCellChange(row.client.id, m, e.target.value)}
                          />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {calendarTarget && (
        <PlanCalendarModal
          open={!!calendarTarget}
          onClose={() => { setCalendarTarget(null); load() }}
          client={calendarTarget.client as Parameters<typeof PlanCalendarModal>[0]['client']}
          year={year}
          month={calendarTarget.month}
        />
      )}
    </div>
  )
}
