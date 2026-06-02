'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChartWidget } from './BarChartWidget'
import { getServiceStats } from '@/lib/actions/statistics'
import { toast } from '@/lib/hooks/use-toast'

export function ServiceStatsCrosstab() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [serviceType, setServiceType] = useState('전체')
  const [month, setMonth] = useState<string>('전체')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ serviceTypes: string[]; crosstab: Record<string, unknown>[]; barData: { name: string; value: number }[] } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getServiceStats(
        year,
        serviceType === '전체' ? undefined : serviceType,
        month === '전체' ? undefined : Number(month)
      )
      setData(result)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, serviceType, month])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">서비스별 통계</h1>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">서비스 전체</SelectItem>
            {(data?.serviceTypes ?? []).map((st) => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>{m}월</SelectItem>
            ))}
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
                  {(data?.serviceTypes ?? []).map((st) => (
                    <th key={st} className="px-3 py-2 text-center font-semibold">{st}</th>
                  ))}
                  <th className="px-3 py-2 text-center font-bold">합계</th>
                </tr>
              </thead>
              <tbody>
                {(data?.crosstab ?? []).map((row) => (
                  <tr key={String(row.worker_id)} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{String(row.worker_name)}</td>
                    {(data?.serviceTypes ?? []).map((st) => (
                      <td key={st} className="px-3 py-2 text-center">{(row[st] as number) || '-'}</td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold">{String(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">담당자별 서비스 건수</h3>
            {data?.barData.length ? (
              <BarChartWidget
                data={data.barData}
                dataKeys={['value']}
                xDataKey="name"
                xFormatter={(v) => String(v)}
                horizontal
                height={Math.max(240, (data.barData.length) * 40 + 60)}
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
