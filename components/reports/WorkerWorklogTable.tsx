'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWorkerWorklog } from '@/lib/actions/statistics'
import { toast } from '@/lib/hooks/use-toast'
import * as XLSX from 'xlsx'

interface WorklogRow {
  worker_id: string; worker_name: string
  client_count: number; service_count: number; total_minutes: number
}

export function WorkerWorklogTable() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<WorklogRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWorkerWorklog(year, month)
      setRows(data)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const totalServices = rows.reduce((s, r) => s + r.service_count, 0)
  const totalMinutes = rows.reduce((s, r) => s + (r.total_minutes ?? 0), 0)

  function downloadExcel() {
    const header = ['담당자', '담당 대상자 수', '총 서비스 건수', '총 서비스 시간(분)', '1일 평균(건)', '비고']
    const dataRows = rows.map((r) => [
      r.worker_name, r.client_count, r.service_count,
      r.total_minutes ?? 0, Math.round((r.service_count / 22) * 10) / 10, ''
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows])
    ws['!cols'] = [{wch:12},{wch:14},{wch:14},{wch:18},{wch:12},{wch:10}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '담당자근무현황표')
    XLSX.writeFile(wb, `담당자근무현황표_${year}년${month}월.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">담당자 근무현황표</h1>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>{m}월</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={load}>조회</Button>
        <Button variant="outline" size="sm" onClick={downloadExcel}>엑셀출력</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['담당자','담당 대상자 수','총 서비스 건수','총 서비스 시간(분)','1일 평균(건)','비고'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 border-r last:border-r-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
            ) : (
              <>
                {rows.map((r) => (
                  <tr key={r.worker_id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium border-r">{r.worker_name}</td>
                    <td className="px-3 py-2 text-center border-r">{r.client_count}명</td>
                    <td className="px-3 py-2 text-center border-r">{r.service_count}건</td>
                    <td className="px-3 py-2 text-center border-r">{(r.total_minutes ?? 0).toLocaleString()}분</td>
                    <td className="px-3 py-2 text-center border-r">{Math.round((r.service_count / 22) * 10) / 10}건</td>
                    <td className="px-3 py-2"></td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-3 py-2 border-r">합계</td>
                  <td className="px-3 py-2 text-center border-r">-</td>
                  <td className="px-3 py-2 text-center border-r">{totalServices}건</td>
                  <td className="px-3 py-2 text-center border-r">{totalMinutes.toLocaleString()}분</td>
                  <td className="px-3 py-2 text-center border-r">-</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
