'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatsSummaryCard } from './StatsSummaryCard'
import { BarChartWidget } from './BarChartWidget'
import { PieChartWidget } from './PieChartWidget'
import { getMonthlyStats, getStatsSummary } from '@/lib/actions/statistics'
import { toast } from '@/lib/hooks/use-toast'

export function MonthlyStatsCrosstab() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ serviceTypes: string[]; chartData: Record<string, unknown>[]; crosstab: Record<string, unknown>[]; pieData: { name: string; value: number }[] } | null>(null)
  const [summary, setSummary] = useState<{ totalServices: number; totalClients: number; avgAchievementRate: number; dangerClients: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, sum] = await Promise.all([getMonthlyStats(year), getStatsSummary(year)])
      setStats(s)
      setSummary(sum)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">월별 통계</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
          <Button size="sm" onClick={load}>조회</Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="flex gap-4">
        <StatsSummaryCard label="총 서비스 건수" value={`${(summary?.totalServices ?? 0).toLocaleString()}건`} color="blue" />
        <StatsSummaryCard label="총 대상자 수" value={`${summary?.totalClients ?? 0}명`} color="green" />
        <StatsSummaryCard label="평균 달성률" value={`${summary?.avgAchievementRate ?? 0}%`} color="yellow" />
        <StatsSummaryCard label="미접촉 위험" value={`${summary?.dangerClients ?? 0}명`} color="red" href="/clients?status=danger" />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <div className="flex gap-4">
            {/* 크로스탭 */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">서비스종류</th>
                      {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-center font-semibold text-gray-600 text-xs">{m}월</th>)}
                      <th className="px-3 py-2 text-center font-bold text-gray-700">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.crosstab ?? []).map((row) => (
                      <tr key={String(row.service_type)} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{String(row.service_type)}</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-2 py-2 text-center text-sm">{(row[`m${m}`] as number) || '-'}</td>
                        ))}
                        <td className="px-3 py-2 text-center font-bold">{String(row.total)}</td>
                      </tr>
                    ))}
                    {/* 합계 행 */}
                    <tr className="bg-blue-50 font-bold border-b">
                      <td className="px-3 py-2">합 계</td>
                      {MONTHS.map((m) => {
                        const sum = (stats?.crosstab ?? []).reduce((s, r) => s + ((r[`m${m}`] as number) || 0), 0)
                        return <td key={m} className="px-2 py-2 text-center text-sm">{sum || '-'}</td>
                      })}
                      <td className="px-3 py-2 text-center">
                        {(stats?.crosstab ?? []).reduce((s, r) => s + ((r.total as number) || 0), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 파이 차트 */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-sm font-semibold mb-2">서비스별 비율</h3>
                {stats?.pieData.length ? (
                  <PieChartWidget data={stats.pieData} width={300} height={300} />
                ) : (
                  <div className="w-[300px] h-[300px] flex items-center justify-center text-gray-400 text-sm">데이터 없음</div>
                )}
              </div>
            </div>
          </div>

          {/* 막대 차트 */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">월별 서비스 건수 (서비스 종류별)</h3>
            {stats?.chartData.length ? (
              <BarChartWidget
                data={stats.chartData}
                dataKeys={stats.serviceTypes}
                xDataKey="month"
                xFormatter={(m) => `${m}월`}
                stacked
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
