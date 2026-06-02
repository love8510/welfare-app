'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChartWidget } from './BarChartWidget'
import { getWorkerStats } from '@/lib/actions/statistics'
import { getWorkerListForOrg } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

const LINE_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d']

export function WorkerStatsCrosstab() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [workerId, setWorkerId] = useState('전체')
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ workers: { id: string; name: string }[]; crosstab: Record<string, unknown>[]; lineData: Record<string, unknown>[] } | null>(null)

  useEffect(() => { getWorkerListForOrg().then(setWorkers).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getWorkerStats(year, workerId === '전체' ? undefined : workerId)
      setData(result)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, workerId])

  useEffect(() => { load() }, [load])

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
  const workerNames = (data?.workers ?? []).map((w) => w.name)
  const barData = (data?.crosstab ?? []).map((row) => ({ name: String(row.worker_name), value: row.total as number }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">담당자별 통계</h1>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
        <Select value={workerId} onValueChange={setWorkerId}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={load}>조회</Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left font-semibold">담당자</th>
                  {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-center font-semibold text-xs">{m}월</th>)}
                  <th className="px-3 py-2 text-center font-bold">합계</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">담당대상자</th>
                </tr>
              </thead>
              <tbody>
                {(data?.crosstab ?? []).map((row) => (
                  <tr key={String(row.worker_id)} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{String(row.worker_name)}</td>
                    {MONTHS.map((m) => (
                      <td key={m} className="px-2 py-2 text-center text-sm">{(row[`m${m}`] as number) || '-'}</td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold">{String(row.total)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{String(row.clients)}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 꺾은선 차트 */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">담당자별 월별 서비스 추이</h3>
            {data?.lineData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.lineData}>
                  <XAxis dataKey="month" tickFormatter={(m) => `${m}월`} />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  {workerNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>
            )}
          </div>

          {/* 총 건수 막대 차트 */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">담당자별 총 서비스 건수</h3>
            {barData.length ? (
              <BarChartWidget
                data={barData}
                dataKeys={['value']}
                xDataKey="name"
                xFormatter={(v) => String(v)}
                horizontal
                height={Math.max(240, barData.length * 40 + 60)}
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
